# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root-level manifests (required for npm workspaces)
COPY package*.json ./

# Copy web-admin package manifest
COPY apps/web-admin/package*.json ./apps/web-admin/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/web-admin ./apps/web-admin

# Build Angular app for production
RUN npm run build:admin

# ---- Production stage ----
FROM nginx:alpine AS runner

# Angular 17+ outputs to dist/<name>/browser/
COPY --from=builder /app/apps/web-admin/dist/web-admin/browser /usr/share/nginx/html

# Nginx SPA config with API proxy
COPY apps/web-admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
