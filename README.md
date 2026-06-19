# AI Content Moderation Platform

A full-stack platform for automated image moderation. Users submit images, which are screened by an AI vision model against six configurable content-policy categories. Each image receives a structured verdict (Approved, Flagged for Review, or Blocked). Users can appeal disputed verdicts; admins manage the appeals queue, override verdicts, tune policies, and monitor platform analytics.

---

## 1. Quick Start (single command)

> Requires **Docker** and **Docker Compose**. Nothing else needs to be installed — Node, MongoDB, and all dependencies run inside containers.

```bash
# 1. Clone
git clone <repo-url>
cd ai-content-moderation-genesys

# 2. Create the backend env file from the template
cp backend/.env.example backend/.env
#    → open backend/.env and paste in your GROQ_API_KEY (see step 3)
#    → every other value already has a working default

# 3. Run everything
docker compose up --build
```

That's it — `docker compose up` builds and starts all three services (MongoDB, backend API, frontend), seeds the admin account and the six policies automatically, and waits for the database to be healthy before the backend connects.

| Service | URL |
|---------|-----|
| **Frontend (app)** | http://localhost:5173 |
| **Backend API** | http://localhost:5000 |

To stop: `Ctrl+C`, then `docker compose down`. Data persists across restarts via Docker named volumes.

---

## 2. Login Credentials

### Admin (seeded automatically on first startup)

```
Email:    admin@example.com
Password: admin123
```

These are read from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` and created on first boot. Logging in as the admin redirects to the admin dashboard (`/admin`); the account also has all regular-user capabilities.

### User

There is no seeded user — register a normal account from the **Register** page (`/register`). New accounts are always created with the `user` role; a user cannot self-promote to admin.

---

## 3. Required Environment Variables

All variables live in `backend/.env` (copied from `backend/.env.example`). In practice **the only value you must supply yourself is `GROQ_API_KEY`** — everything else ships with a working default for local Docker use.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | **Yes** | — | Vision-model API key from [console.groq.com](https://console.groq.com). Without it, image analysis will fail. |
| `MONGO_URI` | Yes | `mongodb://mongo:27017/content-moderation` | MongoDB connection string. The default targets the `mongo` service inside Docker. |
| `JWT_SECRET` | Yes | provided | Secret used to sign JWTs. Replace with your own long random string in production. |
| `ADMIN_EMAIL` | Yes | `admin@example.com` | Email for the auto-seeded admin account. |
| `ADMIN_PASSWORD` | Yes | `admin123` | Password for the auto-seeded admin account. |
| `PORT` | No | `5000` | Backend listen port. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token lifetime. |
| `GROQ_MODEL` | No | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq vision model ID. |

> `backend/.env` is gitignored so secrets are never committed. `backend/.env.example` is the committed template.

---

## 4. Key Architecture Decisions

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + Express (ES Modules) |
| Database | MongoDB 7 (containerized) + Mongoose ODM |
| AI | Groq API — Llama 4 Scout vision model |
| Frontend | React 19 + Vite |
| Charts / animation | Recharts, Framer Motion |
| Auth | JWT + bcryptjs, role-based middleware |
| Uploads | Multer (disk storage, served statically) |
| Infrastructure | Docker + Docker Compose |

### Data Model (6 collections)

```
User        — name, email, hashed password, role (user | admin)
Policy      — one per category (6 total): enabled, confidenceThreshold, enforcementBehavior
Submission  — one upload request; holds N images + overall outcome
Image       — file metadata (filename, mimetype, size) linked to a Submission
Verdict     — one per image: per-category breakdown + a frozen policy snapshot
Appeal      — one per Submission (only Flagged/Blocked eligible) + admin response
```

### Decision 1 — REST API is the sole interface to the database

The frontend never touches MongoDB directly. It talks only to the Express REST API over `/api/*` (proxied by Vite to the backend container). This keeps all validation, auth, and business logic server-side.

