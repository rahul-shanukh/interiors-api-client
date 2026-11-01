FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm fetch

FROM base AS build
COPY --from=deps /app /app
COPY . .
RUN pnpm install --offline
RUN pnpm build

FROM node:24-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./

USER node
EXPOSE 8080
CMD ["node", "dist/main.js"]
