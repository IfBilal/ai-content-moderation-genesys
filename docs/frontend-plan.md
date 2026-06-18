# Frontend Implementation Plan
## AI Content Moderation Platform

---

## 1. Design System

### Identity
- **Vibe:** Advanced intelligence terminal — weighty, precise, futuristic
- **Theme:** Pure dark only. No light mode.

### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#000000` | Page background |
| `bg-surface` | `#050505` | Cards, panels |
| `bg-glass` | `rgba(5,5,5,0.6)` | Glassmorphism nav/modals |
| `text-primary` | `#FFFFFF` | Headlines, key data |
| `text-secondary` | `#A1A1AA` | Labels, descriptions |
| `text-muted` | `#52525B` | Placeholders, disabled |
| `accent` | `#3B82F6` | CTAs, active states, links |
| `accent-glow` | `rgba(59,130,246,0.4)` | Glow effects |
| `border-subtle` | `rgba(255,255,255,0.1)` | Card borders, dividers |
| `border-focus` | `rgba(255,255,255,0.25)` | Hover/focus borders |
| `success` | `#22C55E` | Approved badge |
| `warning` | `#F59E0B` | Flagged badge |
| `danger` | `#EF4444` | Blocked badge |
| `pending` | `#6366F1` | Pending badge |

### Typography — Inter Font
| Role | Size | Weight | Tracking |
|---|---|---|---|
| Page title | `text-4xl` | 700 | `-0.04em` |
| Section heading | `text-2xl` | 600 | `-0.03em` |
| Card heading | `text-lg` | 600 | `-0.02em` |
| Body | `text-sm` | 400 | `-0.01em` |
| Label/tag | `text-xs` | 500 | `0.05em uppercase` |

### Border Radius
- Cards: `16px` (`rounded-2xl`)
- Buttons: `8px` (`rounded-lg`)
- Inputs: `8px` (`rounded-lg`)
- Pills/Badges: `9999px` (`rounded-full`)

### Shadows
- Card hover: `0 20px 40px -20px rgba(0,0,0,0.8)`
- Accent glow: `0 0 40px -10px rgba(59,130,246,0.4)`

---

## 2. Tech Stack

| Tool | Purpose |
|---|---|
| React + Vite | Framework (already set up) |
| Tailwind CSS v3 | Styling |
| Framer Motion | Animations |
| React Router v6 | Client-side routing |
| Axios | API calls |
| Recharts | Analytics charts |
| Lucide React | Icons |
| React Hot Toast | Notifications |
| clsx + tailwind-merge | Conditional class utility |

---

## 3. Animation System (Framer Motion)

### Physics Profile
```js
spring: { stiffness: 100, damping: 20, mass: 1.2 }
```

### Standard Variants
```js
// Page entry
fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
}

// Stagger children (0.1s delay between items)
containerVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
}

// Card hover
cardHover = { y: -4, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.8)' }
```

### Where Animations Are Used
- Page load: fade-up on all headings and cards
- Sidebar nav items: stagger in on mount
- Cards: hover lift + border glow
- Modals: scale in from 0.95 → 1 + fade
- Tables: rows stagger in
- Form errors: shake + fade in
- Badge: scale pop on mount

---

## 4. Folder Structure

```
frontend/src/
│
├── lib/
│   ├── api.js              # Axios instance with JWT interceptor
│   └── utils.js            # cn() utility (clsx + tailwind-merge)
│
├── context/
│   └── AuthContext.jsx     # User state, login, logout, role
│
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx        # Outcome badges (Approved/Flagged/Blocked)
│   │   ├── Card.jsx
│   │   ├── Spinner.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   └── PageHeader.jsx
│   │
│   └── layout/
│       ├── ProtectedRoute.jsx   # Redirects if not authed or wrong role
│       ├── AuthLayout.jsx       # Centered layout for login/register
│       ├── AppLayout.jsx        # User sidebar + topbar
│       └── AdminLayout.jsx      # Admin sidebar + topbar
│
└── pages/
    ├── auth/
    │   ├── LoginPage.jsx
    │   └── RegisterPage.jsx
    │
    ├── user/
    │   ├── DashboardPage.jsx         # Image upload + recent submissions
    │   ├── SubmissionsPage.jsx       # Full history with filters
    │   └── SubmissionDetailPage.jsx  # Verdict breakdown + appeal
    │
    └── admin/
        ├── AnalyticsPage.jsx             # Charts + stats
        ├── AdminSubmissionsPage.jsx      # Flagged queue
        ├── AdminSubmissionDetailPage.jsx # Detail + override
        ├── AppealsPage.jsx               # Appeals queue + review
        └── PoliciesPage.jsx              # 6 category config cards
```

