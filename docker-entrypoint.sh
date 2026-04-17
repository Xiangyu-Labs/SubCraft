#!/bin/sh
set -e

echo "========================================"
echo "  Template Application Startup"
echo "========================================"
echo "Environment: ${NODE_ENV:-production}"
echo "========================================"

echo "[INIT] Starting application..."
exec node server.js
