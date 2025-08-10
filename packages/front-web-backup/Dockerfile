# ------------- base -------------
FROM node:18-alpine AS base
WORKDIR /app

# ------------- deps -------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile

# ------------- dev/runtime -------------
FROM base AS dev
ENV NODE_ENV development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev", "-p", "3000"]

# ------------- build -------------
FROM deps AS builder
ENV NODE_ENV production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ------------- runner -------------
FROM deps AS runner
ENV NODE_ENV production
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]
