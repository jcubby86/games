# Party Games 🎮

A web-based multiplayer party games platform inspired by Jackbox Games. Create and join games with friends using simple room codes.

## Table of Contents

- [Features](#features)
- [Games](#games)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

## Features

- 🎯 **Multiple Party Games** - Currently includes "The Name Game" and "He Said She Said"
- 🔗 **Easy Pairing** - Join games using a simple four-letter code
- 🌐 **Fully Self-Hostable** - Run your own instance with Docker
- 📱 **Responsive Design** - Works great on mobile and desktop
- ⚡ **Real-time Updates** - WebSocket-powered live game updates
- 🤖 **AI-Generated Suggestions** - Optional OpenAI-powered suggestions to help players who are stuck, with a per-user opt-out

## Games

### The Name Game

Everyone secretly enters the name of a person (real or fictional) that others would know. Players then take turns guessing each other's names until only one remains!

### He Said She Said

Each player answers the same six prompts. Stories are then built randomly using different players' answers for each prompt, creating hilarious combinations.

## Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite for build tooling
- TanStack Router for navigation
- TanStack Query for server state management
- Socket.io for real-time communication
- Bootstrap 5 & Sass for styling

**Backend:**

- NestJS with TypeScript
- Prisma ORM with PostgreSQL
- Socket.io Gateway for WebSockets
- OpenAI API for suggestions
- JWT authentication

**Infrastructure:**

- Docker & Docker Compose
- Nginx for serving frontend
- PostgreSQL database

## Project Structure

This is an npm workspaces monorepo with three packages:

- [`app/`](app) — the React frontend
- [`nest/`](nest) — the NestJS backend
- [`shared/`](shared) — TypeScript types (`@games/shared`) shared between frontend and backend, e.g. `GameDto`, `PlayerDto`

`shared` has no runtime dependencies of its own — it's compiled to `shared/dist` on install (via the root `postinstall` script) and consumed by both `app` and `nest` as a regular npm dependency. If you edit files in `shared/src`, run `npm run build:shared` (or `npm run dev:shared` to watch) from the repo root so the other packages pick up the change.

## Getting Started

### Prerequisites

- **For Docker**: Docker and Docker Compose
- **For Local Development**:
  - Node.js 18+ and npm
  - PostgreSQL 14+

### Install dependencies

Install once from the repo root — this installs all three workspaces and builds `shared`:

```bash
npm install
```

### Quick Start with Docker

[compose.yml](compose.yml) pulls pre-built images (`ghcr.io/jcubby86/games-app` and `ghcr.io/jcubby86/games-backend`) published by CI on every push to `master` — no local build required.

1. Clone the repository:

```bash
git clone https://github.com/jcubby86/games.git
cd games
```

1. Create a `.env` file with required variables (see [Environment Variables](#environment-variables))

2. Start the application:

```bash
docker compose up -d
```

1. Access the app at `http://localhost:3020` (or your configured port)

### Local Development

Install dependencies once from the repo root (see [Install dependencies](#install-dependencies) above), then:

> Once the backend `.env` file is set up (below) and migrations have been run, you can start both the frontend and backend together from the repo root with `npm run start:dev`, instead of running them separately as shown here.

#### Backend Setup

1. Navigate to the backend directory:

```bash
cd nest
```

1. Set up your environment variables in a `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/games"
NODE_ENV=development
NODE_PORT=3000
JWT_SECRET=your_secret_key
```

1. Run database migrations:

```bash
npx prisma migrate dev
```

1. Start the development server:

```bash
npm run start:dev
```

#### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd app
```

1. Start the development server:

```bash
npm run start:dev
```

1. Access the app at `http://localhost:5173`

## Environment Variables

### Backend (`nest/.env`)

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `NODE_PORT` | Backend server port | No | 3000 |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key, used to generate AI suggestions | No | - |
| `OPENAI_BASE_URL` | Base URL for an OpenAI-compatible endpoint (e.g. a local/self-hosted model such as llama.cpp or Ollama); can be used instead of or alongside `OPENAI_API_KEY` | No | - |
| `OPENAI_MODEL` | Model name to use for suggestions | No | gpt-4o |
| `SUGGESTION_REFILL_BATCH_SIZE` | Number of suggestions requested per OpenAI call when replenishing the cache; lower for local models (e.g. Ollama) with limited throughput, higher to reduce request overhead against hosted APIs | No | 10 |

AI suggestions are disabled entirely if neither `OPENAI_API_KEY` nor `OPENAI_BASE_URL` is set - the app falls back to a static, pre-seeded pool of suggestions. When enabled, generated suggestions are cached in memory and replenished in the background so requests don't wait on the OpenAI API. Players can also opt out of AI suggestions individually from the Join page; this preference is stored in their browser and sent to the backend as the `no_ai` query parameter on `GET /api/suggestions`.

### Docker Compose (`.env`)

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `POSTGRES_PASSWORD` | PostgreSQL database password | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |

## Testing

Run unit tests for all workspaces from the repo root:

```bash
npm test
```

The frontend also has Playwright end-to-end tests, run separately from the `app` workspace (requires browsers to be installed once via `npx playwright install`):

```bash
npm run test:e2e -w app
```

Architecture decisions for notable backend features (e.g. suggestion caching and likes) are documented as ADRs in [`docs/`](docs).

## Deployment

### Using Docker Compose

See [compose.yml](compose.yml) for the complete configuration. Images are built and published to GitHub Container Registry by [CI](.github/workflows/ci.yml) on every push to `master` and on version tags.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
