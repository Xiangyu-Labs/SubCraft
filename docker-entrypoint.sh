#!/bin/sh
set -e

echo "========================================"
echo "  Template Application Startup"
echo "========================================"
echo "Environment: ${NODE_ENV:-production}"
echo "========================================"

# Ensure the data directory exists
DATA_DIR="${DATA_DIR:-./data}"
if [ -n "$DATA_DIR" ]; then
    echo "[INIT] Ensuring data directory exists: $DATA_DIR"
    mkdir -p "$DATA_DIR"
fi

# Run migrations only if not skipped
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "[INIT] Running database migrations..."
    if npx drizzle-kit migrate; then
        echo "[INIT] Migrations completed successfully"
    else
        echo "[ERROR] Migration failed!"
        exit 1
    fi
else
    echo "[INIT] Skipping database migrations (SKIP_MIGRATIONS=true)"
fi

echo "[INIT] Starting application..."
exec node server.js
