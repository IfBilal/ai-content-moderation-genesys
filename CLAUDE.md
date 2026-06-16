# AI Content Moderation Platform

Full-stack intern assignment. Build from scratch.

## Tech Stack
- **Backend:** Node.js + Express + Mongoose
- **Database:** MongoDB (containerized via Docker, data persisted via named volume)
- **Frontend:** React + Vite
- **Infrastructure:** Docker + docker-compose (single `docker-compose up` must run everything)
- **AI:** Groq API for image moderation

## Project Structure
```
backend/      Express REST API
frontend/     React + Vite web app
docker-compose.yml
README.md
```

## Domain Entities

**User** — roles: `user` | `admin`

**Submission** — one request, multiple images; each image screened independently

**Verdict** — per-image outcome: `Approved` | `Flagged for Review` | `Blocked`
- Includes per-category breakdown: classification result, confidence score, reasoning string
- Stores a snapshot of the policy config active at submission time

**Appeal** — linked to a submission with outcome Flagged or Blocked
- Status: `Pending` | `Accepted` | `Rejected`
- Admin attaches written response; acceptance overrides verdict to `Approved`

**Policy** — one document per moderation category (6 total)
- Fields: `enabled` (bool), `confidenceThreshold` (%), `enforcementBehavior`: `Auto-Block` | `Flag for Review`
- Changes are non-retroactive — only affect future submissions

## Moderation Categories (6)
1. Graphic Violence
2. Hate Symbols
3. Self-Harm
4. Extremist Propaganda
5. Weapons & Contraband
6. Harassment & Humiliation

## Verdict Logic
- Screen image against all **enabled** categories via Groq API
- If any category result meets/exceeds its confidence threshold:
  - `Auto-Block` → overall verdict = `Blocked`
  - `Flag for Review` → overall verdict = `Flagged for Review`
- If no category triggers → verdict = `Approved`
- Snapshot the active policy config into the verdict record at submission time

## User Roles & Capabilities

| Role  | Capabilities |
|-------|-------------|
| User  | Register, login, submit images, view own submission history (filter by outcome/category/date), file appeals, track appeal status |
| Admin | All user capabilities + appeals queue, manual verdict overrides, policy configuration, analytics dashboard |

## API Design
REST only — frontend must only talk to the backend via REST API, never directly to MongoDB.

Key route groups:
- `POST /auth/register`, `POST /auth/login`
- `POST /submissions`, `GET /submissions` (user's own, with filters)
- `GET /submissions/:id` (verdict + appeal status)
- `POST /submissions/:id/appeal`
- `GET /admin/appeals`, `PATCH /admin/appeals/:id`
- `GET /admin/policies`, `PATCH /admin/policies/:categoryId`
- `GET /admin/analytics`

## Architecture Constraints
- `docker-compose up` is the only required command to run the full stack from zero
- Policy changes do NOT retroactively alter existing verdicts
- Verdicts must snapshot the policy at submission time
- Frontend must reflect real system state at all times (no stale data)
- README must cover: setup instructions, required env vars, key architecture decisions

## Development Order
1. Infrastructure & Docker scaffold
2. Auth (JWT + bcrypt, role guards)
3. Policy seeding & config API
4. Submission + AI moderation + verdict logic
5. Appeal workflow
6. Admin analytics dashboard
7. README + polish
