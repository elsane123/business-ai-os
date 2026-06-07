FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN rm -rf node_modules/.prisma node_modules/@prisma/client
RUN npx prisma generate
RUN rm -f node_modules/.prisma/client/libquery_engine-linux-musl.so.node
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/wiki-templates ./wiki-templates
RUN mkdir -p /app/wiki-data
RUN rm -f /app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
EXPOSE 50082
CMD ["npx", "next", "start", "-p", "50082"]
