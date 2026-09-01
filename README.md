# Recovery Path — Clinic Management UI

A fully interactive React frontend for the Recovery Path physiotherapy clinic system.
All data lives in React state (in-memory, seeded with sample data) — there's no backend
in this project, so everything resets on page refresh. This is the click-through UI;
see the separate `recovery-path-fullstack` project for the real Express + SQLite backend.

## Structure

```
recovery-path-ui/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  src/
    main.jsx      entry point
    App.jsx        the entire app (components, mock data, state, all pages)
    index.css      Tailwind directives
```

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## What's inside

- Real client-side routing (`react-router-dom`): `/login`, `/dashboard`, `/doctors`,
  `/patients`, `/patients/:id`, `/appointments`, `/library`, `/reports`, `/reports/:id`,
  `/settings` — the URL updates as you navigate, the browser back/forward buttons work,
  and admin-only routes (`/doctors`, `/settings`) redirect a therapist to `/dashboard`
  instead of just hiding the nav link.
- Login (role toggle: Admin / Therapist — no real password check, it's a demo)
- Admin dashboard — clinic-wide stats, "Doctors & Their Patients" panel with expandable
  patient lists, today's appointments across all doctors
- Therapist dashboard — scoped to just that doctor's own patients/appointments
- Doctors (admin only) — list + Add Doctor
- Patients — list + search + Add Patient, click through to a full profile
- Patient Profile — Overview / Assessment / Treatment Plan / Sessions / Progress tabs;
  Add/Edit Assessment, Create/Edit Treatment Plan, and Add Session are all live forms
- Appointments — Schedule / Complete / Cancel (with confirmation)
- Exercise Library — add exercises
- Reports — generates a text report per patient
- Settings (admin only) — clinic info, toggles, role permissions table

## Notes

- Everything is one file (`src/App.jsx`) by design, since it started life as a single
  self-contained artifact. It's organized top-to-bottom: theme constants → shared UI
  components (Card, Btn, Modal, etc.) → mock data → page components → the root `App`.
  Feel free to split it into multiple files under `src/components/` and `src/pages/`
  once you're building on top of it — nothing here depends on it staying one file.
- To connect this to the real backend instead of in-memory mock data, see the
  `recovery-path-fullstack` project — it has the same pages already wired to `fetch`/`axios`
  calls against an Express API.

## Instant preview (no install required)

`preview.html` in this folder is a self-contained version of the same app — just
**double-click it to open in your browser**. No `npm install`, no terminal. It loads
React/Tailwind/Babel from a CDN (so it needs an internet connection) and transpiles the
JSX right in the browser. It's for looking at the UI quickly; for real development, use
the `npm install && npm run dev` setup above instead — that's the one that reflects
`src/App.jsx` exactly and rebuilds instantly as you edit.
