---
name: check
description: Run typecheck, lint, and format on this repo's workspaces (app/, nest/, shared/). Use proactively after editing code here, before considering a change done, to catch type errors, lint issues, and formatting drift.
---

# Check

This is an npm workspaces monorepo (`shared`, `app`, `nest`). After editing code, verify it with typecheck, lint, and format rather than assuming it's correct.

## Steps

Run from the repo root:

```bash
npm run typecheck
npm run lint
npm run format
```

Each fans out to every workspace that defines the script (`--workspaces --if-present`). `lint` and `format` auto-fix what they can (`eslint --fix`, `prettier --write`); typecheck has no auto-fix, so type errors must be fixed by hand.

If changes are confined to a single workspace, scope the commands to avoid noise from unrelated packages:

```bash
npm run typecheck -w app
npm run lint -w app
npm run format -w app
```

(swap `app` for `nest` or `shared` as appropriate)

## After fixing

Re-run the same commands to confirm they pass clean before calling the task done. If `lint` or `format` had to change files, re-check `git diff` to make sure the auto-fixes didn't touch anything unrelated to the current task.
