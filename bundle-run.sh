#!/bin/sh
#
# Launcher of an unpacked HomeGallery bundle, shipped as `run.sh` in the archive
# root. All arguments are passed to the gallery CLI, e.g. `./run.sh run server`
#
# The bundle ships its own NodeJS runtime below `node/`, nothing needs to be
# installed on the host
set -e

dir=$(cd "$(dirname "$0")" && pwd)

node="$dir/node/bin/node"
if [ ! -f "$node" ]; then
  node="$dir/node/node.exe"
fi
if [ ! -f "$node" ]; then
  echo "No NodeJS runtime found in $dir/node" >&2
  exit 1
fi

# node.exe is a native Windows binary and expects a Windows path. Without the
# conversion it would receive the MSYS path of gallery.js like /d/apps/gallery
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) dir=$(cygpath -m "$dir") ;;
esac

exec "$node" "$dir/gallery.js" "$@"
