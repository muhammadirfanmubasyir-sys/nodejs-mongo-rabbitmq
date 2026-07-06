FROM node:24-slim AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runtime
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 3003
CMD ["node", "src/server.js"]
