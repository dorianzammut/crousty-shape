# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root-level manifests (required for npm workspaces)
COPY package*.json ./

# Copy mobile package manifest
COPY apps/mobile/package*.json ./apps/mobile/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/mobile ./apps/mobile

# Build Angular app for production (web target — Capacitor native builds are done outside Docker)
RUN npm run build:mobile

# ---- Production stage ----
FROM nginx:alpine AS runner

# Angular 17+ outputs to dist/<name>/browser/
# Capacitor sets webDir to 'dist/angular', so browser bundle is at dist/angular/browser/
COPY --from=builder /app/apps/mobile/dist/angular/browser /usr/share/nginx/html

# Nginx SPA config with API proxy
COPY apps/mobile/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
