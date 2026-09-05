# Weight suggestion selection by likes, and let AI suggestions be liked

## Context

The `Suggestion` table's `likes` column ([added previously](./ai-suggestion-storage.md)
as schema-only, no logic) is now wired up end to end:

1. Random suggestion selection is biased toward higher-`likes` suggestions,
   across HUMAN and AI rows together, instead of a uniform draw.
2. A `POST /api/suggestions/:uuid/like` endpoint actually increments `likes`.
3. AI suggestions are no longer deleted the instant they're served. A served
   AI suggestion is only deleted if it never gets liked; once liked, it's
   kept indefinitely and stays in the pool, servable again.

There's no `Game`/session record that references a served suggestion, so
"liked after being served" can only be reconciled via the suggestion's own
`uuid` plus a grace period — not a round/session hook. A cron
(`@nestjs/schedule`, newly added — there was no scheduler in the app before
this) runs that grace-period cleanup.

**No schema migration was needed.** Rather than adding a `usedAt` column, AI
suggestions use `likes` itself as a tri-state marker, and the cron reuses the
existing auto-managed `updatedAt` column as the grace-period clock:

| `likes` value | Meaning |
| --- | --- |
| `0` | Unused (never served) — the same default HUMAN suggestions already use |
| `-1` | Served at least once, not (yet) liked — resting: excluded from selection, eligible for cleanup once `updatedAt` is old enough |
| `> 0` | Liked — always in the selection pool, never cleaned up |

HUMAN suggestions never go negative; only AI rows pass through `-1`.

## Repository changes

**[nest/src/suggestion/suggestion.repository.ts](../nest/src/suggestion/suggestion.repository.ts)**:

- `getSuggestions(categories, quantity, noAi)` replaces the old two-pool
  design (`popAiSuggestions` for AI, a separate `getSuggestions` for HUMAN,
  stitched together by `SuggestionCacheService` with a fallback). It's now
  one weighted draw per request across **HUMAN ∪ liked-AI ∪ unused-AI**:
  - A raw `SELECT ... ORDER BY POWER(random(), 1.0 / (likes + 1)) DESC LIMIT`
    picks the winners (Efraimidis–Spirakis weighted sampling without
    replacement — a suggestion with 10x the likes is ~10x as likely to be
    picked). Raw SQL is only needed here because Prisma's query builder
    can't express a computed `ORDER BY`. AI rows resting at `-1` are excluded
    by the `WHERE` clause, so every row that reaches the `ORDER BY` has
    `likes >= 0` — no `GREATEST(likes, 0)` clamp needed.
  - Whichever winners are *unused* AI rows (`type = 'AI' AND likes = 0`) are
    then flipped to `-1` via a plain Prisma `updateMany` (not raw SQL, so
    `updatedAt` auto-bumps for free — that timestamp is what the cleanup
    cron keys off).
  - `noAi` excludes AI rows from the `WHERE` clause entirely via a `NOT
    ${noAi}` guard rather than branching into two separate SQL templates.
- `countAiSuggestions(category)` now counts only `likes = 0` (truly unused)
  rows. It drives `SuggestionCacheService`'s `TARGET_STOCK` top-up loop, and
  liked suggestions are an infinitely-reusable part of the pool that
  shouldn't suppress generating new content.
- `createAiSuggestions` is unchanged from before (no `likes` override) — new
  AI rows just take the schema default of `0`.
- `deleteUnlikedUsedAiSuggestions(before)`: `deleteMany` on `type: 'AI',
  likes: -1, updatedAt: { lt: before }` — the grace-period sweep.
- `incrementLikes(uuid)`: a single atomic raw SQL statement —
  `SET likes = CASE WHEN likes = -1 THEN 1 ELSE likes + 1 END WHERE uuid =
  ...  RETURNING ...` — handles the special `-1 → 1` jump (liking a
  resting AI suggestion must not land it on `0`, which would make it look
  unused again) without a separate read-then-write race. Returns `undefined`
  (empty `RETURNING`) for an unknown uuid rather than throwing.
- `popAiSuggestions` was removed — folded into `getSuggestions`.

`RawSuggestionRow` is a small local interface for the raw query's shape
(`value`, `category`, `uuid`, `likes`, `type`) — separate from the public
`SuggestionDto`, which only exposes `value`, `category`, `uuid`.

