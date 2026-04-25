# Stage 1 — build / install dependencies(production deps)
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

# Copy package manifests first for better caching
COPY package*.json package-lock.json* ./ 
RUN npm ci --only=production

# Stage 2 — build 
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . ./


# Stage 3 — runtime
FROM node:20-alpine AS runtime
# Create non-root user toa dd layer of security 
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /usr/src/app
COPY --chown=appuser:appgroup --from=build /usr/src/app ./
ENV PORT=3000
EXPOSE 3000
USER appuser

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- --timeout=2 http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "index.js"]
