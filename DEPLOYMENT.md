# Deployment Checklist

This project has two parts:

- `frontend/` — React + Vite SPA
- `backend/` — Express API, MongoDB, Gemini, and Puppeteer

The safest production setup is to deploy them as two services (or one service + a CDN) behind HTTPS.

---

## 1. Before you deploy

- [ ] Run `npm run build` in `frontend/` and confirm it succeeds.
- [ ] Run `npm run lint` in `frontend/` and fix all errors.
- [ ] Test the full flow locally with `NODE_ENV=production`:
  - register → login → generate report → open report → download resume PDF → chat.
- [ ] Remove any temporary `console.log` calls or debug-only UI.
- [ ] Confirm `.env` files are **not** committed. Only `.env.example` belongs in git.
- [ ] Rotate any API key or database password that has ever been pasted into chat, code, or a screenshot.

---

## 2. Environment variables

### Backend (`backend/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Defaults to `3000`. Most hosts set this automatically. |
| `NODE_ENV` | Yes | Must be `production`. Enables secure cookies and `trust proxy`. |
| `MONGO_URI` | Yes | MongoDB Atlas connection string. Use a dedicated DB user. |
| `JWT_SECRET` | Yes | At least 32 random bytes. Never reuse the development secret. |
| `GOOGLE_API_KEY` | Yes | Restrict the key to the Gemini API in Google Cloud. |
| `GEMINI_MODEL` | No | Primary model. |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback models. |
| `GEMINI_TIMEOUT_MS` | No | Defaults to `120000`. |
| `CLIENT_URL` | Yes | Exact frontend origin, e.g. `https://app.example.com`. Comma-separate multiple origins. |
| `PUPPETEER_EXECUTABLE_PATH` | No | Only needed on Linux/Docker if bundled Chromium is unavailable. |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://your-api.example.com
```

Vite embeds `VITE_*` values into the built JavaScript. Never put secrets in a `VITE_*` variable.

---

## 3. Database (MongoDB Atlas)

- [ ] Create a dedicated database user with **readWrite** access to only this database.
- [ ] Do **not** allow `0.0.0.0/0` in the Atlas IP allowlist if your host has static egress IPs. Use those IPs.
- [ ] Enable Atlas backups (or a scheduled `mongodump`) before launch.
- [ ] Add indexes used by the app:
  - `users.email` (unique)
  - `users.username` (unique)
  - `interviewreports.user` + `interviewreports.createdAt`
  - The blacklist TTL index is already defined in the model.
- [ ] Test restoring a backup at least once.
- [ ] Decide on a data-retention policy. Resumes and job descriptions are personal data.

Example index for report listing:

```js
// Run once in mongosh against the production database.
db.interviewreports.createIndex({ user: 1, createdAt: -1 })
```

---

## 4. HTTPS, cookies, and CORS

This app uses an **httpOnly cookie** for auth, so these settings are critical:

- [ ] Serve both frontend and API over HTTPS. Never ship auth cookies over plain HTTP.
- [ ] Set `NODE_ENV=production` so the cookie uses `SameSite=None; Secure`.
- [ ] Set `CLIENT_URL` to the exact deployed frontend origin. A trailing slash or `http` vs `https` mismatch will break CORS/cookies.
- [ ] Keep `app.set("trust proxy", 1)` enabled when behind a reverse proxy (Render, Railway, Fly, Nginx, etc.).
- [ ] Verify the login response contains:

```text
Set-Cookie: token=...; HttpOnly; Secure; SameSite=None; Path=/
```

- [ ] If the frontend and API share the same domain (for example `app.example.com` and `api.example.com` under one parent domain), you may switch to `SameSite=Lax` for stricter CSRF protection. If they are on completely different sites, keep `SameSite=None; Secure`.

---

## 5. Security hardening

- [ ] Add `helmet` (or equivalent) for a stricter Content-Security-Policy, HSTS, and other headers. Basic headers are already set in `backend/src/app.js`.
- [ ] Add rate limiting to `/api/auth/*` (login/register) and `/api/chat` to prevent brute force and AI-cost abuse. The chat controller has a small in-memory throttle, but use Redis or a shared store for multi-instance deployments.
- [ ] Validate and cap request sizes. `express.json({ limit: "1mb" })` and the 5MB multer limit are already in place.
- [ ] Keep `httpOnly` cookies. Do not move the JWT into `localStorage`.
- [ ] Use a strong, unique `JWT_SECRET`; rotate it if leaked.
- [ ] Keep dependencies patched:

```bash
npm audit
npm audit fix
```

- [ ] Add a CORS test from an unlisted origin and confirm it is rejected.
- [ ] Add a global error handler test that confirms 5xx responses do not leak stack traces in production.
- [ ] Consider CSRF protection if you switch cookies to `SameSite=Lax` and expose state-changing GET routes (the app currently uses POST for mutations).

---

## 6. AI provider safety and cost control

- [ ] Restrict the Google API key to the Gemini API and, if possible, to your server's IPs.
- [ ] Set billing alerts and quotas in Google Cloud.
- [ ] Keep timeouts and fallback models configured.
- [ ] Cap chat history and message length (already done in `chat.controller.js`).
- [ ] Log AI failures without logging full resumes or job descriptions.
- [ ] Add a per-user daily message quota if the app is public.
- [ ] Test what happens when the AI provider returns 429/503: the UI should show a friendly error, not a crash.

---

## 7. Puppeteer / resume PDF generation

Puppeteer is the heaviest runtime dependency. It needs a Chromium binary and enough memory.

- [ ] On Render/Railway/Fly, use a Docker image or buildpack that includes Chromium.
- [ ] If Chromium is not bundled, set `PUPPETEER_EXECUTABLE_PATH`.
- [ ] Give the service at least **512MB–1GB RAM**. PDF rendering can spike memory.
- [ ] Keep the launch flags already used: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`.
- [ ] Add a timeout and a concurrency limit around PDF generation so one request cannot exhaust the process.
- [ ] Consider moving PDF generation to a background job/queue if traffic grows.

Docker example for the backend:

```dockerfile
FROM node:22-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 8. Frontend deployment

- [ ] Build with the production API URL:

```bash
cd frontend
npm ci
npm run build
```

- [ ] Deploy the generated `frontend/dist/` folder to a static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, Nginx).
- [ ] Configure SPA fallback so every unknown path serves `index.html` (React Router handles `/interview/:id`).
  - Netlify: add `_redirects` with `/* /index.html 200`
  - Vercel: use a rewrite to `/index.html`
  - Nginx: `try_files $uri $uri/ /index.html;`
- [ ] Enable gzip/Brotli compression and long-lived caching for hashed assets.
- [ ] Set the same `VITE_API_URL` used during the build. Rebuild after changing it.
- [ ] Confirm the site works on a real phone, not only in responsive devtools:
  - upload a PDF
  - open the chat
  - switch report tabs
  - download a resume
- [ ] Add an error boundary and a friendly offline/error page if the API is unreachable.

---

## 9. Observability and operations

- [ ] Add structured request logging (method, path, status, duration, user id — never passwords or tokens).
- [ ] Send errors to a service such as Sentry.
- [ ] Monitor:
  - API latency and 5xx rate
  - AI provider 429/5xx rate
  - MongoDB connection count and slow queries
  - PDF generation duration and failures
  - memory/CPU usage
- [ ] Add uptime checks against `GET /api/health`.
- [ ] Set up alerts for repeated 5xx responses and high memory usage.
- [ ] Keep a runbook: how to roll back, rotate keys, restore the database, and disable AI features.

---

## 10. CI/CD and release process

- [ ] Run lint + build on every pull request.
- [ ] Run backend syntax checks or tests before deploy:

```bash
node --check backend/server.js
node --check backend/src/app.js
```

- [ ] Deploy the frontend and backend atomically enough that the API contract never breaks.
- [ ] Use preview deployments for UI changes.
- [ ] Tag releases so you can roll back.
- [ ] Keep the previous frontend build and backend image available for instant rollback.
- [ ] Run a post-deploy smoke test:

```text
1. Open the site over HTTPS.
2. Register a new account.
3. Log out and log back in.
4. Generate a report with a PDF.
5. Open the report and expand a question.
6. Download the resume PDF.
7. Send a chat message.
8. Check the browser console for errors.
9. Check the API logs for 4xx/5xx spikes.
```

---

## 11. Privacy and legal

- [ ] Publish a Privacy Policy and Terms of Service. The footer currently links to placeholders (`#`).
- [ ] Explain that resumes and job descriptions are sent to a third-party AI provider.
- [ ] Support account and data deletion.
- [ ] Avoid logging resume text, job descriptions, or chat contents.
- [ ] Encrypt data at rest (Atlas does this by default) and in transit (HTTPS).
- [ ] If you serve EU/UK users, review GDPR requirements for lawful basis, retention, and data subject requests.

---

## 12. Quick pre-launch smoke test

- [ ] `NODE_ENV=production` is set.
- [ ] `CLIENT_URL` matches the deployed frontend exactly.
- [ ] `MONGO_URI` uses a production database user.
- [ ] `JWT_SECRET` is long and random.
- [ ] `GOOGLE_API_KEY` is restricted and has billing alerts.
- [ ] HTTPS works and the auth cookie is `Secure`.
- [ ] CORS rejects unlisted origins.
- [ ] PDF upload rejects non-PDF and files over 5MB.
- [ ] Chat works and rate limiting returns 429 under rapid requests.
- [ ] The app is usable on a 375px-wide phone.
- [ ] Backups and rollback steps are documented.
