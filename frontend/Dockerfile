# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci

COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: custom nginx config for SPA routing & /api reverse proxy
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
