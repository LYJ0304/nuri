FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web apps/web
COPY packages packages
RUN pnpm install --frozen-lockfile
ARG API_INTERNAL_URL=http://api:3001
ENV API_INTERNAL_URL=$API_INTERNAL_URL
RUN pnpm --filter @nuri/web build
CMD ["pnpm", "--filter", "@nuri/web", "start"]
