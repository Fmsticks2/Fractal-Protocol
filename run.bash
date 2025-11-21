#!/usr/bin/env bash

set -euxo pipefail

# 1) Spin up a localnet with faucet and helper env vars
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# 2) Build contracts to Wasm (if present in /build/contracts)
if [ -d "/build/contracts" ]; then
  cd /build/contracts
  rustup target add wasm32-unknown-unknown || true
  cargo build --release --target wasm32-unknown-unknown || true
  cd /build
fi

# 3) Publish and create applications for available contract/service pairs
publish_pair() {
  local contract_path=$1
  local service_path=$2
  local label=$3
  if [ -f "$contract_path" ] && [ -f "$service_path" ]; then
    local BYTECODE_ID
    BYTECODE_ID=$(linera publish-bytecode "$contract_path" "$service_path")
    local APP_ID
    APP_ID=$(linera create-application "$BYTECODE_ID" --json-argument "null")
    echo "Published $label bytecode: $BYTECODE_ID"
    echo "Created $label application: $APP_ID"
  else
    echo "$label Wasm not found; skipping publish/create."
  fi
}

publish_pair \
  /build/contracts/hello/target/wasm32-unknown-unknown/release/hello_contract.wasm \
  /build/contracts/hello-service/target/wasm32-unknown-unknown/release/hello_service.wasm \
  hello

publish_pair \
  /build/contracts/market/target/wasm32-unknown-unknown/release/market_contract.wasm \
  /build/contracts/market-service/target/wasm32-unknown-unknown/release/market_service.wasm \
  market

publish_pair \
  /build/contracts/factory/target/wasm32-unknown-unknown/release/factory_contract.wasm \
  /build/contracts/factory-service/target/wasm32-unknown-unknown/release/factory_service.wasm \
  factory

# 4) Start the wallet node service (GraphQL) on 8081 to avoid faucet port conflict
linera service --port 8081 &

# 5) Build and run the frontend on port 5173
if [ -d "/build/frontend" ]; then
  cd /build/frontend
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --prefer-frozen-lockfile=false
    pnpm dev --host 0.0.0.0
  else
    npm install --no-audit --no-fund
    npm run dev -- --host 0.0.0.0
  fi
else
  echo "No /build/frontend directory found. Container healthcheck will fail unless a web server binds :5173."
  tail -f /dev/null
fi
