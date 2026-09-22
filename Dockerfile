# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Every public page is prerendered here, and each of them reads either the
# address it links to or the editorial address it prints. Neither is a secret —
# both stand in .env.example with their real value — and neither is frozen into
# the image: the revalidate window renders every page again on the first request
# after deployment, with what Dokploy hands the container.
ARG NEXT_PUBLIC_SITE_URL=https://voxaudax.de
ARG MAIL_TO_EDITORIAL=redaktion@voxaudax.de
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV MAIL_TO_EDITORIAL=$MAIL_TO_EDITORIAL
# The pool is built while the module graph is evaluated, so a prerender cannot
# even load lib/queries without a connection string and a zone. Nothing listens
# on this one and nothing is meant to: every query fails, every page falls back
# to the empty state it draws before the first article exists, and no credential
# ever enters the build.
ENV DATABASE_URL=postgres://build@127.0.0.1:5432/voxaudax
ENV TZ=Europe/Berlin
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7896
ENV HOSTNAME=0.0.0.0
# Without tzdata the TZ below is ignored and every scheduled publication silently
# lands in UTC, an hour or two off what the editor typed.
ENV TZ=Europe/Berlin
RUN apk add --no-cache tzdata && addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 7896
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:7896/api/health || exit 1
CMD ["node", "server.js"]
