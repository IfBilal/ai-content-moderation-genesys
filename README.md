# AI Content Moderation Platform

A full-stack platform for automated image moderation. Users submit images, which are screened by an AI model against configurable content policies. Admins manage the review queue, configure policies, and monitor analytics.

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-content-moderation-genesys

# 2. Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and fill in JWT_SECRET and GROQ_API_KEY (see below)

# 3. Start everything
docker-compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000  
- Default admin login: `admin@example.com` / `admin123` (set in `.env`)

---

## Environment Variables

All variables live in `backend/.env`. Copy from `backend/.env.example` and fill in the secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string. Use `mongodb://mongo:27017/content-moderation` when running via Docker |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens — use a long random string |
| `JWT_EXPIRES_IN` | No | Token expiry (default `7d`) |
| `ADMIN_EMAIL` | Yes | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Yes | Password for the seeded admin account |
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | No | Groq vision model ID (default `meta-llama/llama-4-scout-17b-16e-instruct`) |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express, ES Modules |
| Database | MongoDB 7 (Docker), Mongoose ODM |
| AI | Groq API (vision model) |
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | JWT + bcryptjs |
| File uploads | Multer (disk storage) |
| Infrastructure | Docker + Docker Compose |

### Data Model

```
User          — role: user | admin
Policy        — one document per category (6 total), configures AI thresholds
Submission    — one per upload request, holds N images
Image         — file metadata, linked to a Submission
Verdict       — one per image, stores AI result + policy snapshot
Appeal        — one per Submission (only Flagged/Blocked eligible)
```

### Moderation Flow

1. User uploads images via `POST /api/submissions` (multipart/form-data)
2. Each image is read from disk, base64-encoded, and sent to the Groq vision API
3. The API scores the image against all 6 enabled categories
4. If a category score meets its configured confidence threshold:
   - `Auto-Block` enforcement → overall verdict = **Blocked**
   - `Flag for Review` enforcement → overall verdict = **Flagged for Review**
5. If no category triggers → verdict = **Approved**
6. The full policy config active at submission time is **snapshotted into each Verdict** — policy changes never retroactively alter existing verdicts

### Policy Snapshot (Non-Retroactivity)

Every `Verdict` document embeds a complete copy of all 6 policies at the moment of submission. Changing a policy threshold or toggling a category only affects future submissions. This is enforced at the data layer — there is no retroactive recalculation.

### Appeal Workflow

- Users can file one appeal per submission if the outcome is `Flagged for Review` or `Blocked`
- Admins review appeals in the Appeals Queue: Accept or Reject with an optional written response
- On **Accepted**: the Submission `overallOutcome` and all related `Verdict` documents are overridden to `Approved`

### Role Separation

- **User**: register, login, submit images, view own submission history (filter by outcome/category/date), file and track appeals
- **Admin**: everything above + appeals queue, manual verdict overrides, policy configuration, analytics dashboard
- A single admin account is seeded at startup from env vars. Regular users cannot self-promote to admin.

### API Route Groups

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/submissions              — upload images (multipart/form-data, field: images)
GET    /api/submissions              — user's own submissions (filters: outcome, category, dateFrom, dateTo)
GET    /api/submissions/:id          — submission detail with verdicts and appeal
POST   /api/submissions/:id/appeal   — file an appeal
GET    /api/submissions/:id/appeal   — get appeal status

GET    /api/admin/submissions        — all submissions queue (filter: outcome)
GET    /api/admin/submissions/:id    — full submission detail
PATCH  /api/admin/submissions/:id/override — manually override verdict outcome

GET    /api/admin/appeals            — appeals queue (filter: status)
PATCH  /api/admin/appeals/:id        — accept or reject an appeal

GET    /api/admin/policies           — all 6 policy configs
PATCH  /api/admin/policies/:id       — update a policy

GET    /api/admin/analytics          — aggregated stats (param: ?days=30)
```

### File Storage

Uploaded images are stored on disk in the `uploads/` directory inside the backend container, persisted via the `uploads_data` Docker named volume. Files are served statically at `/uploads/<filename>`. The `mongo_data` volume persists the MongoDB database across container restarts.

---

## Project Structure

```
ai-content-moderation-genesys/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .env                  ← fill this in (not committed)
│   ├── .env.example          ← template
│   └── src/
│       ├── index.js          ← app entry, DB connect, seed, listen
│       ├── config/
│       │   ├── db.js         ← mongoose connect
│       │   └── seed.js       ← admin + policy seeding
│       ├── models/           ← User, Policy, Image, Submission, Verdict, Appeal
│       ├── controllers/      ← auth, submission, appeal, policy, analytics, admin
│       ├── routes/           ← auth, submissions, admin
│       ├── middleware/        ← JWT auth guard, multer upload
│       └── utils/
│           └── moderation.js ← Groq API call + verdict logic
└── frontend/
    ├── Dockerfile
    ├── vite.config.js        ← Tailwind v4 plugin, /api proxy
    └── src/
        ├── App.jsx           ← routes
        ├── context/          ← AuthContext (JWT + role)
        ├── lib/              ← axios instance, utility functions
        ├── components/
        │   ├── ui/           ← Button, Card, Badge, Modal, Input, Spinner, PageHeader
        │   └── layout/       ← AppLayout, AdminLayout, AuthLayout, ProtectedRoute
        └── pages/
            ├── auth/         ← Login, Register
            ├── user/         ← Dashboard, Submissions, SubmissionDetail
            └── admin/        ← Analytics, Submissions, SubmissionDetail, Appeals, Policies
```
