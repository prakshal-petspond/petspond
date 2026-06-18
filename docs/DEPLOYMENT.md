# Petspond deployment guide

Deploy **Vet CRM Web** on Netlify, the **NestJS API** on Railway, and **MongoDB** on Atlas — with separate **development** and **production** environments (no staging).

| Component | Platform | Dev | Production |
|-----------|----------|-----|------------|
| Vet CRM Web | Netlify | `develop` branch | `main` branch |
| API | Railway | `develop` branch service | `main` branch service |
| Database | MongoDB Atlas | `petspond-dev` database | `petspond-prod` database |

---

## Architecture

```
┌─────────────────────┐         HTTPS          ┌─────────────────────┐
│  Netlify            │  NEXT_PUBLIC_API_URL   │  Railway            │
│  Vet CRM Web        │ ─────────────────────► │  NestJS API         │
│  (Next.js)          │                        │  (port from PORT)   │
└─────────────────────┘                        └──────────┬──────────┘
                                                          │
                                                          │ MONGODB_URI
                                                          ▼
                                               ┌─────────────────────┐
                                               │  MongoDB Atlas      │
                                               │  petspond-dev       │
                                               │  petspond-prod      │
                                               └─────────────────────┘
```

---

## Prerequisites

- GitHub repo connected to Netlify and Railway
- Two git branches: `main` (production) and `develop` (development)
- Accounts: [MongoDB Atlas](https://www.mongodb.com/atlas), [Railway](https://railway.app), [Netlify](https://www.netlify.com)
- Optional but recommended: [Resend](https://resend.com) (email OTP), [Cloudflare R2](apps/api/CLOUDFLARE_R2_SETUP.md) (uploads), Google Cloud (OAuth + Maps)

---

## Step 1 — MongoDB Atlas

### 1.1 Create a cluster

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com).
2. **Create** → choose **M0 Free** (fine for dev) or a paid tier for production load.
3. Pick a region close to your Railway region (e.g. `us-east-1`).

### 1.2 Create database users

1. **Database Access** → **Add New Database User**.
2. Use **Password** auth; generate a strong password.
3. Privilege: **Read and write to any database** (or restrict to `petspond-dev` / `petspond-prod`).

### 1.3 Network access

Railway uses dynamic IPs, so allow access from anywhere:

1. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).

Use a strong DB password and never commit connection strings.

### 1.4 Connection strings

1. **Database** → **Connect** → **Drivers** → copy the `mongodb+srv://…` URI.
2. Append the database name:

| Environment | URI suffix |
|-------------|------------|
| Development | `…mongodb.net/petspond-dev?retryWrites=true&w=majority` |
| Production | `…mongodb.net/petspond-prod?retryWrites=true&w=majority` |

Replace `<password>` with your DB user password.

---

## Step 2 — Railway (API)

Create **two services** from the same GitHub repo.

### 2.1 Create development API

1. Railway → **New Project** → **Deploy from GitHub repo** → select `petspond`.
2. Name the service **`petspond-api-dev`**.
3. **Settings** → **Source** → set **Branch** to `develop`.
4. **Settings** → **Build** → confirm Dockerfile path: `apps/api/Dockerfile` (from `railway.toml`).
5. **Settings** → **Networking** → **Generate Domain** (e.g. `petspond-api-dev.up.railway.app`).

### 2.2 Create production API

1. In the same project (or a separate one): **New Service** → same repo.
2. Name it **`petspond-api-prod`**.
3. Set **Branch** to `main`.
4. Generate a public domain.

### 2.3 Environment variables

Set these on **each** Railway service (**Variables** tab). Values differ per environment.

#### Shared variable reference

