FROM node:20-alpine AS dev
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 4301
CMD ["pnpm", "--filter", "@malcesine/web", "dev"]

FROM dev AS builder
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @malcesine/web build

FROM nginx:1.27-alpine AS prod
COPY .docker/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
