# Fractal Protocol

Fractal Protocol is an AI‑enhanced prediction market platform where each event dynamically spawns conditional sub‑markets based on its outcome — forming an evolving, tree‑like network of interrelated predictions. The system leverages Linera’s microchain architecture to achieve linear scalability, instant finality, and cross‑chain message propagation.

## Key Features
- Dynamic market creation with automatic sub‑market spawning
- Cross‑chain messaging across markets using Linera
- AI agents act as market architects and liquidity providers
- Interactive graph visualization of market relationships
- Instant finality and low‑cost transactions

## Architecture
- Frontend (`frontend/`): React + TypeScript
- Smart Contracts (`contracts/`): Linera microchains
  - `market` + `market-service`: market logic and GraphQL service
  - `factory` + `factory-service`: market factory, orchestration, state registry
  - `spawn-handler`: rules for conditional sub‑market spawning
  - `hello` + `hello-service`: minimal sample app
- Backend (`backend/`): Node.js Express API and Linera GraphQL proxy
- Docs (`docs/`): developer guides and Docker setup

## What’s Implemented
- Linera contracts for `market`, `factory`, `spawn-handler`, and sample `hello`
- GraphQL services for market, factory, and hello
- Backend Express API with a proxy to Linera wallet GraphQL
- Frontend scaffolding with market browsing and wallet connect stubs
- Dockerized local development that:
  - Spins up a Linera localnet with faucet
  - Compiles all contracts to Wasm
  - Publishes and creates apps when contract+service artifacts exist (hello, market, factory)
  - Runs Linera wallet GraphQL service on `8081`
  - Serves the frontend on `5173` and backend on `3000`

## Quick Start (Docker)
Prerequisites:
- Docker Desktop running (Windows: WSL 2 backend enabled)

Run:
1. `docker compose up --build --force-recreate`
2. Open:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`
   - Linera GraphQL: `http://localhost:8081/graphql`
   - Faucet: `http://localhost:8082`

The `app` container compiles the workspace contracts to `contracts/target/wasm32-unknown-unknown/release/*.wasm` and auto‑publishes/creates the apps for hello, market, and factory when both contract and service artifacts exist.

## Development Notes
- Workspace contracts are defined in `contracts/Cargo.toml` and compiled together; Wasm outputs are in `contracts/target/...`.
- Services use `async-graphql` and expose queries/mutations aligned with contract operations.
- Backend proxies GraphQL via `POST /api/linera/graphql` to `http://localhost:8081/graphql`.
- Frontend’s API base defaults to `http://localhost:3000` and can be overridden via `VITE_API_BASE_URL`.

## Troubleshooting
- If publish is skipped, check `app` logs to confirm Wasm files existed at workspace target paths.
- Port conflicts: ensure `5173`, `8082`, `8081`, `3000` are free or adjust `compose.yaml` mappings.
- First run may take longer while Node packages install in the backend container.

## Repository Structure
```
fractal-protocol/
├── contracts/           # Linera smart contracts
│   ├── market/          # Core market contract
│   ├── factory/         # Market factory contract
│   ├── spawn-handler/   # Cross-chain spawn handler
│   ├── hello/           # Sample contract
│   ├── market-service/  # Market GraphQL service
│   ├── factory-service/ # Factory GraphQL service
│   └── hello-service/   # Hello GraphQL service
├── frontend/            # React frontend
├── backend/             # Express backend
├── docs/                # Documentation
├── Dockerfile           # Root Docker image for app container
├── compose.yaml         # Root Docker Compose for app + backend
└── run.bash             # Startup script inside app container
```

This template provides a Docker container with all the necessary
dependencies to build and run a local Linera application against a
local network.

If you want to submit an app running against a local network, please
use this template.  If you have provided a link to a live demo running
against the testnet, you do not need to use this template (but it may
be helpful anyway!).

## Structure

The template provides a `Dockerfile` describing a container with all the
necessary dependencies for Linera backend and frontend development, as
well as a simple `compose.yaml` file for Docker Compose that mounts
the current directory at `/build` and exposes the following ports:

- 5173: the frontend of your application (optional)
- 8080: the Linera faucet
- 9001: the localnet validator's proxy
- 13001: the localnet validator itself

Please keep this port structure, and make sure the `Dockerfile` or the
`compose.yaml` defines a reasonable healthcheck for your app (the
default waits for your frontend to be served on `localhost:5173`).
Other internal structure is optional; feel free to change it.

## Usage

To get started, fill in `run.bash` with instructions to build and run
your backend and (if applicable) frontend.

To test that your submission works, run `docker compose up
--force-recreate` and access your application frontend at
`localhost:5173`.
