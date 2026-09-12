# JET MOTORS

Responsive, mobile-first web app for JET MOTORS — classic premium automotive design.

This is a **browser web app / PWA**. No APK is required.

## Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Lucide
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Argon2
- Deploy: Vercel (frontend) + Node host / Vercel (API) + MongoDB Atlas

## Local setup

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) or use MongoDB Atlas.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` / `JWT_SECRET`.
3. Install and run:

```bash
cd backend
npm install
npm run dev

cd ../frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:5000

## Production environment variables

The frontend reads `VITE_API_URL` (see `frontend/.env.example`). The backend
reads `CLIENT_ORIGIN` for CORS (see `backend/.env.example` and `render.yaml`).
For a Vercel-frontend + Render-backend deployment, configure:

| Platform | Variable | Value |
| -------- | -------- | ----- |
| Vercel | `VITE_API_URL` | `https://YOUR-RENDER-BACKEND-URL/api` |
| Render | `CLIENT_ORIGIN` | `https://YOUR-VERCEL-FRONTEND-DOMAIN` |

If `VITE_API_URL` is left empty in production, the app calls `/api` on the
Vercel domain itself, which does not serve the API and returns "Route not found".

Default admin (from `.env`):

- Mobile: `9999999999`
- Password: `ChangeMeAdmin!234`

## Security notes

- Passwords are hashed with Argon2id. They are never stored or returned in plaintext.
- Product prices are read from the database. The API does not trust amounts from the client when a product is selected.
- Deposits credit balance and activate products only after **server-side** confirmation.
- Withdrawals debit balance atomically and stay pending until an admin reviews them.
- Referral commissions (22% / 2% / 1%) are calculated on the server.

## Compliance

Before using real money, verify applicable laws, payment-provider rules, tax, and consumer-protection requirements for the target market. Plan figures are product features, not guaranteed investment returns.

Payment in this codebase is a **sandbox confirmation** so you can wire a licensed gateway later without changing the ledger rules.
