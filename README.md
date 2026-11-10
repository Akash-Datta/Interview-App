# Interview-App
# 🎯 AI Interview Coach

An AI-powered interview preparation platform. Paste a job description, upload your resume (or describe yourself), and get a personalized interview strategy — likely technical & behavioral questions with model answers, your skill gaps, a match score, a day-by-day preparation roadmap, an AI coach to practice with, and a polished ATS-friendly resume PDF.

Built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Google Gemini** for AI generation.

---

## ✨ Features

- **🔐 Authentication** — Register/login with JWT stored in an `httpOnly` cookie (no tokens in `localStorage`).
- **📄 Interview report generation** — Upload a resume PDF (text extracted with `pdf-parse`) or write a quick self-description, paste the job description, and Gemini generates:
  - **Match score** (0–100) with a color-coded progress ring.
  - **Skill gaps** tagged by severity (low / medium / high).
  - **Technical & behavioral questions** with the interviewer's intention and a model answer for each.
  - **Preparation roadmap** — see below.
- **❓ Progressive question lists** — Each report stores more questions than it shows.
  - The Technical tab opens with **10 questions**, the Behavioral tab with **5**.
  - A **"Show more questions"** button reveals the rest in batches of 5.
  - Once everything is revealed, **"Generate more questions"** asks the AI for fresh, non-duplicate questions and saves them to the report.
- **🗺️ Preparation roadmap with duration cards** — Choose how many days you have before the interview:
  - Beautiful option cards for **5, 10, 15, 20, 25, and 30 days**.
  - A **Custom** card where you type any number of days (1–60).
  - The AI builds a paced day-by-day plan (fundamentals → skill gaps → practice → mock interviews → final revision) for exactly that duration, and it is saved with the report.
- **🤖 AI chat coach** — A chatbot that knows your report (role, match score, skill gaps, questions) and gives practical, specific coaching. Rate-limited to prevent abuse.
- **📥 Resume PDF download** — Gemini rewrites your resume for the target role and renders it to a professional one-page PDF via Puppeteer.
- **🗂️ Report history** — Every generated report is saved to MongoDB and listed on the home page.

---

## 🧠 How it works

```text
┌──────────┐   resume (PDF) / self-description    ┌────────────┐
│  React   │ ───────────────────────────────────▶ │  Express   │
│  (Vite)  │            + job description         │    API     │
└──────────┘                                      └─────┬──────┘
      ▲                                                 │
      │            structured JSON (Zod schema)         ▼
      │            ┌─────────────────────────────┐ ┌──────────┐
      └────────────│ Google Gemini (with model    │ │ MongoDB  │
                   │ fallbacks + retries)         │ │ (Atlas)  │
                   └─────────────────────────────┘ └──────────┘
```

1. The user submits a resume/self-description and a job description.
2. The backend prompts Gemini with a **response schema** (Zod → JSON Schema) so the report comes back as valid, predictable JSON. Retries and fallback models handle provider hiccups.
3. The report is normalized, question lists are topped up if the model returned fewer than the UI minimum, and everything is stored in MongoDB.
4. The interview page renders questions in batches, and on-demand endpoints (`/questions`, `/roadmap`) generate *more* questions or *re-timed* roadmaps when the user asks for them.
5. The resume PDF is generated as HTML by Gemini and printed to PDF by a headless Chromium (Puppeteer).

---

## 🛠️ Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 8, Sass/SCSS, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose 9) |
| AI | Google Gemini (`@google/genai`) with Zod 4 structured output |
| Resume PDF | Puppeteer (headless Chromium) |
| Resume parsing | `pdf-parse` |
| Auth | JWT (`jsonwebtoken`) in httpOnly cookies, `bcryptjs` |

---

## 📁 Project structure

```text
GenAiProject/
├── backend/
│   ├── server.js                     # Entry point, env validation, DB connect
│   └── src/
│       ├── app.js                    # Express app, CORS, security headers, error handler
│       ├── config/database.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── chat.controller.js
│       │   └── interview.controller.js   # Report generation, questions, roadmap, resume PDF
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   └── file.middleware.js         # Multer upload (PDF, 5MB max)
│       ├── models/
│       │   ├── interviewReport.model.js
│       │   ├── user.model.js
│       │   └── blacklist.model.js        # JWT blacklist (logout)
│       ├── routes/
│       └── services/
│           └── ai.service.js             # Gemini calls, fallbacks, Puppeteer PDF
└── frontend/
    └── src/
        ├── app.routes.jsx
        ├── style.scss                   # Global theme + keyframes
        └── features/
            ├── auth/                    # Login / Register / session context
            ├── chat/                    # AI coach chatbot
            ├── common/                  # Layout, top bar, loading screen, 404
            └── interview/              # Home (generate), Interview (report), context/hooks/api
```