---

## 5. Routing Structure

```
/login                          → LoginPage (public)
/register                       → RegisterPage (public)

/dashboard                      → DashboardPage (user + admin)
/submissions                    → SubmissionsPage (user + admin)
/submissions/:id                → SubmissionDetailPage (user + admin)

/admin                          → AnalyticsPage (admin only)
/admin/submissions              → AdminSubmissionsPage (admin only)
/admin/submissions/:id          → AdminSubmissionDetailPage (admin only)
/admin/appeals                  → AppealsPage (admin only)
/admin/policies                 → PoliciesPage (admin only)
```

**Route guards:**
- Unauthenticated → redirect to `/login`
- Authenticated user hitting `/admin/*` → redirect to `/dashboard`
- Authenticated admin hitting user pages → allowed (admins have all user capabilities)

---

## 6. Auth System

### AuthContext provides:
```js
{
  user,           // { _id, name, email, role }
  token,          // JWT string
  login(data),    // saves to state + localStorage
  logout(),       // clears state + localStorage + redirects
  isAdmin,        // boolean shorthand
  loading         // true while checking localStorage on mount
}
```

### Axios Instance (`lib/api.js`)
- `baseURL: /api` (proxied via Vite to backend port 5000)
- Request interceptor: attaches `Authorization: Bearer <token>`
- Response interceptor: on 401 → auto logout + redirect to `/login`

### Vite Proxy (`vite.config.js`)
```js
server: {
  proxy: {
    '/api': 'http://localhost:5000',
    '/uploads': 'http://localhost:5000'
  }
}
```

---

## 7. Page-by-Page Spec

---

### 7.1 LoginPage `/login`

**Layout:** Centered card on full-screen dark background with animated gradient mesh behind it.

**Elements:**
- Logo / brand name at top center
- "Sign in to your account" heading
- Email input
- Password input
- "Sign In" button (full width, accent blue)
- Link to `/register`
- On success → redirect based on role (`/dashboard` for user, `/admin` for admin)

**Animations:**
- Background: slowly animated radial gradient (CSS keyframes, blue glow drifting)
- Card: fade-up on mount
- Inputs + button: stagger in after card

---

### 7.2 RegisterPage `/register`

**Layout:** Same as login.

**Elements:**
- Name, email, password inputs
- "Create Account" button
- Link to `/login`
- Always creates `role: user` (no role selection)

---

### 7.3 AppLayout (User Sidebar)

**Sidebar (left, fixed, 240px wide):**
- Top: Logo + brand name
- Nav items with Lucide icons:
  - Dashboard (`LayoutDashboard`)
  - My Submissions (`FileText`)
- Bottom: User name + email + Logout button

**Topbar:**
- Page title (dynamic)
- User role badge

**Sidebar design:**
- `bg-[#050505]` with `border-r border-white/10`
- Active nav item: `bg-white/5` + left accent bar in blue
- Hover: `bg-white/5` transition

---

### 7.4 AdminLayout (Admin Sidebar)

Same structure as AppLayout but with admin nav items:
- Analytics (`BarChart2`)
- Submissions Queue (`AlertTriangle`)
- Appeals (`Scale`)
- Policies (`Settings`)
- Divider
- My Submissions (`FileText`)

---

### 7.5 DashboardPage `/dashboard`