## Service changes

**[nest/src/suggestion/suggestion-cache.service.ts](../nest/src/suggestion/suggestion-cache.service.ts)**:

- Shrinks to: delegate the pick to `suggestionRepository.getSuggestions(...)`,
  then (unless `noAi`) fire off a background `checkStock(category)` per
  requested category that queues a `replenish()` if fresh AI stock has
  dropped below `TARGET_STOCK`. `getSuggestionsForCategory` (the old
  per-category pop-then-fallback-to-HUMAN dance) is gone — the unified
  repository query already blends both pools, so there's no "shortfall" case
  to fall back from.
- `replenish`/`processQueue`/`fillCategory`/`onApplicationBootstrap` are
  unchanged.

**[nest/src/suggestion/suggestion.service.ts](../nest/src/suggestion/suggestion.service.ts)**:

- `getSuggestions` no longer does a final `shuffle(...).slice(...)` — the
  provider (either `SuggestionCacheService` or the plain repository) now
  returns an already likes-weighted, already-limited-to-`quantity` result on
  its own.
- New `likeSuggestion(uuid)`: a thin passthrough to
  `suggestionRepository.incrementLikes(uuid)`, returning `undefined` for an
  unknown uuid (no exception to catch, since the repository's raw query
  never throws for a missing row).
- Now injects `SuggestionRepository` directly (in addition to the existing
  `SUGGESTION_PROVIDER`), since liking is a plain DB write on the source of
  truth, not something that goes through the AI/HUMAN provider routing.

**New [nest/src/suggestion/suggestion-cleanup.service.ts](../nest/src/suggestion/suggestion-cleanup.service.ts)**:

- `@Cron(CronExpression.EVERY_HOUR)` calls
  `deleteUnlikedUsedAiSuggestions(before)`, where `before` is `now - graceMs`.
  The grace period defaults to 24h, configurable via
  `SUGGESTION_LIKE_GRACE_HOURS` (same `ConfigService` pattern
  `SuggestionCacheService` already used for `SUGGESTION_REFILL_BATCH_SIZE`).
- Registered in [nest/src/app.module.ts](../nest/src/app.module.ts) alongside
  a new `ScheduleModule.forRoot()` import. `@nestjs/schedule` was added to
  `nest/package.json` — there was no cron/scheduler infra anywhere in the app
  before this.

## Controller and DTO changes

**[nest/src/suggestion/suggestion.controller.ts](../nest/src/suggestion/suggestion.controller.ts)**:

- New `POST /api/suggestions/:uuid/like`, using `ParseUUIDPipe` on the param
  (this module has no class-validator DTOs, so a pipe is the lightest-weight
  fit) and `@Res({ passthrough: true })` to downgrade the response to `204
  No Content` when `likeSuggestion` returns `undefined` — an unknown or
  already-cleaned-up uuid is treated as a non-error case the caller doesn't
  need to branch on, rather than a thrown 404.

**[shared/src/game.types.ts](../shared/src/game.types.ts)**: `SuggestionDto`
gained a `uuid: string` field (mirroring `PlayerDto`/`GameDto`), since a
client now needs a stable identifier to like a suggestion it was served.

**[nest/src/openai/openai.service.ts](../nest/src/openai/openai.service.ts)**:
no longer imports or returns `SuggestionDto` — it generates suggestions
*before* they're persisted (no `uuid` yet), so it now returns a local
`GeneratedSuggestion { value, category }` type instead of pretending to
satisfy the full DTO shape.

## Also: `ParseUUIDPipe` on unguarded uuid params

While adding it to the like endpoint, the same pipe was added to the three
`game.controller.ts` endpoints that take a `:uuid` path param with **no**
`GameAuthGuard`: `getGame`, `addPlayer`, `getStoryArchives`. It was
deliberately *not* added to the other six guarded endpoints — `GameAuthGuard`
reads `request.params.uuid` directly off the raw Express request before any
pipe runs, and already rejects a malformed value with 403 (it can never
equal the authenticated token's real game/player uuid), so the pipe would
never actually fire there.

## Side effect

Popular AI-generated suggestions become a permanent, reusable part of the
suggestion pool instead of one-shot content that vanishes the moment it's
served — while unpopular AI suggestions still age out automatically, keeping
the AI-generated portion of the table from growing unbounded.
