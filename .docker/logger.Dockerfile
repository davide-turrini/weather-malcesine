FROM node:20-alpine AS dev
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter "@malcesine/logger-app..." build
CMD ["pnpm", "--filter", "@malcesine/logger-app", "dev"]

FROM dev AS builder
RUN pnpm deploy --filter @malcesine/logger-app --prod /standalone \
 && cp -r apps/logger/dist /standalone/dist

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=builder /standalone ./
CMD ["node", "dist/index.js"]
