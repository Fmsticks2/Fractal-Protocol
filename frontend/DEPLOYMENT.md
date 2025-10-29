# Frontend Deployment Configuration

## Required Env Variable
- `VITE_API_BASE_URL`: Backend base URL used by the frontend API client.
  - Example: `https://fractal-backend.onrender.com`
  - Referenced in `src/config/api.ts`.

## Netlify Setup
- Build settings (already configured via `netlify.toml` at repo root):
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `dist`
- SPA redirects:
  - `netlify.toml` and `public/_redirects` both map `/*` to `/index.html`.

## Set Env in Netlify
1. Go to your Netlify site → Site settings → Environment variables.
2. Add `VITE_API_BASE_URL` with your deployed backend URL.
3. Redeploy the site.

## Local Development
- Copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL` to your backend URL.
- Run `npm run dev`.

## Backend CORS
- Ensure the backend’s `ALLOWED_ORIGINS` includes your Netlify domain (and any custom domain).
  - Example: `https://<site-name>.netlify.app,https://yourdomain.com`

## Verify
- Open the site and check network requests to `GET /api/markets`.
- Health check: `GET <backend>/health` should return `{ ok: true }`.