### Decision 2 — Per-category enforcement drives the outcome

Each policy category is independently configured by an admin with a **confidence threshold** and an **enforcement behavior**:

- A category triggers only when the AI's `detected` is true **and** its confidence ≥ that category's threshold.
- A triggered **Auto-Block** category → overall verdict **Blocked**.
- A triggered **Flag for Review** category → overall verdict **Flagged for Review**.
- If multiple categories trigger, the most severe wins (`Blocked > Flagged > Approved`).
- If nothing triggers → **Approved**.

Each image is screened independently and gets its own verdict; the submission's overall outcome is the most severe across its images.

### Decision 3 — Policy snapshots make verdicts non-retroactive

Every `Verdict` embeds a **complete copy of all six policies** as they were at submission time. Later changes to a policy (threshold, enablement, enforcement) affect only future submissions — existing verdicts are never recalculated. This is enforced at the data layer rather than by recomputation, so history is always auditable.

### Decision 4 — Appeals and overrides

- A user may file **one appeal per submission**, only for `Flagged for Review` or `Blocked` outcomes, with a written justification.
- Appeals enter an admin-only queue. Admins **Accept** or **Reject** with an optional written response; the disputed images are shown in the review modal.
- Accepting an appeal overrides the submission **and all its verdicts** to `Approved`.
- Admins can also directly override any submission's verdict from the submissions queue, independent of appeals.

### Decision 5 — Containerized, single-command startup

`docker compose up` brings up MongoDB, the backend, and the frontend together. The backend waits on a **MongoDB healthcheck** before connecting, then auto-seeds the admin user and the six policies. Two named volumes persist state:

- `mongo_data` → the database
- `uploads_data` → uploaded image files (served at `/uploads/<filename>`)

---

## 5. API Reference

```
# Auth
POST   /api/auth/register                     register a user
POST   /api/auth/login                        login → { token, user }
GET    /api/auth/me                            current user

# User submissions & appeals
POST   /api/submissions                        upload images (multipart, field: images)
GET    /api/submissions                        own history (filters: outcome, category, startDate, endDate)
GET    /api/submissions/:id                    detail: verdicts + appeal
POST   /api/submissions/:id/appeal             file an appeal (justification)
GET    /api/submissions/:id/appeal             appeal status

# Admin (require admin role)
GET    /api/admin/submissions                  submissions queue (filter: outcome)
GET    /api/admin/submissions/:id              full submission detail
PATCH  /api/admin/submissions/:id/override     override verdict outcome
GET    /api/admin/appeals                       appeals queue (filter: status)
PATCH  /api/admin/appeals/:id                   accept / reject appeal
GET    /api/admin/policies                       all 6 policy configs
PATCH  /api/admin/policies/:id                   update a policy
GET    /api/admin/analytics                      platform analytics (param: ?days=30)
```

---

## 6. Project Structure

```
ai-content-moderation-genesys/
├── docker-compose.yml          # mongo + backend + frontend, healthcheck, volumes
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .env.example            # env template (committed)
│   └── src/
│       ├── index.js            # app entry: connect DB → seed → listen
│       ├── config/             # db.js, seed.js (admin + policies)
│       ├── models/             # User, Policy, Image, Submission, Verdict, Appeal
│       ├── controllers/        # auth, submission, appeal, policy, analytics, admin
│       ├── routes/             # auth, submissions, admin
│       ├── middleware/         # JWT auth guard, multer upload
│       └── utils/moderation.js # Groq vision call + verdict logic
└── frontend/
    ├── Dockerfile
    ├── vite.config.js          # /api + /uploads proxy to backend
    └── src/
        ├── App.jsx             # routes
        ├── context/            # AuthContext (JWT + role)
        ├── lib/                # axios instance, helpers
        ├── components/         # ui/ + layout/
        └── pages/              # auth/, user/, admin/
```
