
FROM node:20-alpine AS builder
WORKDIR /repo

# Enable pnpm via Corepack
RUN corepack enable

# Install workspace deps (no sources yet = better layer caching)
COPY pnpm-lock.yaml package.json ./
COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Bring in the whole repo (apps, packages, etc.)
COPY . .

# Build only the target service; default to "gateway"
ARG SVC=gateway
ENV SVC=${SVC}
RUN pnpm --filter ${SVC} build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# If your services live under "apps/<svc>" change "packages" -> "apps" below.
# Copy built output
ARG SVC=gateway
COPY --from=builder /repo/packages/${SVC}/dist ./dist 2>/dev/null/
COPY --from=builder /repo/apps/${SVC}/dist ./dist 2>/dev/null/

# Node modules:
# If node_modules are hoisted at repo root (pnpm), copy them:
COPY --from=builder /repo/node_modules ./node_modules

# If each service also has its own node_modules, copy those too (non-fatal if absent):
COPY --from=builder /repo/packages/${SVC}/node_modules ./node_modules 2>/dev/null/
COPY --from=builder /repo/apps/${SVC}/node_modules ./node_modules 2>/dev/null/

EXPOSE 3000
CMD ["node", "dist/main.js"]
