# Deployment Guide — Cricket Tournament Management System

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | React + Vite (static on Vercel) |
| API | Express via Vercel Serverless Function (`/api`) |
| Database | MongoDB Atlas |
| Images | Cloudinary (required in production) |
| Payments | Stripe |

## Vercel setup

1. Connect the Git repository to Vercel.
2. **Root directory:** repository root (contains `vercel.json`).
3. **Framework preset:** Other (build is defined in `vercel.json`).
4. Add all environment variables below in **Project → Settings → Environment Variables**.

### Required environment variables

| Variable | Where | Notes |
|----------|--------|--------|
| `MONGODB_URI` | Backend | Atlas connection string |
| `MONGODB_DATABASE` | Backend | e.g. `cricket_tournament` |
| `JWT_SECRET` | Backend | Long random string |
| `JWT_EXPIRE` | Backend | e.g. `7d` |
| `NODE_ENV` | Backend | `production` |
| `CLIENT_URL` | Backend | Your Vercel production URL, e.g. `https://your-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Backend | Required on Vercel |
| `CLOUDINARY_API_KEY` | Backend | Required on Vercel |
| `CLOUDINARY_API_SECRET` | Backend | Required on Vercel |
| `STRIPE_SECRET_KEY` | Backend | `sk_test_` or live key |
| `STRIPE_WEBHOOK_SECRET` | Backend | From Stripe webhook endpoint |
| `VITE_API_URL` | Frontend | Use `/api` for same-origin deploy |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend | `pk_test_` or live key |

### Optional

| Variable | Purpose |
|----------|---------|
| `ADDITIONAL_CORS_ORIGINS` | Comma-separated extra allowed origins |
| `ADMIN_*` | For `npm run seed:admin` locally only |
| `VERCEL_URL` | Set automatically by Vercel |

## Stripe webhook

Point Stripe webhook to:

```
https://YOUR_DOMAIN/api/payments/webhook
```

Use the **raw body** endpoint (already configured in `app.js`).

## Local development

```bash
# Terminal 1 — API
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Cloudinary is optional locally; images fall back to `backend/uploads/`.

## Production checklist

- [ ] All required env vars set in Vercel
- [ ] `CLIENT_URL` matches production domain
- [ ] Cloudinary credentials configured
- [ ] MongoDB Atlas IP allowlist includes `0.0.0.0/0` (or Vercel IPs)
- [ ] Stripe webhook URL updated
- [ ] Run `npm run seed:admin` once against production DB (local script)
- [ ] Verify `GET /api/health` returns 200 after deploy

## Manual actions (not automated)

1. Create MongoDB Atlas cluster and user.
2. Create Cloudinary account and upload preset folders (auto-created on first upload).
3. Configure Stripe products and webhook.
4. Set Vercel environment variables for Production and Preview.
