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

## Getting Started

### Prerequisites

- **For Docker**: Docker and Docker Compose
- **For Local Development**:
  - Node.js 18+ and npm
  - PostgreSQL 14+

### Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/jcubby86/games.git
cd games
```

2. Create a `.env` file with required variables (see [Environment Variables](#environment-variables))

3. Start the application:
```bash
docker-compose up -d
```

4. Access the app at `http://localhost` (or your configured port)

### Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd nest
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in a `.env` file:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/games"
NODE_ENV=development
NODE_PORT=3000
JWT_SECRET=your_secret_key
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run start:dev
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run start:dev
```

5. Access the app at `http://localhost:5173`

## Environment Variables

### Backend (`nest/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `NODE_PORT` | Backend server port | No | 3000 |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |

### Frontend (`app/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | No | /api (relative) |

### Docker Compose (`.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | Yes | - |
| `JWT_SECRET` | Secret for JWT token signing | Yes | - |

## Deployment

### Using Docker Compose

See [docker-compose.yml](docker-compose.yml) for the complete configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.