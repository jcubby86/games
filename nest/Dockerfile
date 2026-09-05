# Builder stage: install workspace deps, generate Prisma client, build shared + backend
# Build context is the monorepo root (see .github/workflows/docker-image.yml)
FROM node:lts-slim AS builder
WORKDIR /usr/src/repo
COPY package.json package-lock.json ./
COPY shared shared
COPY app/package.json app/package.json
COPY nest/package.json nest/package.json
RUN npm ci
COPY nest nest
WORKDIR /usr/src/repo/nest
RUN npx prisma generate
RUN npm run build
WORKDIR /usr/src/repo
RUN npm prune --omit=dev

# Runtime stage: smaller image with only production dependencies
FROM node:lts-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/repo/node_modules ./node_modules
COPY --from=builder /usr/src/repo/nest/package.json ./package.json
COPY --from=builder /usr/src/repo/nest/dist ./dist
COPY --from=builder /usr/src/repo/nest/prisma ./prisma
COPY --from=builder /usr/src/repo/nest/prisma.config.ts ./prisma.config.ts
COPY nest/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
