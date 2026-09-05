# Move AI suggestion caching from in-memory to the database

## Context

AI-generated party-game suggestions used to be cached in a plain in-process
`Map<Category, SuggestionDto[]>` inside `SuggestionCacheService`
([nest/src/suggestion/suggestion-cache.service.ts](../nest/src/suggestion/suggestion-cache.service.ts)).
Suggestions were "consumed" via `Array.splice()` when queried, and a
background queue topped the cache back up by calling OpenAI. That worked, but
the cache was per-process: every server instance (and every restart) started
cold and independently burned OpenAI calls to refill itself.

This moves that storage into Postgres (via the existing Prisma `Suggestion`
model) instead of in memory, deleting rows as they're served — the same
"pop" semantics the in-memory cache already had, just durable and shared
across instances. To distinguish the two provenances now sharing one table, a
`type` column (`HUMAN` vs `AI`) was added; the existing seeded rows are all
human-curated. A `likes` column was also added for a future "favorite this
suggestion" feature — schema only, no logic yet.

## Schema changes

**[nest/prisma/schema.prisma](../nest/prisma/schema.prisma)** — extended `Suggestion`:

```prisma
model Suggestion {
  id        Int            @id @default(autoincrement())
  uuid      String         @unique @default(uuid())
  category  Category
  value     String
  type      SuggestionType @default(HUMAN)
  likes     Int            @default(0)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([category, value])
  @@index([category])
  @@index([category, type])
}

enum SuggestionType {
  HUMAN
  AI
}
```

The `@@index([category, type])` supports the hot-path query (pop AI rows for
a category). Existing rows automatically backfill to `type = HUMAN`,
`likes = 0` via the column defaults — no manual data migration was needed.

The migration was generated with
`npx prisma migrate dev --name add_suggestion_type_and_likes` from `nest/`,
following the existing convention in
[nest/prisma/migrations/](../nest/prisma/migrations/). This also regenerates
the Prisma client into `nest/src/generated/prisma/`.

## Repository changes

**[nest/src/suggestion/suggestion.repository.ts](../nest/src/suggestion/suggestion.repository.ts)**:

- `SuggestionDto` is imported from the shared workspace package
  (`import { SuggestionDto } from '@games/shared'`), defined in
  `shared/src/game.types.ts`.
- `getSuggestions()` and `getExamples()` filter to `type: 'HUMAN'` — these
  stay the reusable, never-deleted curated pool (used for the `noAi` path and
  as few-shot examples), unaffected by AI rows now living in the same table.
- `countAiSuggestions(category)`: counts AI rows for a category, replacing
  the old `cache.get(category)?.length` check against `TARGET_STOCK`.
- `createAiSuggestions(category, values)`: inserts newly generated AI
  suggestions with `skipDuplicates: true`, leaning on the existing
  `@@unique([category, value])` constraint so a value that happens to match
  an existing (human or AI) suggestion is silently dropped instead of
  erroring.
- `popAiSuggestions(category, quantity)`: atomically deletes up to `quantity`
  AI rows for the category and returns their values in one `DELETE ...
  RETURNING` statement, so concurrent requests can't be served the same row.
  Postgres row-locks during the delete, so two overlapping calls can't both
  walk away with the same row (worst case, a race causes a call to
  under-fetch, which the fallback path below already handles).

## Service changes

**[nest/src/suggestion/suggestion-cache.service.ts](../nest/src/suggestion/suggestion-cache.service.ts)**:

- The `cache: Map<Category, SuggestionDto[]>` field is gone — the
  queue/`queued`/`processing` fields that orchestrate background refills are
  unchanged, since they only ever tracked category names, not suggestion
  data.
- `getSuggestionsForCategory(category, quantity)` pops from the DB via
  `suggestionRepository.popAiSuggestions(category, quantity)`. If fewer than
  `quantity` come back, it logs the same warning, triggers `replenish()`,
  and tops up the shortfall from `suggestionRepository.getSuggestions([category])`
  (shuffled) — combining the popped rows with the fallback slice rather than
  discarding the already-deleted AI rows. Otherwise it checks
  `suggestionRepository.countAiSuggestions(category) < TARGET_STOCK` to
  decide whether to `replenish()`.
- `fillCategory(category)` checks
  `suggestionRepository.countAiSuggestions(category) < TARGET_STOCK` instead
  of the old cache length, and persists newly generated suggestions via
  `suggestionRepository.createAiSuggestions(...)` instead of pushing into an
  array.
- `onApplicationBootstrap()` is unchanged — it still queues a `replenish()`
  per `Category` on startup, now topping up the DB instead of an empty Map.

No API or DTO changes: `GET /api/suggestions`
([nest/src/suggestion/suggestion.controller.ts](../nest/src/suggestion/suggestion.controller.ts))
still returns `SuggestionDto { value, category }` — `type` and `likes` stay
internal to storage for now.

## Side effect

AI suggestions are now durable and shared across server instances/restarts,
fixing the previous per-process duplication of OpenAI calls across multiple
running instances.