**Top section — Image Upload:**
- Large drag-and-drop zone:
  - Dashed border (`border-white/20`), hover → `border-blue-500`
  - Icon + "Drop images here or click to upload"
  - Supports multiple images (up to 10)
  - Shows file previews with name + size after selection
  - "Analyze Images" button
  - Loading state: spinner + "Analyzing with AI..."
- On success: toast notification + result summary card appears below

**Result Summary (after submission):**
- Overall outcome badge (large)
- Per-image accordion:
  - Image name
  - Outcome badge
  - Category breakdown table (category, detected, confidence bar, reasoning)

**Bottom section — Recent Submissions (last 5):**
- Table: Date | Images | Outcome | Appeal Status | View button

---

### 7.6 SubmissionsPage `/submissions`

**Filter bar (top):**
- Outcome dropdown: All / Approved / Flagged / Blocked
- Category dropdown: All / 6 categories
- Date range: Start date + End date pickers
- "Apply Filters" button + "Clear" link

**Submissions table:**
| Column | Content |
|---|---|
| Date | Formatted timestamp |
| Images | Count |
| Outcome | Colored badge |
| Categories Triggered | Pill tags |
| Appeal Status | Badge or "—" |
| Actions | "View" button |

- Pagination at bottom
- Empty state: icon + "No submissions found"

---

### 7.7 SubmissionDetailPage `/submissions/:id`

**Header:**
- Back button
- Submission ID (truncated)
- Overall outcome badge (large)
- Submitted date

**Per-image cards (one per image):**
- Image filename + size
- Outcome badge
- Category breakdown table:
  - Category name
  - Detected: Yes/No
  - Confidence: progress bar (color coded: green < threshold, red > threshold)
  - Triggered: checkmark or dash
  - Reasoning: italic text

**Policy snapshot section (collapsed by default):**
- "View Policy Config at Time of Submission" toggle
- Table of all 6 categories with their settings at submission time

**Appeal section (bottom):**
- If `Approved`: grey box "This submission was approved. No appeal needed."
- If `Flagged/Blocked` + no appeal: Form with textarea "Write your justification" + "Submit Appeal" button
- If appeal exists: status card showing:
  - Status badge (Pending/Accepted/Rejected)
  - Justification text
  - Admin response (if any)
  - Reviewed by + date (if reviewed)

---

### 7.8 AnalyticsPage `/admin` (Admin)

**Stats row (4 cards):**
- Total Submissions
- Flagged Count
- Blocked Count
- Appeal Resolution Rate %

**Charts (Bento grid layout):**
- **Submission Volume** (line chart, full width) — submissions per day over selected period
- **Verdict Distribution** (pie/donut chart) — Approved vs Flagged vs Blocked
- **Category Breakdown** (horizontal bar chart) — which categories trigger most
- **Appeal Stats** (stat cards) — total, pending, accepted, rejected

**User Rankings (two tables side by side):**
- Top users by submission count
- Top users by violation count

**Time window selector:** 7 days / 30 days / 90 days (tabs at top)

---

### 7.9 AdminSubmissionsPage `/admin/submissions`

**Filter bar:**
- Outcome filter: Flagged for Review (default) / Blocked / Approved / All

**Table:**
| Column | Content |
|---|---|
| Date | Timestamp |
| User | Name + email |
| Images | Count |
| Outcome | Badge |
| Categories | Pill tags |
| Actions | "Review" button |

- Pagination

---

### 7.10 AdminSubmissionDetailPage `/admin/submissions/:id`

Same as user SubmissionDetailPage but with:

**Admin override panel (top right):**
- Current outcome badge
- "Override Verdict" button → opens modal:
  - Dropdown: Approved / Flagged for Review / Blocked
  - "Confirm Override" button
  - Warning: "This will update both the submission and all image verdicts."

**Appeal section (if appeal exists):**
- Full appeal details (justification, status, user)
- If Pending: inline review form:
  - Status toggle: Accept / Reject
  - Optional admin response textarea
  - "Submit Review" button

---

### 7.11 AppealsPage `/admin/appeals`

