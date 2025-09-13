# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StreetPerformersMap is a real-time platform connecting street musicians with audiences through an interactive map experience. The project uses a monorepo structure with separate frontend, backend, and shared-types packages.

## Repository Structure

```
street-performers-map/
├── apps/
│   ├── frontend/          # React 18+ frontend with Vite
│   └── backend/           # Node.js/Express API with DDD architecture
├── packages/
│   └── shared-types/      # TypeScript type definitions
├── TECHNICAL_ARCHITECTURE.md  # Detailed technical documentation
└── PRD.md                     # Product requirements and user stories
```

## Common Commands

### Root-level commands (using pnpm)
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean all build artifacts and node_modules

### Frontend (apps/frontend)
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production (runs type-check first)
- `pnpm preview` - Preview production build
- `pnpm test` - Run Vitest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint
- `pnpm type-check` - TypeScript type checking only

### Backend (apps/backend)
- `pnpm dev` - Start development server with tsx watch
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm test` - Run Vitest tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Run ESLint on src directory
- `pnpm type-check` - TypeScript type checking only

### Shared Types (packages/shared-types)
- `pnpm build` - Compile TypeScript definitions
- `pnpm dev` - Watch mode compilation

## Architecture

### Frontend Stack
- **React 18+** with TypeScript and Vite for build tooling
- **React Router DOM** for client-side routing  
- **Zustand** for state management
- **TanStack React Query** for server state management
- **React Google Maps (@vis.gl/react-google-maps)** for map functionality
- **Socket.io Client** for real-time updates
- **Tailwind CSS** for styling
- **Vitest** for testing

### Backend Stack
- **Domain-Driven Design (DDD)** architecture with separate domains
- **Express.js** with TypeScript
- **MongoDB** (via Mongoose) for content and user data
- **Socket.io** for WebSocket real-time communication
- **JWT** authentication with bcryptjs for password hashing
- **Winston** for structured logging
- **Zod** for input validation

### Domain Structure
The backend follows DDD patterns with domains in `apps/backend/src/domains/`:
- **user/** - User management, authentication, profiles
- **performance/** - Performance creation, routes, scheduling
- **media/** - Video upload, processing, storage

Each domain contains:
- `entities/` - Core business entities
- `repositories/` - Data access layer
- `services/` - Business logic
- `controllers/` - HTTP request handlers
- `routes/` - Express route definitions

### Shared Types
All TypeScript interfaces and types are centralized in `packages/shared-types/src/index.ts` and shared between frontend and backend via workspace references.

## Development Workflow

1. **Environment Setup**: Copy `apps/backend/env.example` to `.env` and configure
2. **Dependencies**: Run `pnpm install` from root to install all dependencies
3. **Development**: Use `pnpm dev` to start all services in parallel
4. **Type Safety**: The shared-types package must be built before frontend/backend can use the types
5. **Testing**: Each package has its own test suite with Vitest

## Key Files

- `apps/backend/src/index.ts` - Main server entry point with Express and Socket.io setup
- `apps/backend/src/shared/infrastructure/database.ts` - MongoDB connection
- `apps/backend/src/shared/infrastructure/routes.ts` - Route registration
- `apps/frontend/src/main.tsx` - React app entry point
- `packages/shared-types/src/index.ts` - All shared TypeScript definitions

## Real-time Features

The application uses Socket.io for real-time communication:
- Performance status updates
- Live engagement metrics (likes, views)
- Map marker updates
- User notifications

## Testing

- **Frontend**: Vitest with React Testing Library
- **Backend**: Vitest with Supertest for API testing
- **Coverage**: Available via `pnpm test:coverage` in backend

## Production Considerations

The architecture is designed for microservices deployment with:
- Kubernetes orchestration
- Auto-scaling capabilities
- Multi-database support (MongoDB + PostgreSQL + Redis)
- Apache Kafka for event streaming
- AWS S3 for video storage

Refer to TECHNICAL_ARCHITECTURE.md for detailed infrastructure and scaling information.

## Important Notes
- follow SOLID, YAGNI, and KISS principles