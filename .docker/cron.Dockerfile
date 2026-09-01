FROM node:20-alpine AS dev
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter "@malcesine/cron..." build
CMD ["pnpm", "--filter", "@malcesine/cron", "dev"]

FROM dev AS builder
RUN pnpm deploy --filter @malcesine/cron --prod /standalone \
 && cp -r apps/cron/dist /standalone/dist

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=builder /standalone ./
CMD ["node", "dist/index.js"]
