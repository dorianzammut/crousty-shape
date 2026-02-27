#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "Starting Crousty Shape dev servers..."

# Kill all child processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Mobile app — :4200
(cd "$ROOT/apps/mobile" && ng serve) &

# Web Admin — :4201
(cd "$ROOT/apps/web-admin" && ng serve --port 4201) &

# API — :3000
(cd "$ROOT/apps/api" && npm run start:dev) &

echo ""
echo "  Mobile  → http://localhost:4200"
echo "  Admin   → http://localhost:4201"
echo "  API     → http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers."

wait