| Variable | Dev example | Prod example | Notes |
|----------|-------------|--------------|-------|
| `NODE_ENV` | `development` | `production` | |
| `MONGODB_URI` | `…/petspond-dev?…` | `…/petspond-prod?…` | From Atlas |
| `JWT_SECRET` | random 32+ chars | **different** random secret | `openssl rand -base64 32` |
| `API_PUBLIC_URL` | `https://petspond-api-dev.up.railway.app` | `https://petspond-api-prod.up.railway.app` | Railway public URL |
| `CORS_ORIGINS` | `https://petspond-vet-dev.netlify.app,http://localhost:3001` | `https://petspond-vet-prod.netlify.app` | Comma-separated, no trailing slash |
| `EMAIL_PROVIDER` | `resend` | `resend` | |
| `RESEND_API_KEY` | your key | your key | Same or separate Resend projects |
| `EMAIL_FROM` | verified sender | verified domain sender | e.g. `noreply@yourdomain.com` |
| `GOOGLE_CLIENT_ID` | Web client ID | same or separate client | Must match frontend |
| `OTP_BYPASS` | `true` | **`false`** | Never bypass OTP in prod |
| `OTP_BYPASS_CODE` | `123456` | (ignored if bypass off) | |
| `R2_ACCOUNT_ID` | … | … | See [CLOUDFLARE_R2_SETUP.md](../apps/api/CLOUDFLARE_R2_SETUP.md) |
| `R2_ACCESS_KEY_ID` | … | … | |
| `R2_SECRET_ACCESS_KEY` | … | … | |
| `R2_BUCKET_NAME` | `petspond-dev` | `petspond-prod` | Separate buckets recommended |
| `STRIPE_SECRET_KEY` | test key | live key | If using payments |

`PORT` is injected automatically by Railway — do not override it.

### 2.4 Deploy and verify

After the first deploy:

```bash
curl https://petspond-api-dev.up.railway.app/health
# → {"status":"ok","timestamp":"…"}
```

Repeat for production.

---

## Step 3 — Netlify (Vet CRM Web)

Create **two sites** from the same repo.

### 3.1 Development site

1. Netlify → **Add new site** → **Import from Git** → select `petspond`.
2. Site name: e.g. **`petspond-vet-dev`**.
3. **Build settings** (should auto-detect from `netlify.toml`):
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @petspond/vet-crm-web build`
   - **Publish directory:** `apps/vet-crm-web/.next`
   - **Base directory:** leave empty (repo root)
4. **Deploy contexts** → **Branch deploys** → set production branch to **`develop`** for this site  
   *(or use Site settings → Build & deploy → Deploy contexts)*.

### 3.2 Production site

1. Create another site: **`petspond-vet-prod`**.
2. Same build settings.
3. Production branch: **`main`**.

### 3.3 Environment variables (per site)

| Variable | Dev site | Prod site |
|----------|----------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://petspond-api-dev.up.railway.app` | `https://petspond-api-prod.up.railway.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Web client ID | Same or prod client |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps key (HTTP referrer restricted) | Maps key |

Redeploy after changing `NEXT_PUBLIC_*` variables (they are baked in at build time).

### 3.4 Custom domains (optional)

1. Netlify → **Domain management** → add your domain.
2. Update `CORS_ORIGINS` on the matching Railway service to include the new URL.
3. Update Google OAuth **Authorized JavaScript origins** and Maps API **HTTP referrers**.

---

## Step 4 — Google Cloud (OAuth + Maps)

### OAuth (Vet CRM sign-in)

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create **OAuth 2.0 Client ID** → **Web application**.
3. **Authorized JavaScript origins:**

   ```
   http://localhost:3001
   https://petspond-vet-dev.netlify.app
   https://petspond-vet-prod.netlify.app
   https://your-custom-domain.com
   ```

4. Set the client ID in:
   - Netlify: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Railway: `GOOGLE_CLIENT_ID`

### Maps (clinic onboarding)

1. Enable **Maps JavaScript API** and **Places API**.
2. Create an API key; restrict by HTTP referrer to your Netlify domains.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` on each Netlify site.

---

## Step 5 — Resend (email OTP)

