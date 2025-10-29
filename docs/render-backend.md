# Deploy Backend to Render

This guide uses `render.yaml` (at the repo root) to deploy the backend Express API and optionally provision a managed Postgres database.

## What’s Included
- Web service: builds from `backend/` and starts with `npm start`.
- Health check: `/health`.
- Env vars: `NODE_ENV`, `ALLOWED_ORIGINS`, `LINERA_GRAPHQL_URL`, `DATABASE_URL` (from managed DB), `NODE_VERSION`.
- Optional: managed Postgres (`databases` section) with `DATABASE_URL` wired automatically to the service.

## Prerequisites
- Repository pushed to GitHub/GitLab/Bitbucket.
- Render account.

## Deploy via Render YAML
1. Ensure `render.yaml` is committed at the repo root.
2. In Render, click “New +” → “Blueprint” (YAML) → select your repo.
3. Review the plan/region, edit env var placeholders as needed (you can also set/override env vars in the service settings after creation).
4. Create the blueprint; Render will provision the Postgres (if kept) and deploy the web service.

## Environment Variables
Set these in your Render Web Service (some are included in the YAML):

- `NODE_ENV = production`
  - Enables production mode.
- `ALLOWED_ORIGINS`
  - Comma-separated list of allowed frontend origins for CORS.
  - Example: `https://<your-site>.netlify.app,https://yourdomain.com`
- `LINERA_GRAPHQL_URL`
  - Points to your Linera wallet node GraphQL endpoint (or app GraphQL).
  - Example: `https://wallet-node.yourdomain.com/graphql`
- `DATABASE_URL`
  - Set automatically if you use the managed Postgres in `render.yaml`.
  - If using an external DB, set the full connection string:
  - Format: `postgres://user:password@host:5432/dbname`
- `NODE_VERSION = 20`
  - Ensures Node 20 runtime.

Note: Do not set `PORT` manually; Render injects it and the server respects `process.env.PORT`.

## Health Check
- Path: `/health`
- Returns `{ ok: true, db: true|false }` depending on DB availability.

## Seeding the Database
- The repo includes `backend/seed.js` and `npm run seed`.
- To seed on Render:
  - Use the Render UI → your web service → “Manual Deploy” → “Run a job” (One-off) → Command:
    - `cd backend && npm run seed`
  - Ensure `DATABASE_URL` is set before seeding.

## Build & Start Commands
- Build: `cd backend && npm ci`
- Start: `cd backend && npm start`
  - The start script preloads `dotenv/config`, but in Render the env is provided by the platform (it’s fine to keep).

## Postgres SSL
- The backend config uses `ssl: { rejectUnauthorized: false }` in production so it can connect to managed Postgres without custom certificates.

## Troubleshooting
- 404 for frontend requests: verify `ALLOWED_ORIGINS` includes your Netlify domain.
- Linera proxy errors: check `LINERA_GRAPHQL_URL` and that the wallet node is reachable from Render.
- DB connection failures: ensure `DATABASE_URL` is present and correct; confirm the managed DB is provisioned and available.