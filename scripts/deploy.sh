#!/bin/bash
set -uo pipefail

cd "$(dirname "$0")/.."

# Load env
set -a
source .env
set +a

echo "[deploy] current dir: $(pwd)"

# Remember current running image for rollback
CURRENT_IMAGE=$(docker compose images -q app || true)
echo "[deploy] current image: ${CURRENT_IMAGE:-none}"

# Build new image
echo "[deploy] building..."
docker compose build || { echo "[deploy] build failed"; exit 1; }

# Run database migrations using the new image
echo "[deploy] running migrations..."
docker compose run --rm app npx drizzle-kit migrate || { echo "[deploy] migration failed"; exit 1; }

# Start new containers
echo "[deploy] starting containers..."
if docker compose up -d; then
  sleep 5
  APP_CONTAINER=$(docker compose ps -q app)

  # Health check inside container
  if docker exec "$APP_CONTAINER" node -e "
    const http = require('http');
    const req = http.get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1));
    req.on('error', () => process.exit(1));
    req.setTimeout(5000, () => process.exit(1));
  "; then
    echo "[deploy] successful"
    docker image prune -f
    exit 0
  fi
fi

echo "[deploy] failed, rolling back..."
docker compose down 2>/dev/null || true

if [ -n "$CURRENT_IMAGE" ]; then
  docker rm -f "${PROJECT_NAME}_rollback" 2>/dev/null || true
  docker run -d \
    --name "${PROJECT_NAME}_rollback" \
    --network server-internal-net \
    --env-file .env \
    -v "$(pwd)/data:/app/data" \
    --label "traefik.enable=true" \
    --label "traefik.http.routers.${PROJECT_NAME}.rule=Host(\`${DOMAIN}\`)" \
    --label "traefik.http.routers.${PROJECT_NAME}.entrypoints=websecure" \
    --label "traefik.http.routers.${PROJECT_NAME}.tls.certresolver=letsencrypt" \
    --label "traefik.http.services.${PROJECT_NAME}.loadbalancer.server.port=3000" \
    "$CURRENT_IMAGE"
  echo "[deploy] rolled back to previous image: $CURRENT_IMAGE"
fi

exit 1
