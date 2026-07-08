FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api apps/api
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @nuri/api db:generate && pnpm --filter @nuri/api build
CMD ["pnpm", "--filter", "@nuri/api", "start"]
