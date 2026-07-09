#!/usr/bin/env bash
#
# deploy.sh — build, test, and (only if both pass) deploy the container.
#
# The image build itself is the gate: the Dockerfile installs deps with a frozen
# lockfile, runs our config-editor unit tests, and compiles the app. If any of those
# fail, `docker compose build` fails and we never touch the running container. Once the
# image is built we start it and wait for the healthcheck to report healthy.
#
# Run this after update.sh (and after resolving any merge conflicts), or any time you
# want to ship local changes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"     # homepage-src
PROJECT="$(cd "$REPO/.." && pwd)"        # dir holding docker-compose.yml
SERVICE="homepage"

cd "$PROJECT"

echo "=== 1/3  Build image (installs deps, runs config-editor tests, compiles) ==="
sudo docker compose build

echo "=== 2/3  Deploy ==="
sudo docker compose up -d

echo "=== 3/3  Wait for healthy ==="
# The container has a HEALTHCHECK; poll it for up to ~60s.
for i in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$SERVICE" 2>/dev/null || echo "unknown")"
  if [ "$status" = "healthy" ]; then
    echo "✅ $SERVICE is healthy."
    docker compose ps
    exit 0
  fi
  if [ "$status" = "unhealthy" ]; then
    echo "❌ $SERVICE reported unhealthy. Recent logs:"
    docker compose logs --tail 40 "$SERVICE"
    exit 1
  fi
  sleep 2
done

echo "⚠️  $SERVICE did not report healthy in time (last status: ${status:-unknown}). Check:"
echo "     docker compose logs -f $SERVICE"
exit 1
