FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
RUN pnpm fetch

FROM base AS build
COPY --from=deps /app /app
COPY . .
RUN pnpm install --offline
RUN pnpm build

FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 8080
CMD ["node", "dist/main.js"]