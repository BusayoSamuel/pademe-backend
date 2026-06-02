# Deploy on Render

## Prerequisites

- GitHub repo with this project
- [Supabase](https://supabase.com) project with migrations applied (`supabase/migrations/*.sql`)
- Render account: https://render.com

## Option A — Blueprint (recommended)

1. Push code to GitHub.
2. Render Dashboard → **New** → **Blueprint**.
3. Connect the repo; Render reads `render.yaml`.
4. When prompted, set these **secret** environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (Supabase **Transaction pooler**, port 6543)
   - `CORS_ORIGINS` (e.g. `https://your-frontend.com,http://localhost:3000`)
5. Deploy. Health check: `GET /health`.
6. API base URL: `https://pademe-backend.onrender.com` (or your service name).
7. Swagger: `https://<your-host>/api`

## Option B — Manual Web Service

1. **New** → **Web Service** → connect repo.
2. Settings:
   - **Runtime:** Node
   - **Build command:** `npm ci --include=dev && npm run build`
   - **Start command:** `npm run start:prod`
   - **Health check path:** `/health`
3. **Environment** → add variables from `.env.example` (use `NODE_ENV=production`, `NODE_VERSION=20`).
4. Deploy.

## Free tier notes

- Service **spins down after 15 min** idle; first request may take ~1 min.
- Upgrade to **Starter ($7/mo)** for always-on.
- Free plan: **512 MB RAM**, **750 instance hours/month**.

## Build failed: `nest: not found`

Render sets `NODE_ENV=production`, so plain `npm ci` omits devDependencies (including `@nestjs/cli`). Use:

```bash
npm ci --include=dev && npm run build
```

## Verify

```bash
curl https://YOUR-SERVICE.onrender.com/health
```

## Local production test

```bash
npm run build
NODE_ENV=production PORT=3000 npm run start:prod
```