**Filter tabs:** Pending | Accepted | Rejected | All

**Appeal cards (not table — more visual):**
Each card shows:
- User name + email
- Submission outcome badge
- Categories triggered
- Justification excerpt (truncated)
- Submitted date
- Status badge
- "Review" button → opens review modal inline

**Review Modal:**
- Full justification
- Accept / Reject toggle buttons
- Optional admin response textarea
- "Submit Review" button

---

### 7.12 PoliciesPage `/admin/policies`

**Layout:** 6 cards in a 2×3 grid (or 3×2)

Each policy card:
- Category name (bold heading)
- Category description (muted text)
- **Toggle:** Enabled / Disabled (custom styled switch)
- **Confidence Threshold:** Slider (0–100) + number display ("75%")
- **Enforcement:** Segmented control — "Flag for Review" | "Auto-Block"
- "Save" button (per card, shows spinner while saving)
- Last updated timestamp (muted, bottom)

Visual states:
- Disabled category: card dims to 50% opacity
- Auto-Block: enforcement label turns red
- Flag for Review: enforcement label turns yellow

---

## 8. Reusable UI Components

### Badge
```
Approved    → green bg + text (bg-green-500/10 text-green-400)
Flagged     → yellow (bg-yellow-500/10 text-yellow-400)
Blocked     → red (bg-red-500/10 text-red-400)
Pending     → indigo (bg-indigo-500/10 text-indigo-400)
Accepted    → green
Rejected    → red
```

### Button variants
- `primary` — blue bg, white text
- `secondary` — white/10 bg, white text
- `danger` — red bg
- `ghost` — transparent, hover bg-white/5
- All with loading spinner state

### Card
- `bg-[#050505] border border-white/10 rounded-2xl`
- Hover: `border-white/20` transition + slight lift (Framer Motion)

### Input
- `bg-white/5 border border-white/10 rounded-lg text-white`
- Focus: `border-white/25 ring-1 ring-blue-500/30`
- Placeholder: `text-zinc-500`

### Modal
- Backdrop: `bg-black/80 backdrop-blur-sm`
- Panel: `bg-[#0a0a0a] border border-white/10 rounded-2xl`
- Framer Motion: scale 0.95→1 + fade on open

### Spinner
- Animated ring in accent blue

### PageHeader
- Title (large, tight tracking)
- Optional subtitle (muted)
- Optional right-side action button slot

---

## 9. Build Order

1. **Setup** — Tailwind config, global CSS, Inter font, Vite proxy, `lib/api.js`, `lib/utils.js`
2. **Auth** — AuthContext, ProtectedRoute, LoginPage, RegisterPage
3. **Layouts** — AuthLayout, AppLayout, AdminLayout
4. **UI Components** — Button, Input, Badge, Card, Spinner, Modal, PageHeader, Table
5. **User Pages** — DashboardPage, SubmissionsPage, SubmissionDetailPage
6. **Admin Pages** — AnalyticsPage, AdminSubmissionsPage, AdminSubmissionDetailPage, AppealsPage, PoliciesPage
7. **Polish** — Loading states, empty states, error states, toast notifications, responsive tweaks

---

## 10. API Integration Map

| Page | API Calls |
|---|---|
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Dashboard | `POST /api/submissions`, `GET /api/submissions?limit=5` |
| Submissions | `GET /api/submissions?outcome=&category=&startDate=&endDate=&page=` |
| Submission Detail | `GET /api/submissions/:id`, `POST /api/submissions/:id/appeal`, `GET /api/submissions/:id/appeal` |
| Analytics | `GET /api/admin/analytics?days=` |
| Admin Submissions | `GET /api/admin/submissions?outcome=&page=` |
| Admin Sub Detail | `GET /api/admin/submissions/:id`, `PATCH /api/admin/submissions/:id/override` |
| Appeals | `GET /api/admin/appeals?status=&page=`, `PATCH /api/admin/appeals/:id` |
| Policies | `GET /api/admin/policies`, `PATCH /api/admin/policies/:id` |