---

## 🚀 Getting started

### Prerequisites

- **Node.js 20+**
- A **MongoDB** database (local or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # Windows: copy .env.example .env
# ...then edit .env with your values
npm run dev             # starts on http://localhost:3000
```

**Backend environment variables** (`backend/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Defaults to `3000` |
| `NODE_ENV` | Yes (prod) | Set to `production` when deployed |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GOOGLE_API_KEY` | Yes | Gemini API key |
| `GEMINI_MODEL` | No | Primary model (default `gemini-3.8-flash`) |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback models |
| `GEMINI_TIMEOUT_MS` | No | Request timeout (default `120000`) |
| `CLIENT_URL` | Yes (prod) | Frontend origin(s), comma-separated, for CORS + cookies |
| `PUPPETEER_EXECUTABLE_PATH` | No | Chromium path when the bundled binary is unavailable |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # Windows: copy .env.example .env
npm run dev              # starts on http://localhost:5173
```

**Frontend environment variables** (`frontend/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes (prod) | Backend base URL, e.g. `http://localhost:3000` in dev |

### 3. Use it

1. Register an account.
2. On the home page, paste a job description and upload a resume PDF **or** write a self-description.
3. Click **Generate My Interview Strategy** (takes ~30s).
4. Explore the report:
   - **Technical Questions** — opens with 10, show more in batches, generate fresh ones anytime.
   - **Behavioral Questions** — opens with 5, same controls.
   - **Road Map** — pick a 5–30 day card or enter custom days, and the AI builds the plan.
   - **Download Resume** — one-page PDF tailored to the job.
   - Chat with the **AI coach** from any page.

---

## 🔌 API reference

All routes are prefixed with `/api`. Authenticated routes require the `token` httpOnly cookie.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | – | Create an account |
| `POST` | `/api/auth/login` | – | Log in (sets cookie) |
| `POST` | `/api/auth/logout` | – | Log out (blacklists token) |
| `GET` | `/api/auth/get-me` | ✅ | Current user |
| `POST` | `/api/interview` | ✅ | Generate an interview report (`multipart/form-data`: `resume` PDF, `jobDescription`, `selfDescription`) |
| `GET` | `/api/interview` | ✅ | List all reports for the user (lightweight) |
| `GET` | `/api/interview/report/:interviewId` | ✅ | Full report |
| `POST` | `/api/interview/report/:interviewId/questions` | ✅ | Generate & store more questions — body: `{ "type": "technical" \| "behavioral", "count": 1–10 }` |
| `POST` | `/api/interview/report/:interviewId/roadmap` | ✅ | Generate & store a roadmap — body: `{ "days": 1–60 }` |
| `POST` | `/api/interview/resume/pdf/:interviewId` | ✅ | Download the tailored resume PDF |
| `POST` | `/api/chat` | ✅ | Chat with the AI coach (rate-limited) |
| `GET` | `/api/health` | – | Health check |

**Example — regenerate a 7-day roadmap:**

```bash
curl -X POST http://localhost:3000/api/interview/report/<id>/roadmap \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<your-jwt>" \
  -d '{"days": 7}'
```

---

## 🧩 Design notes

- **Question minimums are guaranteed.** The generation prompt asks for 12–15 technical and 8–10 behavioral questions, and a server-side "top-up" runs if the model returns fewer than 10/5. Older reports are topped up automatically when opened.
- **Roadmaps are re-generated, not rescaled.** Choosing a different duration asks the AI to re-pace the plan for exactly that many days; results are cached per duration in the session and the latest plan is persisted with the report (`planDays`).
- **Structured AI output.** All report generation uses Gemini's JSON mode with a Zod-derived response schema, plus markdown-fence stripping, retries on 429/5xx, and fallback models.
- **Safety.** JWTs live in httpOnly cookies, CORS is origin-allowlisted, uploads are capped at 5MB PDFs, job descriptions at 20k chars, and 5xx responses never leak internal details in production.

---

## 📜 Scripts

| Folder | Command | Description |
| --- | --- | --- |
| `backend` | `npm run dev` | Start API with watch mode |
| `backend` | `npm start` | Start API |
| `frontend` | `npm run dev` | Vite dev server |
| `frontend` | `npm run build` | Production build to `dist/` |
| `frontend` | `npm run lint` | ESLint |
| `frontend` | `npm run preview` | Preview the production build |

---

## 🚢 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full production checklist — environment variables, MongoDB Atlas setup, HTTPS/cookies/CORS, Puppeteer/Chromium notes, security hardening, and a smoke-test plan.

---

## 📄 License

MIT — free to use and adapt for your own interview prep.
