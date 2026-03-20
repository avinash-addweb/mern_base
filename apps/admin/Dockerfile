FROM node:24-alpine AS base
WORKDIR /app

# Dev stage
FROM base AS dev
COPY package.json package-lock.json* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
WORKDIR /app/apps/admin
EXPOSE 4300
CMD ["npx", "vite", "--host", "--port", "4300"]

# Build stage
FROM base AS build
COPY package.json package-lock.json* ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
WORKDIR /app/apps/admin
RUN npx vite build

# Prod stage
FROM nginx:alpine AS prod
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4300
CMD ["nginx", "-g", "daemon off;"]
