# Fractal Protocol Docker Setup

## Prerequisites

- Docker Desktop installed and running
- On Windows: WSL 2 backend enabled in Docker Desktop

## Services and Ports

- Frontend: `http://localhost:5173`
- Linera faucet: `http://localhost:8082`
- Linera wallet GraphQL service: `http://localhost:8081/graphql`
- Backend API: `http://localhost:3000`

## Start Everything

```bash
cd Fractal Protocol
docker compose up --force-recreate
```

This builds the container image, spins up a local Linera network, compiles all smart contracts to Wasm, publishes and creates the hello application, starts the Linera wallet GraphQL service, and runs the frontend and backend.

## Verify

- Frontend: open `http://localhost:5173`
- Backend health: `http://localhost:3000/health`
- Linera GraphQL health via backend proxy:

```bash
curl -X POST http://localhost:3000/api/linera/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ __schema { queryType { name } } }"}'
```

## Interact with Hello App via GraphQL

Increment the counter:

```bash
curl -X POST http://localhost:3000/api/linera/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"mutation { increment(by: 1) }"}'
```

Query value (if exposed in schema):

```bash
curl -X POST http://localhost:3000/api/linera/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ __typename }"}'
```

## Troubleshooting

- Error connecting to Docker engine: start Docker Desktop and retry `docker compose up`.
- Port conflicts: ensure ports `5173`, `8080`, `8081`, `3000` are free.
- Recreate containers: `docker compose down -v && docker compose up --force-recreate`.
- Slow installs on first run: Node packages are installed in the backend container; subsequent runs are faster.