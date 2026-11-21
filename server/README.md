# Nirolax API

Express 5 + MongoDB (native driver) + zod. Serves the shop, fittings, client sign-in (SMS code),
the client portal and the Atelier Console for the Nirolax site in `../web`.

## Run it

```bash
npm install
cp .env.example .env     # DATA_SOURCE=memory works with no database at all
npm run dev              # http://localhost:5000/api/v1/health
npm test                 # 57 end-to-end checks against the in-memory store
npm run check            # from your computer: MongoDB (seeds an empty DB), Cloudinary, SMS, email
```

The variable names are the same as Ruposhi 2 (`CLIENT_URL`, `JWT_ADMIN_SECRET`, `OTP_SECRET`,
`PAYMENT_SECRET`, `WEBHOOK_SECRET`, `CLOUDINARY_*`, `DEMO_OTP_CODE` …) — see `.env.example`.

## Accounts

- **Clients** register with name, email, mobile and password; the mobile is confirmed with a six-digit
  SMS code (always `DEMO_OTP_CODE`, 222222, in demo mode). They sign in with email **or** mobile +
  password, or with a one-time code. Forgot password = code + new password. A guest who already ordered
  or booked with that number keeps everything — the account attaches to it.
- **Staff** sign in separately (`nx_staff` cookie, `JWT_ADMIN_SECRET`) — a client session can never
  open the console. Roles: owner, manager, tailor, orders, content; every console route checks the role.
- bcrypt (cost 12) · 5 wrong passwords → 15-minute lock · changing a password, role or switching an
  account off signs out every other device · the last owner cannot be removed · CSRF origin check ·
  no `$`-operators accepted from outside · password hashes never leave the server (not even in backups).

Demo staff (DEMO_MODE only): `atelier@nirolax.com / atelier2026` (owner) · `farah@nirolax.com /
Manager@1234` · `karim@nirolax.com / Tailor@1234` · `rina@nirolax.com / Orders@1234` ·
`mitu@nirolax.com / Content@1234`. Demo client: `01700000000` (or tanvir@nirolax.demo) / `Demo@1234`.
Outside demo mode the first owner comes from `ATELIER_EMAIL` / `ATELIER_PASSWORD`.

`DATA_SOURCE=memory` starts with the same sample clients, commissions and bookings as the demo
and forgets everything on restart. Switch to `DATA_SOURCE=mongo` + `MONGODB_URI` to keep data.

## Endpoints (all under `/api/v1`)

| Area | Method & path | Who |
|---|---|---|
| Shop | `GET /health`, `GET /catalogue` (editions remaining) | anyone |
| | `POST /orders` → `{order, key, next}` — prices come from the server | anyone |
| | `GET /orders/:id?key=` — receipt link | holder of the link |
| Fittings | `GET /slots`, `POST /bookings`, `GET /bookings/:id?key=` | anyone |
| Payments | `POST /payments/demo` (demo gateway), `POST /payments/sslcommerz/return`, `/ipn` | gateway |
| Sign-in | `POST /auth/otp`, `POST /auth/otp/verify`, `POST /auth/atelier`, `POST /auth/logout`, `POST /auth/demo-client` (demo only) | anyone, rate-limited |
| Catalogue & settings | `GET /catalogue/pieces` (published season), `GET /settings` (atelier details, hours, deposit) | anyone |
| Letter & contact | `POST /newsletter`, `POST /contact` | anyone |
| Portal | `GET /me`, `POST /me/bookings/:id/cancel` | signed-in client |
| Console | `GET /console/state` (trimmed to the role) · fittings: `POST /bookings` (walk-in), `PATCH /bookings/:id` (status, move, deposit) · production: commissions + stage photos · orders: status, `/notes`, `/courier`, `/cancel` (refund, edition returned) · clients: add, edit, `DELETE` (privacy) · catalogue: `POST/PATCH/DELETE /pieces`, `/pieces/reorder`, `/uploads/sign` · editions · messages, `/outbox`, `/subscribers` · `PUT /settings` · staff CRUD · `/audit` · `/export/:kind` (Excel) · `/backup`, `/backup.xlsx`, `/restore` · `/reset` (memory demo) | staff, by role |

Order and appointment confirmations are sent by SMS (logged to the console until SMS keys are set).

Every console change is written to the audit log (who, when, before and after). Every SMS and email
goes to the outbox log (and out through the gateway once its keys are set).

Images: the browser resizes to WebP and uploads straight to Cloudinary with a signature from
`/console/uploads/sign` (the API secret never reaches the browser). Without Cloudinary keys the resized
image is kept in the database.

Sessions are httpOnly cookies — `nx_session` for clients (`CUSTOMER_SESSION_DAYS`), `nx_staff` for staff (`ADMIN_SESSION_HOURS`). The web app
calls the API through its own `/api/v1/*` rewrite, so the cookie is first-party on every browser.

Edition numbers are taken atomically (`findOneAndUpdate` with `$gt: 0`), so two buyers can never
receive the same Nº, and approving a payment twice never takes a second number.

## Deploy (MongoDB Atlas + Vercel)

1. **Atlas** — create a free M0 cluster, a database user, and allow access from anywhere
   (`0.0.0.0/0`, Vercel has no fixed IP). Copy the connection string.
2. **API on Vercel** — import this `server` folder as a project (framework: Other). Set the
   environment variables from `.env.example`: `NODE_ENV=production`, `DATA_SOURCE=mongo`, `MONGODB_URI`,
   `MONGODB_DB=nirolax`, the five secrets (`JWT_SECRET`, `JWT_ADMIN_SECRET`, `OTP_SECRET`, `PAYMENT_SECRET`,
   `WEBHOOK_SECRET`), `CLIENT_URL=https://<your-site>`, `API_URL=https://<your-api>`,
   `CORS_ORIGINS=https://<your-site>`, the `CLOUDINARY_*` keys, `DEMO_MODE`, `DEMO_OTP_CODE`.
   `api/index.ts` + `vercel.json` route every request to the Express app. Set the Function Region near
   the Atlas cluster (Mumbai → `bom1`).
3. **Site on Vercel** — import `../web`, set `API_URL=https://<your-api>` and `NEXT_PUBLIC_SITE_URL=https://<your-site>`, deploy.
4. Check `https://<your-site>/api/v1/health`.

For the real launch: `DEMO_MODE=false`, a strong `ATELIER_PASSWORD`, SMS gateway keys, and
`PAYMENT_PROVIDER=sslcommerz` with the store ID/password (`SSLCZ_SANDBOX=false` when live).
The first start seeds the edition counters; in demo mode it also seeds the sample data once.
