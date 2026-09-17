# 🏥 FeelEase Physio — Clinic Management System

A full-stack physiotherapy clinic management web application built with **Next.js 14** and **Supabase**. Designed for real clinic operations with role-based access for Admins and Therapists.

---

## 🚀 Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Framework   | Next.js 14 (App Router, TypeScript)  |
| Database    | Supabase (PostgreSQL)                |
| Auth        | Supabase Auth                        |
| Styling     | Tailwind CSS + Radix UI              |
| Charts      | Recharts                             |
| Icons       | Lucide React                         |
| Realtime    | Supabase Realtime (notifications)    |

---

## ✨ Features

### 🔐 Authentication & Role-Based Access
- Secure login via Supabase Auth
- Two roles: **Admin** and **Therapist**
- Therapists only see their own data (patients, appointments, reports, attendance)
- Admins have full clinic-wide access
- Sign-out confirmation dialog

### 👥 Patient Management
- Add, view, and manage patient profiles
- Medical history, diagnoses, allergies, emergency contacts
- Session history tied to completed appointments
- Pain level tracking before/after sessions

### 📅 Appointments
- Book appointments with date, time, and session type
- **Auto-missed** — appointments past their scheduled time are automatically marked as Missed
- **Reschedule** missed appointments with a new date/time
- Complete appointments and record session notes + pain levels
- Therapist is auto-detected from login (no manual selection needed)

### 📆 Calendar View
- Weekly calendar of all scheduled appointments
- Color-coded by status (Scheduled, Completed, Missed, Cancelled)

### 🗂️ Attendance
- Daily attendance logging (Present / Absent / Leave / Half Day)
- **Weekly** attendance summary with hours worked
- Admin sees all therapists; therapists only see their own logs (view-only)

### 📊 Reports
- Auto-generated session reports per patient
- Therapist feedback recorded at session completion
- Admin sees all; therapist sees only their own patients' reports

### 🔔 Notifications
- **Admin**: Full notification log + WhatsApp/SMS dispatch to patients
- **Therapist**: Personal notification inbox with real-time updates
- Appointment booked alerts auto-sent to the assigned therapist
- Unread badge on bell icon, mark-as-read support

### 🏃 Exercise Library
- Manage physiotherapy exercises with descriptions and categories

### ⚙️ Settings (Admin Only)
- Clinic info and configuration

---

## 🗂️ Project Structure

```
app/
  dashboard/
    appointments/     Appointment list, new, calendar
    attendance/       Attendance logs
    calendar/         Weekly calendar view
    exercises/        Exercise library
    notifications/    Admin dispatch + therapist inbox
    patients/         Patient list, new, profile
    reports/          Session reports
    settings/         Clinic settings
    therapists/       Therapist management (admin only)
components/
  appointments/       Appointment UI components
  attendance/         Attendance table & summary
  layout/             Sidebar, TopBar
  notifications/      Admin + Therapist notification clients
  patients/           Patient forms and profile tabs
  reports/            Report viewer
lib/
  actions/            Server actions (appointments, patients, notifications, etc.)
  supabase/           Supabase client & server helpers
supabase/
  migrations/         Database migration files
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/srushtighevariya/FeelesePhisio.git
cd FeelesePhisio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgres_connection_string
```

> ⚠️ Never commit `.env.local` to GitHub — it contains sensitive keys.

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Build for Production

```bash
npm run build
npm start
```

---

## 👤 Default Roles

| Role      | Access                                                      |
|-----------|-------------------------------------------------------------|
| Admin     | Full access — all patients, therapists, reports, settings   |
| Therapist | Scoped access — own patients, appointments, attendance only |

---

## 📋 Key Business Rules

- A therapist logged in can only see **their own** patients, appointments, and reports
- Appointments are **auto-marked as Missed** if the scheduled time has passed
- Session notes and pain levels can only be recorded when **completing** a session
- Attendance time is only shown when status is **Present** or **Half Day**
- Notifications reach therapists **in real-time** via Supabase Realtime

---

## 📦 Dependencies

- `next` — App framework
- `@supabase/supabase-js` + `@supabase/ssr` — Database & auth
- `tailwindcss` — Styling
- `@radix-ui/*` — Accessible UI primitives
- `lucide-react` — Icons
- `recharts` — Charts & analytics
- `date-fns` — Date utilities

---

## 🛡️ Security

- Server-side auth guards on all dashboard routes
- Role checked on every server action
- `.env.local` excluded from version control
- Supabase Row Level Security (RLS) enabled

---

*Built for FeelEase Physio Clinic — Client Project*
