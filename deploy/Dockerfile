# =========================
# Builder Stage
# =========================
FROM node:22-slim AS builder
WORKDIR /app

# Copy source
COPY homepage-src/ .
RUN mkdir -p config

# Install dependencies, run our customization tests as a gate, then build.
# The vitest step covers the config-editor + the core files we modify for it
# (service-helpers/api-response/widget-helpers) — the parts most likely to break
# on an upstream merge. A failure here fails the build, so a bad merge can't deploy.
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10 --activate && \
    pnpm install --frozen-lockfile --prefer-offline && \
    pnpm vitest run src/utils/config src/utils/config-editor && \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_BUILDTIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z") \
    NEXT_PUBLIC_VERSION="pmc-custom" \
    NEXT_PUBLIC_REVISION="local" \
    pnpm run build

# =========================
# Runtime Stage
# =========================
FROM node:22-alpine AS runner
LABEL org.opencontainers.image.title="Homepage PMC Custom"
LABEL org.opencontainers.image.description="Homepage with integrated config editor"

WORKDIR /app

# Copy files from source context
COPY --link --chown=1000:1000 homepage-src/public ./public/
COPY --link --chmod=755 homepage-src/docker-entrypoint.sh /usr/local/bin/

# Copy build output
COPY --link --from=builder --chown=1000:1000 /app/.next/standalone/ ./
COPY --link --from=builder --chown=1000:1000 /app/.next/static/ ./.next/static

RUN apk add --no-cache su-exec iputils-ping shadow

USER root

ENV NODE_ENV=production
ENV HOSTNAME=::
ENV PORT=3000
EXPOSE $PORT

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:$PORT/api/healthcheck || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
