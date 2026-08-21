# Party Games 🎮

A web-based multiplayer party games platform inspired by Jackbox Games. Create and join games with friends using simple room codes.

## Table of Contents

- [Features](#features)
- [Games](#games)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Local Development](#local-development)
- [Environment Variables](#environment-variables)
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
- React Router for navigation
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

1. Clone the repository:

```bash
git clone https://github.com/jcubby86/games.git
cd games
```

1. Create a `.env` file with required variables (see [Environment Variables](#environment-variables))

2. Start the application:

```bash
docker-compose up -d
```

1. Access the app at `http://localhost` (or your configured port)

### Local Development

Install dependencies once from the repo root (see [Install dependencies](#install-dependencies) above), then:

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

1. Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
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

### Frontend (`app/.env`)

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `VITE_API_URL` | Backend API URL | No | /api (relative) |

### Docker Compose (`.env`)

| Variable | Description | Required | Default |
| -------- | ----------- | -------- | ------- |
| `POSTGRES_PASSWORD` | PostgreSQL database password | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |

## Deployment

### Using Docker Compose

See [compose.yml](compose.yml) for the complete configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
