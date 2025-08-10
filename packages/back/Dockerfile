# ------------- base -------------
FROM node:18-alpine AS base
WORKDIR /app
RUN npm i -g pnpm

# ------------- deps -------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ------------- dev/runtime -------------
FROM base AS dev
ENV NODE_ENV development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

# ------------- build -------------
FROM deps AS builder
ENV NODE_ENV production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ------------- runner -------------
FROM base AS runner
ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
EXPOSE 3001
CMD ["node", "dist/main.js"]
