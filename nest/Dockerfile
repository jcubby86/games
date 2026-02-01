# Builder stage: install dev deps, generate Prisma client, build app
FROM node:lts AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runtime stage: smaller image with only production dependencies
FROM node:lts AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/main"]