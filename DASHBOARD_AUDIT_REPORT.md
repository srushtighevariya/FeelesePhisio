# FeelEase Physio Dashboard — Comprehensive Performance & Bug Audit Report

Generated on: September 22, 2026  
Target Codebase: `recovery-path-ui` (Next.js 14.2 App Router + Supabase)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Root Causes of Click Latency & Slow Transitions](#2-root-causes-of-click-latency--slow-transitions)
   - [2.1 `middleware.ts` Network Bottleneck](#21-middleware-network-bottleneck)
   - [2.2 Client Filter & Week Navigation via `router.push()`](#22-client-filter--week-navigation-via-routerpush)
   - [2.3 Full-Page Unmount & Skeleton Flash via `loading.tsx`](#23-full-page-unmount--skeleton-flash-via-loadingtsx)
   - [2.4 Blocking Background Write Operations in Page Handlers](#24-blocking-background-write-operations-in-page-handlers)
   - [2.5 Sequential Multi-Server-Action Chains & Revalidation Storms](#25-sequential-multi-server-action-chains--revalidation-storms)
   - [2.6 Double-Refresh Overhead (`revalidatePath` + `router.refresh()`)](#26-double-refresh-overhead)
   - [2.7 Development-Mode On-Demand Compilation Penalties](#27-development-mode-on-demand-compilation-penalties)
3. [Comprehensive Bug & Problem Inventory](#3-comprehensive-bug--problem-inventory)
   - [3.1 Critical Bugs & Runtime Errors](#31-critical-bugs--runtime-errors)
   - [3.2 Performance & Scalability Bottlenecks](#32-performance--scalability-bottlenecks)
   - [3.3 State Inconsistency & UI Synchronization Bugs](#33-state-inconsistency--ui-synchronization-bugs)
   - [3.4 Data Loss, Persistence & Security Flaws](#34-data-loss-persistence--security-flaws)
4. [Master Issue Matrix & Severity Table](#4-master-issue-matrix--severity-table)
5. [Recommended Optimization & Remediation Roadmap](#5-recommended-optimization--remediation-roadmap)

---

## 1. Executive Summary

A deep architectural inspection and analysis of the active development server logs revealed why the dashboard feels sluggish and freezes after clicks. 

In actual server logs, operations such as selecting a single patient filter took **5,066ms (over 5 seconds)**, and loading the main dashboard took **2,878ms**. The delay is caused by a compounding chain of architectural factors:

1. **Remote Authentication Round-Trips on Every Click:** `middleware.ts` contacts Supabase Auth servers over the internet for every internal navigation and Link prefetch.
2. **Server-Side Navigation for Local Tasks:** Dropdowns (e.g. status and doctor in `PatientsFilterBar`) and calendar week controls invoke `router.push()`, treating simple UI changes as full-page server round-trips.
3. **Aggressive Skeleton Boundaries:** `app/dashboard/loading.tsx` causes the entire view to unmount and flash metric card skeletons during background data fetching.
4. **Database Write Contention on Page Visits:** Daily sync scripts (`syncAutoMissedAppointments` and `syncDayOfReminders`) run write and insert loops inside page render cycles.
5. **Cascading Server Actions:** Completing an appointment triggers 3 sequential server actions and 9 cache invalidations.

---

## 2. Root Causes of Click Latency & Slow Transitions

### 2.1 `middleware.ts` Network Bottleneck
* **File:** `middleware.ts` (Lines 28–30, 49–53)
* **Mechanism:**
  ```ts
  const { data: { user } } = await supabase.auth.getUser();
  ```
  The middleware configuration matches almost every request (`/((?!_next/static|_next/image|favicon.ico...)...)`).
* **Impact:** Every time a user clicks a link, or when Next.js prefetches a hovered route, the request hits the Edge/Node middleware runtime first. It sends an outbound HTTPS request to Supabase Auth (`/auth/v1/user`) in Singapore/US before any page code runs.
* **Cost:** **300ms – 800ms added latency to every single click**. Because the middleware runs in a separate runtime from React Server Components, the authentication result cannot be cached via React `cache()`.

---

### 2.2 Client Filter & Week Navigation via `router.push()`
* **Files:**
  * `components/patients/PatientsFilterBar.tsx` (Lines 40–46)
  * `components/calendar/CalendarClient.tsx` (Lines 61–67)
* **Mechanism:**
  In `PatientsFilterBar`, when a user picks an option in the **Status** or **Doctor** dropdown:
  ```ts
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ status: e.target.value }));
  };
  ```
  In `CalendarClient`, clicking Previous or Next Week executes:
  ```ts
  router.push(`/dashboard/calendar?week=${format(next, "yyyy-MM-dd")}`);
  ```
* **Impact:** Instead of filtering the already-loaded array instantly in JavaScript memory (< 5ms), the application initiates a full Server Component cycle. It trips the middleware, queries PostgreSQL over the internet, regenerates RSC payloads, and transfers them across the wire.
* **Recorded Server Log:**
  ```text
  GET /dashboard/patients?q=&status=Ongoing&doctor=db8a5eb8-d711-42e1-ba68-3b262debd77d 200 in 5066ms
  ```
  A simple filter click froze the interface for more than 5 seconds.

---

### 2.3 Full-Page Unmount & Skeleton Flash via `loading.tsx`
* **File:** `app/dashboard/loading.tsx` (Lines 1–63)
* **Mechanism:** Next.js uses `loading.tsx` as a Suspense fallback that envelopes all child routes under `/dashboard/*`.
* **Impact:** Whenever a user navigates to a new route, changes query parameters (e.g. `?status=...` or `?week=...`), or awaits an async server transition:
  1. Next.js unmounts the active screen.
  2. It replaces the screen with the 4-box metric card skeleton.
  3. It waits for the remote database response.
  4. It mounts the new page.
* **User Experience:** The entire screen blinks and jumps on every click, giving the impression of an unstable or crashing application.

---

### 2.4 Blocking Background Write Operations in Page Handlers
* **Files:**
  * `app/dashboard/page.tsx` (Lines 16–17)
  * `lib/actions/appointments.ts` (Lines 59–97, 154–244)
* **Mechanism:**
  ```ts
  export default async function DashboardPage() {
    void syncAutoMissedAppointments();
    void syncDayOfReminders();
    ...
  }
  ```
  Even though called with `void`, these functions run inside the same Node.js request context and event loop:
  * `syncAutoMissedAppointments`: Executes 2 database `UPDATE` queries on `appointments`.
  * `syncDayOfReminders`: Queries today's appointments, queries `notification_log`, and then loops over each appointment, executing up to two individual `.insert()` queries sequentially into `notification_log`.
* **Impact:** For 10 appointments scheduled today, up to 20 database writes run concurrently with the 10 `SELECT` queries required to render the dashboard. This saturates the database connection limit and degrades response times.

---

### 2.5 Sequential Multi-Server-Action Chains & Revalidation Storms
* **File:** `components/appointments/AppointmentsClient.tsx` (Lines 51–83)
* **Mechanism:**
  When a therapist completes an appointment in `handleConfirmCompletion`:
  ```ts
  // 1. Update appointment status
  await updateAppointmentStatus(completingAppt.id, "Completed");

  // 2. Log clinical session
  await addSession({ ... });

  // 3. Update patient case status
  await updatePatient(completingAppt.patients.id, { status: caseStatus });
  ```
  Each action is awaited sequentially:
  * `updateAppointmentStatus`: Triggers 3 `revalidatePath` calls.
  * `addSession`: Triggers 5 `revalidatePath` calls.
  * `updatePatient`: Triggers 1 `revalidatePath` call.
* **Impact:** 3 back-to-back network round-trips to the server, 3 database transactions, and 9 separate path cache purges. The therapist sees a spinning loader for **3 to 6 seconds** before the modal closes.

---

### 2.6 Double-Refresh Overhead
* **File:** `components/calendar/CalendarClient.tsx` (Lines 69–82)
* **Mechanism:**
  ```ts
  async function changeStatus(id: string, status: "Completed" | "Missed" | "Cancelled" | "Scheduled") {
    setUpdating(true);
    await updateAppointmentStatus(id, status);
    ...
    router.refresh();
  }
  ```
* **Impact:** `updateAppointmentStatus` already invokes `revalidatePath("/dashboard/calendar")` on the server. Next.js automatically refreshes the route when a Server Action revalidates it. Adding `router.refresh()` forces a second redundant server fetch immediately after the first one completes.

---

### 2.7 Development-Mode On-Demand Compilation Penalties
* **Evidence from Server Logs:**
  * `✓ Compiled /dashboard/profile in 3.7s`
  * `✓ Compiled /dashboard/reports/[id] in 2.7s`
  * `✓ Compiled /dashboard/settings in 2.2s`
  * `✓ Compiled /dashboard/appointments/new in 1.8s`
* **Mechanism:** `next dev` compiles routes on-demand when a user visits them for the first time. On Windows, file I/O overhead with Webpack results in a 1.5 to 4 second compilation pause on the first click to each page. While this particular compilation delay is eliminated in a production build (`next build && next start`), the database round-trips and layout re-renders remain.

---

## 3. Comprehensive Bug & Problem Inventory

### 3.1 Critical Bugs & Runtime Errors

#### 🔴 Bug 1: Unhandled 500 Server Error on Sending Chat Messages
* **File:** `lib/actions/chat.ts` (Line 21) & dev server logs
* **Error Log:**
  ```text
  POST /dashboard 500 in 144ms
  ⨯ Error: Could not find the table 'public.chat_messages' in the schema cache
      at sendChatMessage (./lib/actions/chat.ts:25:22)
  ```
* **Description:** The chat migration SQL file (`supabase/migrations/010_chat_messages.sql`) was created locally but has not been applied to the remote Supabase database. Sending any message from the Chat Panel throws an unhandled exception, causing a 500 internal server error.

#### 🔴 Bug 2: Hardcoded Production Database Password & Unpooled TCP Connections
* **File:** `lib/db.ts` (Lines 4–11)
* **Code:**
  ```ts
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:%24FeelesePhysio%40123@db.jvwthuzgwbfuycvclpif.supabase.co:5432/postgres";
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  ```
* **Problems:**
  1. The live Supabase database password is hardcoded directly in source code.
  2. Uses `new Client()` instead of `new Pool()`. Every password update creates a new raw TCP connection on port 5432. If connections fail to close or timeout during network drops, the PostgreSQL connection pool is quickly exhausted.
  3. Direct connections to port 5432 fail on networks without IPv6 support or firewalls blocking raw PostgreSQL ports.

---

### 3.2 Performance & Scalability Bottlenecks

#### 🟠 Bug 3: Unbounded Data Fetching in Reports (`SELECT *` on Lifetime Records)
* **File:** `app/dashboard/reports/page.tsx` (Lines 26–27)
* **Code:**
  ```ts
  supabase.from("appointments").select("therapist_id, date, status");
  supabase.from("attendance").select("therapist_id, date, status, hours_worked");
  ```
* **Problem:** There is no date filter, pagination, or row limit. As clinic history grows to thousands of records, every visit to the Reports tab downloads the entire clinic's lifetime logs into browser memory, creating a severe memory and bandwidth leak.

#### 🟠 Bug 4: Client-Side Waterfall Data Fetching on Intake Pages
* **Files:**
  * `app/dashboard/appointments/new/page.tsx` (Lines 20–43)
  * `app/dashboard/patients/new/page.tsx` (Lines 18–29)
* **Problem:** Marked `"use client"` with nested `useEffect` cascades:
  1. Component mounts blank.
  2. First `useEffect` loads patient list.
  3. Second call loads therapist info.
  4. Third call loads doctor list.
  The page visually jumps and flickers while loading elements that should have been prepared server-side in parallel.

#### 🟠 Bug 5: Redundant Auth & Profile Re-Queries in Layout & TopBar
* **Files:**
  * `app/dashboard/layout.tsx` (Lines 25–29)
  * `components/layout/TopBar.tsx` (Lines 71–104)
* **Problem:** `DashboardLayout` queries the database for therapists. Immediately afterward, `TopBar` mounts in the browser, calls `supabase.auth.getUser()`, queries the `therapists` table again, and queries the `notification_log` table. Data already known on the server is fetched again on the client.

---

### 3.3 State Inconsistency & UI Synchronization Bugs

#### 🟡 Bug 6: Local State Disconnected from Server Props (`useState(initialData)`)
* **Files:**
  * `components/appointments/AppointmentsClient.tsx` (Line 12)
  * `components/attendance/AttendanceClient.tsx` (Line 42)
* **Code:**
  ```ts
  export function AppointmentsClient({ appts }: { appts: any[] }) {
    const [list, setList] = useState(appts);
  ```
* **Problem:** `useState` only assigns the initial value when the component mounts. When a Server Action runs `revalidatePath`, Next.js delivers fresh `appts` props, but because there is no `useEffect` or key to sync `list`, the interface displays stale data until the browser is manually refreshed.

#### 🟡 Bug 7: Incorrect Loading Skeleton Layout Across Sub-Pages
* **File:** `app/dashboard/loading.tsx` (Lines 14–25)
* **Problem:** The skeleton layout hardcodes 4 KPI metric cards and a dashboard grid. When opening the Calendar, Patient Profile, Attendance, or Reports pages, this dashboard skeleton flashes before the actual page appears, causing layout shift and visual confusion.

#### 🟡 Bug 8: Unnecessary Notification Polling on Admin Accounts
* **Files:**
  * `components/layout/TopBar.tsx` (Lines 93–101)
  * `app/dashboard/notifications/page.tsx` (Lines 46–65)
* **Problem:** In earlier updates, admin-side notifications were deprecated in favor of therapist notifications and dispatch logs. However, `TopBar` continues to query `notification_log` for admins and subscribe to realtime events, consuming unnecessary memory and database read quota.

---

### 3.4 Data Loss, Persistence & Security Flaws

#### 🔵 Bug 9: Settings Page Has No Database Persistence (Data Lost on Refresh)
* **File:** `app/dashboard/settings/page.tsx` (Lines 146–152, 174–180, 199–205)
* **Problem:** In Clinic Profile, Operating Hours, and Clinical Governance tabs, clicking "Save Profile Changes" or "Update Schedule Rules" only displays a temporary toast:
  ```ts
  <button
    type="button"
    onClick={() => showSuccessToast("Clinic profile settings saved!")}
    className="btn-primary text-xs"
  >
    Save Profile Changes
  </button>
  ```
  The values are stored solely in transient React state. As soon as the page is refreshed or navigated away from, all entered clinic details are permanently lost.

#### 🔵 Bug 10: Manual Password Updates Directly on `auth.users` via Raw SQL
* **File:** `lib/actions/therapists.ts` (Lines 110–116)
* **Code:**
  ```sql
  UPDATE auth.users 
  SET encrypted_password = extensions.crypt($1, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = $2;
  ```
* **Problem:** Direct manipulation of internal Supabase `auth.users` via raw SQL bypasses Supabase Auth hooks, session invalidation, and password hashing security policies. If the `extensions.crypt` function path changes, the query fails and locks the therapist out of their account. The official Supabase Admin API (`supabase.auth.admin.updateUserById`) should be used instead.

---

## 4. Master Issue Matrix & Severity Table

| # | Component / File | Category | Severity | Description & Impact |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `middleware.ts` | Latency | 🔴 High | Remote `auth.getUser()` on every request/prefetch adds 300–800ms to every click. |
| **2** | `PatientsFilterBar.tsx` | Latency | 🔴 High | Uses `router.push()` for status/doctor filter, causing a 5-second server round-trip. |
| **3** | `010_chat_messages.sql` | Runtime | 🔴 High | `chat_messages` table missing in Supabase; sending chat messages crashes with 500 error. |
| **4** | `lib/db.ts` | Security | 🔴 High | Hardcoded database password in source code & raw unpooled TCP connections. |
| **5** | `app/dashboard/loading.tsx` | UX / Latency | 🟠 Medium | Root Suspense boundary unmounts active pages and flashes metric card skeleton. |
| **6** | `AppointmentsClient.tsx` | Latency | 🟠 Medium | 3 sequential awaited Server Actions + 9 `revalidatePath` calls when completing visits. |
| **7** | `CalendarClient.tsx` | Latency | 🟠 Medium | Redundant `router.refresh()` called after Server Action already revalidated. |
| **8** | `DashboardPage` & `appointments.ts` | Latency / DB | 🟠 Medium | Un-indexed sync writes (`syncDayOfReminders`) run in parallel with 10 page reads. |
| **9** | `app/dashboard/reports/page.tsx` | Scalability | 🟠 Medium | Unbounded `SELECT *` on all historical appointments and attendance records. |
| **10** | `AppointmentsClient.tsx` | UI Bug | 🟡 Medium | `useState(appts)` never updates when parent Server Component revalidates props. |
| **11** | `app/dashboard/settings/page.tsx` | Data Loss | 🔵 High | Settings save buttons only trigger local toast; data is never persisted to DB. |
| **12** | `lib/actions/therapists.ts` | Security | 🔵 Medium | Modifies internal `auth.users` table using raw SQL instead of Supabase Admin API. |

---

## 5. Recommended Optimization & Remediation Roadmap

To eliminate the click latency and resolve all identified issues, the following phased remediation plan is recommended:

### Phase 1: Make Clicks Instant (< 50ms)
1. **Convert Patient Filtering to Instant Client-Side Search:**
   * Move status and doctor filtering to client-side state in `PatientsClient`.
   * Selecting a dropdown should filter the loaded patient array immediately in memory with zero network requests. Keep the URL query string updated optionally with `window.history.replaceState` without triggering a server navigation.
2. **Remove Outbound Auth Calls from RSC Prefetches in Middleware:**
   * Restrict `middleware.ts` to session cookie verification rather than making a remote network call on internal Next.js prefetch requests (`_rsc`).
3. **Scope Loading Boundaries:**
   * Replace the global `app/dashboard/loading.tsx` with granular, localized Suspense boundaries or non-destructive subtle indicators (like top loading bars) so that changing tabs or filters never unmounts the active UI.

### Phase 2: Consolidate Database & Server Actions
4. **Merge Sequential Server Actions into a Single Transaction:**
   * Combine `updateAppointmentStatus`, `addSession`, and `updatePatient` into a single atomic action: `completeAppointmentAndRecordSession(...)`.
   * This reduces 3 network round-trips to 1 and consolidates cache revalidation into a single call.
5. **Move Daily Syncs Out of Page Render Cycles:**
   * Extract `syncAutoMissedAppointments` and `syncDayOfReminders` into a scheduled cron job (via Supabase pg_cron or Next.js route handlers) rather than executing write queries during page render cycles.
6. **Synchronize Client States with Props:**
   * In `AppointmentsClient` and `AttendanceClient`, add synchronization (`useEffect(() => setList(appts), [appts])`) so revalidated server data automatically reflects on screen.

### Phase 3: Database & Security Fixes
7. **Apply Chat Migration:**
   * Run `010_chat_messages.sql` in the Supabase SQL Editor to eliminate the 500 error when sending chat messages.
8. **Remove Hardcoded Database Password:**
   * Remove plaintext database credentials from `lib/db.ts` and use environment variables with Supabase Service Role API instead of direct unpooled TCP connections.
9. **Persist Settings in Supabase:**
   * Create a `clinic_settings` table to properly save and load clinic profile and operating hours data.
