# Next.js standalone image (next.config.mjs: output "standalone"), non-root, port 3000.
#
# NEXT_PUBLIC_API_URL is baked into the client bundle at build time, so it is a build argument and the build
# fails without it (an image must never fall back to http://localhost:8000/api). CI passes the production API:
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.guessr.yildizskylab.com/api/ -t ytuguessr-frontend .
# Local development is unchanged: `npm run dev` still defaults to http://localhost:8000/api (src/lib/api.js).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "NEXT_PUBLIC_API_URL build argument is required" >&2; exit 1; }
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S -g 1001 nextjs && adduser -S -D -H -u 1001 -G nextjs nextjs
# The app is read-only for its user; only Next's cache directory is writable.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
RUN mkdir -p .next/cache && chown nextjs:nextjs .next/cache
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