1. Create a [Resend](https://resend.com) account.
2. For dev: `onboarding@resend.dev` works but only sends to your Resend account email.
3. For prod: verify your domain and set `EMAIL_FROM=noreply@yourdomain.com`.
4. Add `RESEND_API_KEY` to both Railway services.

---

## Step 6 — Wire CORS (critical)

After Netlify deploys, copy each site URL and set `CORS_ORIGINS` on the **matching** Railway API:

```
# petspond-api-dev
CORS_ORIGINS=https://petspond-vet-dev.netlify.app,http://localhost:3001

# petspond-api-prod
CORS_ORIGINS=https://petspond-vet-prod.netlify.app
```

If CORS is wrong, the browser will block API calls with a CORS error in DevTools.

---

## Step 7 — Git workflow

```bash
# Daily development
git checkout develop
# … make changes …
git push origin develop
# → triggers Railway dev + Netlify dev deploys

# Release to production
git checkout main
git merge develop
git push origin main
# → triggers Railway prod + Netlify prod deploys
```

---

## Local development (unchanged)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local      # fill MONGODB_URI, etc.
cp apps/vet-crm-web/.env.example apps/vet-crm-web/.env.local

pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:3001
```

Point `MONGODB_URI` at Atlas `petspond-dev` or a local MongoDB instance.

---

## Environment checklist

### Development

- [ ] Atlas cluster + `petspond-dev` database
- [ ] Railway `petspond-api-dev` on `develop` branch
- [ ] Netlify `petspond-vet-dev` on `develop` branch
- [ ] `NEXT_PUBLIC_API_URL` → dev Railway URL
- [ ] `CORS_ORIGINS` includes dev Netlify URL + localhost
- [ ] `OTP_BYPASS=true` (optional for easier testing)
- [ ] `JWT_SECRET` set (dev-specific)

### Production

- [ ] Atlas `petspond-prod` database (separate from dev)
- [ ] Railway `petspond-api-prod` on `main` branch
- [ ] Netlify `petspond-vet-prod` on `main` branch
- [ ] **Different** `JWT_SECRET` from dev
- [ ] `OTP_BYPASS=false`
- [ ] `NODE_ENV=production`
- [ ] Resend domain verified
- [ ] Google OAuth origins include prod Netlify URL
- [ ] R2 bucket for prod uploads
- [ ] Stripe live keys (if applicable)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| CORS error in browser | `CORS_ORIGINS` missing/wrong | Add exact Netlify URL (no trailing slash) on Railway |
| API 502 / not starting | Bad `MONGODB_URI` | Check Atlas IP allowlist + password encoding |
| Email OTP not received | Resend sender not verified | Verify domain or use `onboarding@resend.dev` for dev |
| Google sign-in fails | Origin not authorized | Add Netlify URL to OAuth client origins |
| `NEXT_PUBLIC_*` not updating | Build-time env | Redeploy Netlify after changing variables |
| Build fails on Netlify | Monorepo deps | Confirm `pnpm install` runs at repo root (see `netlify.toml`) |
| Railway build slow | Docker layer cache | Normal on first build; subsequent builds are faster |

### Useful commands

```bash
# Test API health
curl https://YOUR-RAILWAY-URL/health

# Build API locally (same as Railway)
pnpm build:api

# Build web locally (same as Netlify)
pnpm build:web
```

---

## Files added for deployment

| File | Purpose |
|------|---------|
| `apps/api/Dockerfile` | Railway container build |
| `railway.toml` | Railway build + health check config |
| `netlify.toml` | Netlify monorepo build config |
| `.dockerignore` | Smaller Docker context |
| `.nvmrc` | Node 20 for local/CI parity |
| `apps/api/.env.example` | Full API env reference |
| `apps/api/src/cors.ts` | Production CORS from `CORS_ORIGINS` |

---

## Cost notes (approximate)

- **MongoDB Atlas M0:** free tier (shared)
- **Railway:** pay-as-you-go (~$5+/month per service with usage)
- **Netlify:** free tier supports two sites for hobby projects
- **Resend:** free tier for low email volume

Scale Atlas/Railway tiers as traffic grows.
