# build environment
# Build context is the monorepo root (see .github/workflows/docker-image.yml)
FROM node:lts-slim AS build
WORKDIR /usr/src/repo
COPY package.json package-lock.json ./
COPY shared shared
COPY nest/package.json nest/package.json
COPY app/package.json app/package.json
RUN npm ci
COPY app app
WORKDIR /usr/src/repo/app
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /usr/src/repo/app/dist /usr/share/nginx/html
COPY --from=build /usr/src/repo/app/nginx/nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
