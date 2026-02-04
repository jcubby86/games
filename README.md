<p align="center">
  A party games web app inspired by jackbox games. This is a new version of the project built with a react front end and a node.js/postgresql back end. See original version of the project <a href="https://github.com/jcubby86/games">here</a>.
</p>

## Features

- **Games:**
  - The Name Game: Everyone secretly enters the name of a person (real or fictional) that others would know. Players then take turns guessing each other's names until only one remains!
  - He Said She Said: Each player answers the same six prompts. Stories are then built randomly using different players' answers for each prompt.
- **Pairing:** One person can create a game and invite others to join with a four-letter code
- **Auto-generated nicknames:** Players can create their own nicknames or use a randomly generated phrase
- **Suggestions:** Each prompt for the games will suggest something if you can't think of what to put

## Self Hostable

- I built this website to be fully self-hostable, with a docker image for front-end and backend, fully customizable with environment variables

Using docker compose:

```yaml
services:
  app:
    build:
      context: ./front-end
    image: ghcr.io/jcubby86/games-app:${DOCKER_TAG:-latest}
    ports:
      - ${WEB_PORT:-80}:80
    environment:
      - NGINX_BACKEND_ADDRESS=http://backend:${NODE_PORT:-3000}
    restart: unless-stopped
    depends_on: 
      - backend
      - db

  backend:
    build:
      context: ./nest
    image: ghcr.io/jcubby86/games-backend:${DOCKER_TAG:-latest}
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/prisma?schema=public
      - NODE_ENV=${NODE_ENV}
      - NODE_PORT=${NODE_PORT:-3000}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - COOKIE_SECRET=${COOKIE_SECRET}
    restart: unless-stopped
    healthcheck:
      test:  wget --spider --tries=1 --no-verbose http://localhost:${NODE_PORT:-3000}/health
    depends_on:
      db:
        condition: service_healthy
      
  db:
    image: postgres:latest
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - /portainer/postgres/games-${NODE_ENV}:/var/lib/postgresql/data
    healthcheck:
      test: /usr/bin/pg_isready
```

Environment variables for each container can be configured for each service to run on different ports
