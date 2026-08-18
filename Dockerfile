# Manifest builder
#
# Prunes the source tree down to the manifests that `npm install` reads and
# applies the dependency patches on them. Any change outside of these files
# leaves this stage's output byte identical, so the `COPY --from=manifests`
# below keeps its cache and the install layer is not rebuilt.
FROM node:24-alpine AS manifests
ARG TARGETPLATFORM
ARG NO_SHARP

COPY scripts/disable-dependency.js /src/scripts/
COPY package.json /src/
# Only the manifest is needed, the root postinstall runs `npm --prefix e2e install`
COPY e2e/package.json /src/e2e/
COPY packages /src/packages/
WORKDIR /src

# Keep the bin/ dirs: npm links workspace bins during install and silently skips
# any whose target is missing, which would leave `dev-cli` unresolvable at build
RUN find packages -mindepth 2 -maxdepth 2 ! -name package.json ! -name bin -prune -exec rm -rf {} + && \
  node scripts/disable-dependency.js api-server && \
  if [[ -n "$NO_SHARP" || "$TARGETPLATFORM" == "linux/arm/v6" || "$TARGETPLATFORM" == "linux/arm/v7" ]]; then node scripts/disable-dependency.js --prefix=packages/extractor sharp ; fi && \
  rm -rf scripts


# Image builder
FROM node:24-alpine AS builder
WORKDIR /build

COPY .npmrc /build/
COPY --from=manifests /src/ /build/

RUN npm install --no-audit --loglevel verbose

COPY *.json *.yaml *.js *.md *.yml LICENSE CHANGELOG.md CONTRIBUTING.md /build/
COPY scripts /build/scripts/
COPY packages /build/packages/
# The copies above restored the untouched manifests, put the patched ones back
COPY --from=manifests /src/ /build/

RUN npm run build --loglevel verbose
RUN node scripts/bundle.js --bundle-file=bundle-docker.yml && \
  mkdir -p app && tar -xvf dist/latest/home-gallery-*.tar.gz -C app


# Final image
FROM node:24-alpine

RUN apk add --no-cache \
  ffmpeg \
  vips-tools \
  perl

LABEL org.opencontainers.image.authors="jurakovic"
LABEL org.opencontainers.image.url="https://home-gallery.org"
LABEL org.opencontainers.image.documentation="https://docs.home-gallery.org"
LABEL org.opencontainers.image.source="https://github.com/jurakovic/home-gallery"
LABEL org.opencontainers.image.licenses="MIT"

COPY --from=builder /build/app /app

VOLUME [ "/data" ]

WORKDIR /data

ENV HOME=/data
ENV GALLERY_BASE_DIR=/data
ENV GALLERY_CONFIG_DIR=/data/config
ENV GALLERY_CACHE_DIR=/data
ENV GALLERY_CONFIG=/data/config/gallery.config.yml
ENV GALLERY_OPEN_BROWSER=false
ENV GALLERY_USE_NATIVE=ffprobe,ffmpeg
# Use polling for safety of possible network mounts. Try 0 to use inotify via fs.watch
ENV GALLERY_WATCH_POLL_INTERVAL=300

EXPOSE 3000

ENTRYPOINT [ "node", "/app/gallery.js" ]
