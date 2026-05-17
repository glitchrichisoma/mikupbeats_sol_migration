# MikupBeats — Migration Guide
## ICP/Caffeine → Google Auth + Vercel + Render + Backblaze B2

---

## What Changed (Surgical — Minimal Rewrites)

| File | What changed |
|------|-------------|
| `src/hooks/useInternetIdentity.ts` | ICP Internet Identity → Google OAuth (same interface) |
| `src/hooks/useActor.ts` | ICP canister actor → REST API calls (same method names) |
| `src/pages/LoginPage.tsx` | ICP login button → Google Sign-In button (same visual layout) |
| `package.json` | Removed `@dfinity/*`, `@caffeineai/*`, `@icp-sdk/*` packages |
| `vite.config.js` | Removed ICP/Caffeine plugins, simplified |

**Everything else is untouched** — all 150 components, pages, hooks, admin panels, Stripe logic, audio player, games, forum, showcase — identical to your original.

---

## Step 1 — Google OAuth Setup (Free)

1. Go to https://console.cloud.google.com
2. Create a new project called "MikupBeats"
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `https://your-app.vercel.app` (production)
7. Add Authorized redirect URIs: same two URLs
8. Copy the **Client ID** — you'll need it in Step 3 and Step 4

---

## Step 2 — Backblaze B2 Setup (Free tier: 10GB)

1. Go to https://www.backblaze.com/sign-up/cloud-storage
2. Create account, then go to **Buckets → Create Bucket**
3. Name: `mikupbeats`, type: **Public**
4. Go to **App Keys → Add a New Application Key**
5. Name: `mikupbeats-api`, allow access to bucket: `mikupbeats`
6. Copy: **keyID** and **applicationKey**
7. Note your endpoint — it's shown on the bucket page (e.g. `s3.us-west-004.backblazeb2.com`)
8. Your public URL will be: `https://f004.backblazeb2.com/file/mikupbeats`

---

## Step 3 — Deploy Backend on Render

1. Push the `backend/` folder to a GitHub repo
2. Go to https://render.com → **New → Web Service**
3. Connect your repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add a **PostgreSQL** database (New → PostgreSQL, free tier)
6. Set environment variables (Settings → Environment):
   ```
   DATABASE_URL          = (auto-filled from Render PostgreSQL)
   JWT_SECRET            = (generate: openssl rand -hex 32)
   GOOGLE_CLIENT_ID      = (from Step 1)
   ADMIN_EMAILS          = youremail@gmail.com
   B2_KEY_ID             = (from Step 2)
   B2_APP_KEY            = (from Step 2)
   B2_BUCKET_NAME        = mikupbeats
   B2_REGION             = us-west-004
   B2_ENDPOINT           = https://s3.us-west-004.backblazeb2.com
   B2_PUBLIC_URL         = https://f004.backblazeb2.com/file/mikupbeats
   FRONTEND_URL          = https://your-app.vercel.app
   NODE_ENV              = production
   ```
7. After deploy, run the DB migration:
   - In Render dashboard → your service → **Shell**
   - Run: `npm run db:migrate`
8. Note your backend URL (e.g. `https://mikupbeats-api.onrender.com`)

---

## Step 4 — Deploy Frontend on Vercel

1. Push the `frontend/` folder to a GitHub repo (can be same repo)
2. Go to https://vercel.com → **New Project**
3. Import repo, set **Root Directory** to `frontend`
4. Set environment variables:
   ```
   VITE_API_URL          = https://mikupbeats-api.onrender.com/api
   VITE_GOOGLE_CLIENT_ID = (from Step 1)
   ```
5. Deploy — Vercel auto-detects Vite
6. Copy your Vercel URL, go back to:
   - Google Console → update authorized origins
   - Render backend → update `FRONTEND_URL`

---

## Step 5 — Admin Access

When you sign in with **the Gmail address you put in `ADMIN_EMAILS`**, you automatically get:
- Full admin dashboard with all tabs
- Beat upload/management
- Showcase/mixtape approval
- Platform toggles (wallet on/off, games on/off)
- Stripe config
- All other admin controls

The wallet toggle is **hidden by default**. To show it:
1. Go to Admin → Settings tab
2. Toggle "Wallet Mode" from Hidden → Coming Soon (shows banner) or Live (fully active)
3. That's it — no code changes needed

---

## Step 6 — Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Fill in your values
npm install
npm run db:migrate   # run once
npm run dev          # starts on :3001

# Frontend
cd frontend
cp .env.example .env
# Fill in your values
npm install
npm run dev          # starts on :5173
```

---

## Phase 2 — Solana Token (When Ready)

When you're ready to add the blockchain layer:
1. Your `token_settings` table is already in the DB (token_enabled=false)
2. Admin panel already has the toggle infrastructure
3. You add `@solana/wallet-adapter` to the frontend
4. The wallet page is already in the router
5. Connect Phantom/Solflare wallet to your Google-authenticated session
6. No rebuild needed — the admin toggle turns it on

---

## Files You Never Need to Touch

All component files, pages, contexts, utils, and UI components from your original app are **unchanged**. The only files that moved from ICP to REST are the three listed at the top.
