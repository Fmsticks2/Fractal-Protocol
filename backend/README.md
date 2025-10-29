# Fractal Protocol Backend

Express server providing market data and a proxy to the Linera wallet’s GraphQL service.

## Quick Start

```
# Install dependencies
cd "C:\Users\User\Desktop\Fractal Protocol\backend"
npm install

# Configure environment
copy .env.example .env  # or manually create .env

# Start backend (dotenv autoload enabled)
npm start

# Seed Postgres (optional)
npm run seed
```

## Environment Variables
Set these values in `backend/.env`:

```
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Linera wallet GraphQL service
LINERA_GRAPHQL_URL=http://localhost:8080/graphql
# or per-chain application
# LINERA_GRAPHQL_URL=http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>

# Optional Postgres
# DATABASE_URL=postgres://user:password@localhost:5432/fractal
```

## API Endpoints
- `GET /health` — Basic service liveness
- `GET /api/markets` — List markets (filters supported via query params)
- `GET /api/markets/:id` — Fetch single market by ID
- `POST /api/markets` — Insert market (requires Postgres)
- `GET /api/linera/health` — Check configured Linera GraphQL service
- `POST /api/linera/graphql` — Proxy GraphQL requests to the Linera service

## Linera Wallet GraphQL
- Start the wallet service in WSL Ubuntu:

```
linera service --port 8080
```

- GraphiQL: `http://localhost:8080/`
- System GraphQL: `http://localhost:8080/graphql`
- App GraphQL: `http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>`

See `docs/linera-setup.md` for detailed installation and usage.

## CORS
- Production: set `ALLOWED_ORIGINS` to a comma-separated list of allowed origins.
- Development: localhost ports `5173` and `5174` are allowed by default.

## Render Deployment
- Set environment variables in Render service settings.
- Use `npm run seed` as a one-off job for DB seeding.

## Production Notes
- `NODE_ENV=production` requires `DATABASE_URL`; the service will exit if missing.
- Security middleware enabled: `helmet`, `compression`, request logging via `morgan`.
- Rate limiting: adjust `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` via env.
- Postgres pool tuning: `PG_POOL_MAX`, `PG_IDLE_TIMEOUT_MS`, `PG_CONN_TIMEOUT_MS`.
- Graceful shutdown on `SIGTERM`/`SIGINT` closes DB pool and HTTP server.