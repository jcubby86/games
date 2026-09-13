---
name: e2e
description: Run or write Playwright end-to-end tests for the frontend. Use when asked to run e2e tests, add browser-level test coverage, or debug a failing Playwright test.
---

# E2E (Playwright)

End-to-end tests live in [app/e2e/](../../../app/e2e/) and run against a real browser via Playwright, configured in [app/playwright.config.ts](../../../app/playwright.config.ts).

## One-time setup

```bash
npx playwright install
```

(from `app/`, or `npx playwright install --with-deps` in CI-like environments)

## Running

From the repo root:

```bash
npm run test:e2e -w app        # headless run
npm run test:e2e:ui -w app     # interactive UI mode, good for debugging
```

Playwright's `webServer` config auto-starts the frontend with `npm run dev` and waits on `http://localhost:5173`. If a dev server (`npm run dev` / `dev:app`) is already running locally, it's reused instead of starting a second one (`reuseExistingServer: !process.env.CI`) — in CI a fresh server is always started.

## Writing tests

- Add new spec files under `app/e2e/*.spec.ts` following the pattern in `routing.spec.ts`.
- Tests hit the real backend through the Vite proxy (`/api`, `/socket.io`) — for anything that needs backend state (creating a game, joining as a player), the backend must actually be reachable, not mocked.
- `baseURL` is `http://localhost:5173`; use relative paths (`page.goto('/')`) rather than hardcoding the host.
- Keep new specs independent — `fullyParallel: true` means tests may run concurrently across files.
