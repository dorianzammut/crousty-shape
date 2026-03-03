# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root-level manifests (required for npm workspaces)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy API package manifest
COPY apps/api/package*.json ./apps/api/

# Install all dependencies — skip postinstall (prisma generate) until schema is present
RUN npm ci --ignore-scripts

# Copy API source code (includes prisma/schema.prisma)
COPY apps/api ./apps/api

# Now that schema is present, generate the Prisma client and compile TypeScript
RUN cd apps/api && npx prisma generate
RUN npm run build:api

# ---- Production stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy root-level manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies — skip postinstall (we copy the built client from builder)
RUN npm ci --omit=dev --ignore-scripts

# Copy the Prisma client generated in the builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema (needed at runtime for db push)
COPY apps/api/prisma ./apps/api/prisma

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
