---
name: db
description: Change the Prisma schema, create/apply migrations, regenerate the client, or inspect data for the NestJS backend. Use whenever a model in nest/prisma/schema.prisma needs to change, or when asked to run migrations or open Prisma Studio.
---

# DB (Prisma)

Backend database access is Prisma + Postgres, configured in [nest/prisma.config.ts](../../../nest/prisma.config.ts). Schema: [nest/prisma/schema.prisma](../../../nest/prisma/schema.prisma). Migrations: [nest/prisma/migrations/](../../../nest/prisma/migrations/). Requires `DATABASE_URL` in `nest/.env` pointing at a running Postgres instance.

All commands below run from `nest/`.

## Changing the schema

1. Edit `prisma/schema.prisma`.
2. Create a migration (this also applies it locally and regenerates the client):

   ```bash
   npx prisma migrate dev --name <short_description>
   ```

   Name it like the existing ones (`add_player_color`, `add_suggestion_type_and_likes`) — snake_case, describes the change.
3. The generated client lands in `src/generated/prisma` — it's gitignored, never edit it or commit it.
4. Update any affected code: Prisma service methods in the relevant `nest/src/<module>` folder, and DTOs in `shared/src` (`@games/shared`) if the shape returned to the frontend changed — run `npm run build:shared` from the repo root afterward so `app`/`nest` pick up the type change.

## Regenerating the client without a schema change

If `schema.prisma` didn't change but the generated client is stale or missing (e.g. fresh clone, `node_modules` reinstalled):

```bash
npm run prisma:generate
```

(same command the CI pipeline and `nest/Dockerfile` use; can also be run from the repo root without `-w nest`)

## Applying migrations without generating a new one

`npx prisma migrate dev` is for local development only. In Docker, [nest/docker-entrypoint.sh](../../../nest/docker-entrypoint.sh) runs `npx prisma migrate deploy` automatically on container start — it applies pending migrations without creating new ones or prompting, which is what production and CI-built images use.

## Inspecting data

```bash
npm run prisma:studio
```

Opens Prisma Studio (a local GUI) against whatever `DATABASE_URL` points to — double-check it's not pointed at a shared/prod database before writing through it.

## Notes

- Never hand-edit files under `prisma/migrations/` — if a migration is wrong, create a new one that corrects it rather than editing history that may already be applied elsewhere.
- Tests use mocked Prisma (see `nest/src/**/*.spec.ts`) — no real database is needed to run `npm test`.
