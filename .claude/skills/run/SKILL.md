---
name: run
description: Launch this project's app locally (frontend + backend) to see a change working. Use whenever asked to run, start, or manually verify the app.
---

# Run

npm workspaces monorepo with three packages: `shared` (types), `app` (Vite/React frontend, port 5173), `nest` (NestJS backend, port 3000). Frontend proxies `/api` and `/socket.io` to the backend (see [app/vite.config.ts](../../../app/vite.config.ts)).

## Prerequisites

- `npm install` from the repo root (builds `shared` via `postinstall`).
- A running Postgres instance and `nest/.env` with at least `DATABASE_URL` and `JWT_SECRET` (see [README.md](../../../README.md#environment-variables)).
- Migrations applied: `npx prisma migrate dev` from `nest/`.

## Start it

From the repo root, start both frontend and backend together:

```bash
npm run dev
```

This runs them concurrently (labeled `app`/`nest` in the output) with `--clearScreen false` / `--preserveWatchOutput` so neither process's log clobbers the other's. Frontend at `http://localhost:5173`, backend at `http://localhost:3000`.

To run just one side (e.g. the backend isn't changing, or you want its output uncluttered):

```bash
npm run dev:app    # frontend only
npm run dev:nest   # backend only
```

If `shared/src` is being edited too, watch it in another terminal so `app`/`nest` pick up changes:

```bash
npm run dev:shared
```

## Docker alternative

`docker compose up -d` runs pre-built images from `compose.yml` instead of source — use this only to sanity-check the published images, not for iterating on code.
