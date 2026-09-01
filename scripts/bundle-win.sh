#!/usr/bin/env bash
#
# Build a Windows x64 HomeGallery bundle as tar.gz archive, without the caxa
# exe stub. Run it from Git Bash on a Windows x64 host: the native modules
# (sharp, ffmpeg, ffprobe, exiftool) are taken from the host installation, so
# this does not cross compile.
#
# Usage: scripts/bundle-win.sh [options]
#
#   --version=<version>   Archive version, default the root package.json version
#   --snapshot=<suffix>   Name suffix, default -<branch>-<short sha>
#   --node=<version>      NodeJS runtime to embed, default 24.14.0
#   --no-install          Skip `npm ci`, reuse the current node_modules
#   --no-build            Skip the clean and `npm run build`
#   -h, --help            Print this help
#
# The result is dist/<version>/home-gallery-<version><snapshot>-win-x64.tar.gz
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

nodeVersion=24.14.0
version=
snapshot=
install=1
build=1

for arg in "$@"; do
  case "$arg" in
    --version=*) version=${arg#*=} ;;
    --snapshot=*) snapshot=${arg#*=} ;;
    --node=*) nodeVersion=${arg#*=} ;;
    --no-install) install=0 ;;
    --no-build) build=0 ;;
    -h|--help) sed -n '2,17p' "$0" | cut -c 3-; exit 0 ;;
    *) echo "Unknown option $arg" >&2; exit 1 ;;
  esac
done

if [ -z "$version" ]; then
  version=$(node -p "require('./package.json').version")
fi
if [ -z "$snapshot" ]; then
  branch=$(git rev-parse --abbrev-ref HEAD | sed 's![^A-Za-z0-9.]!-!g')
  snapshot="-${branch}-$(git rev-parse --short=8 HEAD)"
fi

step() { echo; echo "==> $*"; }

if [ "$install" = 1 ]; then
  # npm ci requires a lock file and the repository does not ship one. Resolve
  # it with --force like the release workflow does, the peer dependencies of
  # the workspace packages do not resolve otherwise
  if [ ! -f package-lock.json ]; then
    step "Creating package-lock.json"
    npm install --package-lock-only --force --ignore-scripts
  fi
  # --ignore-scripts is safe here: sharp, ffmpeg, ffprobe and exiftool ship
  # their win32-x64 binaries as optional dependencies, no install hook needed
  step "Installing dependencies"
  npm ci --ignore-scripts
fi

if [ "$build" = 1 ]; then
  # `npm run clean` runs `rimraf dist *.tsbuildinfo` in every package which
  # fails on Windows: cmd.exe does not expand the glob and rimraf rejects the
  # literal `*` as an illegal path character. Clean with posix tooling instead
  step "Cleaning package output"
  rm -rf packages/*/dist packages/*/*.tsbuildinfo ./*.tsbuildinfo

  step "Building packages"
  npm run build
fi

step "Downloading NodeJS $nodeVersion for win-x64"
node scripts/download-nodejs.js "--version=$nodeVersion" --platforms=win-x64 --targetDir=node

step "Writing .build.json"
bash scripts/build-info.sh "local-$(hostname 2>/dev/null || echo build)"

step "Bundling win-x64 archive"
chmod +x bundle-run.sh
node scripts/bundle.js --bundle-file=bundle-win.yml "--version=$version" "--snapshot=$snapshot"

archive="dist/$version/home-gallery-$version$snapshot-win-x64.tar.gz"
if [ ! -f "$archive" ]; then
  echo "Expected archive $archive was not created" >&2
  exit 1
fi

echo
echo "Created $archive"
ls -lh "$archive"
echo
echo "Unpack and run it with:"
echo "  tar xzf $archive -C /d/apps"
echo "  /d/apps/home-gallery/run.sh run server"
