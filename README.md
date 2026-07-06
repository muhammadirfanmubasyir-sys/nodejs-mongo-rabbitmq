# Microservices Demo: Node.js + MongoDB + RabbitMQ

A production-grade microservices architecture demonstrating event-driven communication between services.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  user-service│     │  task-service│     │notification- │
│   (3001)     │     │   (3002)     │     │  service     │
│              │     │              │     │   (3003)     │
│  Express API │     │  Express API │     │  Consumer    │
│  MongoDB     │     │  MongoDB     │     │  RabbitMQ    │
│              │     │  RabbitMQ    │     │              │
└──────┬───────┘     └──┬───────┬──┘     └──────┬───────┘
       │                │       │                │
       │                │       │                │
       ▼                ▼       ▼                ▼
┌──────────────┐  ┌────────────────┐  ┌────────────────┐
│   MongoDB    │  │    RabbitMQ    │  │    RabbitMQ    │
│  (27017)     │  │  (5672/15672)  │  │  (5672/15672)  │
└──────────────┘  └────────────────┘  └────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| user-service | 3001 | User CRUD operations |
| task-service | 3002 | Task management + RabbitMQ producer |
| notification-service | 3003 | Background worker consuming task events |
| MongoDB | 27017 | Primary database |
| RabbitMQ | 5672/15672 | Message broker (management UI at :15672) |

## Quick Start

### Prerequisites
- Docker and Docker Compose

### Run with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Run Locally (Development)

Each service needs its own terminal:

```bash
# Terminal 1 - User Service
cd user-service
cp .env.example .env
npm install
npm run dev

# Terminal 2 - Task Service
cd task-service
cp .env.example .env
npm install
npm run dev

# Terminal 3 - Notification Service
cd notification-service
cp .env.example .env
npm install
npm run dev
```

## API Endpoints

### User Service (3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users | Create user |
| GET | /api/users | List users (query: ?email=) |
| GET | /api/users/id/:id | Get user by ID |
| GET | /api/users/email/:email | Get user by email |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/id/:id | Delete user by ID |
| DELETE | /api/users/email/:email | Delete user by email |
| GET | /health | Health check |

### Task Service (3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tasks | Create task (publishes to queue) |
| GET | /api/tasks | List all tasks |
| GET | /api/tasks/:id | Get task by ID |
| GET | /health | Health check |

### Notification Service (3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |

## Project Structure

```
├── docker-compose.yaml
├── user-service/
│   ├── src/
│   │   ├── config/       # Environment config, DB connection
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/    # Error handler, logging
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Route definitions
│   │   ├── utils/        # Helpers, logger
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── task-service/
│   └── (same structure + services/ for RabbitMQ logic)
└── notification-service/
    └── src/
        ├── config/       # RabbitMQ connection
        ├── services/     # Consumer logic
        ├── utils/        # Logger
        └── server.js     # Entry point
```

## Production Features

- **Structured logging** with Pino (JSON format)
- **Security** via Helmet, CORS, rate limiting
- **Health checks** for all services
- **Graceful shutdown** handling (SIGTERM/SIGINT)
- **Input validation** with Mongoose validators
- **Error handling** with custom AppError class
- **Docker** multi-stage builds, non-root user, health checks
- **Environment-based configuration** via dotenv
- **RabbitMQ** retry logic, dead letter handling, message persistence
