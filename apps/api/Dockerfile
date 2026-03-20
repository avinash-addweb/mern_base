FROM node:24-alpine AS base
WORKDIR /app

# Dev stage
FROM base AS dev
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
WORKDIR /app/apps/api
RUN npx prisma generate --schema=src/prisma/schema.prisma
CMD ["npx", "nodemon"]

# Build stage
FROM base AS build
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
RUN npm install
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
WORKDIR /app/apps/api
RUN npx prisma generate --schema=src/prisma/schema.prisma
RUN npx tsc

# Prod stage
FROM base AS prod
COPY --from=build /app/package.json /app/package-lock.json* ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/packages/utils/package.json ./packages/utils/
RUN npm install --omit=dev
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/prisma ./apps/api/src/prisma
COPY --from=build /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
WORKDIR /app/apps/api
EXPOSE 4100
CMD ["node", "dist/index.js"]
