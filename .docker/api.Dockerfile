FROM node:20-alpine AS dev
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter "@malcesine/api..." build
EXPOSE 4001
CMD ["pnpm", "--filter", "@malcesine/api", "dev"]

FROM dev AS builder
RUN pnpm deploy --filter @malcesine/api --prod /standalone \
 && cp -r apps/api/dist /standalone/dist

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=builder /standalone ./
EXPOSE 4001
CMD ["node", "dist/index.js"]
