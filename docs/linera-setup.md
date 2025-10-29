# Linera Toolchain Setup (WSL Ubuntu)

This guide installs the Linera CLI (developer wallet and node service) in Windows via WSL Ubuntu and configures the backend proxy to talk to the wallet’s local GraphQL service.

## Prerequisites
- Windows 10/11 with Administrator rights
- WSL enabled (we will install if not already)
- Ubuntu (WSL distribution)

## 1) Install WSL and Ubuntu (Windows PowerShell)
Run PowerShell as Administrator:

```
# Install WSL with Ubuntu (reboot may be required)
wsl --install -d Ubuntu

# Check installations and versions
wsl -l -v
```

If prompted, create a Linux user in the Ubuntu terminal after first launch.

## 2) Base Linux tooling (inside Ubuntu)
Open Ubuntu terminal from Start Menu, then:

```
# Update packages
sudo apt update && sudo apt upgrade -y

# Essential build tools and SSL/Clang dependencies
sudo apt install -y build-essential pkg-config libssl-dev clang jq unzip
```

## 3) Install Rust and Wasm target
Linera CLI is built in Rust. Install Rust via rustup and add the Wasm target ([Installation docs](https://linera.dev/developers/getting_started/installation.html)):

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Restart shell or source cargo env
source "$HOME/.cargo/env"

# Add Wasm target
rustup target add wasm32-unknown-unknown

# Optional: install helpful cargo tools
cargo install cargo-rdme taplo-cli cargo-all-features cargo-machete
```

## 4) Install Protobuf compiler (protoc)
Required by Linera ([INSTALL.md](https://github.com/linera-io/linera-protocol/blob/main/INSTALL.md)):

```
curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v21.11/protoc-21.11-linux-x86_64.zip
unzip protoc-21.11-linux-x86_64.zip -d $HOME/.local
export PATH="$HOME/.local/bin:$PATH"
```

Add the last export to your shell rc (e.g., `~/.bashrc`) to persist.

## 5) Install Linera CLI binaries
Install released binaries from crates.io ([Installation docs](https://linera.dev/developers/getting_started/installation.html)):

```
# Install Linera client + node service and local storage service
cargo install --locked linera-service@0.15.3
cargo install --locked linera-storage-service@0.15.3

# Ensure cargo bin is on PATH
export PATH="$HOME/.cargo/bin:$PATH"
linera --help
```

Alternatively, build from source using the Testnet branch (see docs) and use `target/debug` binaries.

## 6) Create a developer wallet and chain
You can use a local devnet or a public Testnet.

- Local network ([Hello, Linera](https://linera.dev/developers/getting_started/hello_linera.html)):

```
# Start local network + faucet in a separate shell
echo "Starting local Linera network + faucet";
linera net up --with-faucet --faucet-port 8080

# In another shell, initialize wallet and request a chain
linera wallet init --faucet http://localhost:8080
linera wallet request-chain --faucet http://localhost:8080
```

- Public Testnet (check docs for current faucet URL):

```
linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

Optional: define explicit wallet paths when working with multiple wallets:

```
export LINERA_WALLET="$HOME/wallet.json"
export LINERA_KEYSTORE="$HOME/keystore.json"
export LINERA_STORAGE="rocksdb:$HOME/wallet.db"
```

## 7) Run the wallet node service (GraphQL)
Start the local GraphQL service ([Node Service docs](https://linera.dev/developers/core_concepts/node_service.html)):

```
# Default port is 8080; customize with --port
linera service --port 8080
```

- GraphiQL IDE: `http://localhost:8080/`
- System GraphQL: `http://localhost:8080/graphql`
- Application GraphQL (GraphiQL per chain/app): `http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>`

## 8) Configure the backend to proxy GraphQL
Backend reads environment from `.env` (already enabled). Use one of:

```
# System GraphQL
LINERA_GRAPHQL_URL=http://localhost:8080/graphql

# OR application GraphQL
# LINERA_GRAPHQL_URL=http://localhost:8080/chains/<CHAIN_ID>/applications/<APP_ID>

# CORS (Vite dev servers)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

Then restart the backend:

```
cd "C:\Users\User\Desktop\Fractal Protocol\backend"
npm start
```

Health check and proxy test:

```
# Backend Linera health
GET http://localhost:3000/api/linera/health

# Proxy a GraphQL introspection query
POST http://localhost:3000/api/linera/graphql
Content-Type: application/json

{
  "query": "{ __schema { queryType { name } } }"
}
```

## 9) Frontend configuration
Point the frontend to the backend API:

```
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

## Notes
- GraphQL endpoints are served by your local wallet node; ensure it is running before querying.
- For application GraphQL, you need the `CHAIN_ID` and `APP_ID` of your deployed app.
- If you use Postgres in the backend, set `DATABASE_URL` appropriately in `backend/.env`.