#!/bin/sh
set -e

echo ">>> Syncing database schema with Prisma..."
cd /app/apps/api
npx prisma db push --skip-generate

echo ">>> Starting API server..."
exec node /app/apps/api/dist/src/main
