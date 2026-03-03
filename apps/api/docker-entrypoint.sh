#!/bin/sh
set -e

cd /app/apps/api

echo ">>> Syncing database schema with Prisma..."
npx prisma db push --skip-generate

echo ">>> Seeding database..."
node /app/apps/api/dist/seed/seed.js

echo ">>> Starting API server..."
exec node /app/apps/api/dist/src/main
