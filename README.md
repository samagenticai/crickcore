# CrickCore – Cricket Tournament Management System

CrickCore is a full-stack platform for organizing cricket tournaments end to end: registration, fixtures, live scoring, public viewers, points tables, subscriptions, and admin oversight.

## Features

- **Organizer dashboard** — Create and manage tournaments, teams, players, venues, umpires, scorers, and sponsors
- **Fixture generation** — Round-robin and knockout scheduling with match setup and toss
- **Live scoring** — Ball-by-ball scoring, wicket handling, innings transitions, and chase metrics (runs required, balls remaining, RRR)
- **Public viewer** — Shareable match pages, live scoreboards, points tables, and tournament details without login
- **Match scorecards** — In-app scorecard modal and summary API for completed and live matches
- **Points table** — Automatic standings with NRR and fixture progress
- **Subscriptions** — Stripe-powered plans with checkout and webhooks
- **Admin panel** — Platform-wide user, tournament, payment, and resource management
- **Media uploads** — Cloudinary (required; no local disk storage)
- **Security** — JWT auth, role-based access, rate limiting, helmet, CORS, and 15-minute inactivity logout on dashboards

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Recharts, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, Multer |
| Database | MongoDB Atlas |
| Payments | Stripe |
| Media | Cloudinary |
| Deployment | Vercel (SPA + serverless API) |

## Installation

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas cluster (or local MongoDB)
- Stripe account (test keys for development)
- Cloudinary account (required for production uploads)

### Clone and install

```bash
git clone <your-repo-url>
cd CricketMatch
npm install
```

Copy environment templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in the values described below, then start development servers.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | API port (default `5000`) |
| `HOST` | No | Bind address (default `0.0.0.0`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DATABASE` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRE` | No | Token lifetime (e.g. `7d`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `CLIENT_URL` | Yes | Primary frontend origin (production URL on Vercel) |
| `ADDITIONAL_CORS_ORIGINS` | No | Comma-separated extra allowed origins |
| `CLOUDINARY_CLOUD_NAME` | Prod | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Prod | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Prod | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_test_…` or live) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `ADMIN_EMAIL` | Seed | Admin email for `npm run seed:admin` |
| `ADMIN_PASSWORD` | Seed | Admin password for seed script |
| `ADMIN_PHONE` | Seed | Admin phone for seed script |
| `ADMIN_FULL_NAME` | Seed | Admin display name |
| `ADMIN_SESSION_POLICY` | Seed | Session policy for seed script |

See [`backend/.env.example`](backend/.env.example) for a ready-to-copy template.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | API base URL. Use `/api` for same-origin Vercel deploy |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (`pk_test_…` or live) |

See [`frontend/.env.example`](frontend/.env.example) for a ready-to-copy template.

### Vercel (production)

Set all backend and frontend variables in **Project → Settings → Environment Variables**. `VERCEL_URL` is provided automatically. Use `VITE_API_URL=/api` so the SPA calls the serverless API on the same domain.

Full deployment checklist: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Local Development

```bash
# Terminal 1 — API (port 5000)
npm run dev:api

# Terminal 2 — Frontend (port 5173, proxies /api to backend)
npm run dev:web
```

Other useful commands:

```bash
npm run build              # Production frontend build
cd frontend && npm run lint
cd backend && npm run seed:admin   # One-time admin user (requires ADMIN_* in .env)
```

Cloudinary is required for all image uploads (local disk storage is not supported).

## Deployment Instructions (Vercel)

1. Push this repository to GitHub and connect it in the [Vercel dashboard](https://vercel.com).
2. **Root directory:** repository root (contains `vercel.json`).
3. **Framework preset:** Other — build steps are defined in `vercel.json`.
4. Add all required environment variables for Production and Preview (see [DEPLOYMENT.md](DEPLOYMENT.md)).
5. Set `CLIENT_URL` to your production URL (e.g. `https://your-app.vercel.app`).
6. Configure Stripe webhook: `https://YOUR_DOMAIN/api/payments/webhook`
7. Allow MongoDB Atlas access from Vercel (e.g. `0.0.0.0/0` or Vercel IP ranges).
8. After deploy, verify `GET /api/health` returns `200`.

Architecture: static React app from `frontend/dist`, Express API via serverless function at `/api`.

## Screenshots

| Dashboard | Live scoring | Public viewer |
|-----------|--------------|---------------|
| _Add screenshot: `docs/screenshots/dashboard.png`_ | _Add screenshot: `docs/screenshots/live-scoring.png`_ | _Add screenshot: `docs/screenshots/public-viewer.png`_ |

| Points table | Admin panel | Match scorecard |
|--------------|-------------|-----------------|
| _Add screenshot: `docs/screenshots/points-table.png`_ | _Add screenshot: `docs/screenshots/admin.png`_ | _Add screenshot: `docs/screenshots/scorecard.png`_ |

## License

This project is licensed under the [Apache License 2.0](LICENSE).

## Author

**Ahmad**
