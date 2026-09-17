/**
 * api.js — Thin fetch wrapper for the Recovery Path API.
 *
 * - Automatically injects the JWT from localStorage
 * - Throws a structured error on non-2xx responses
 * - Calls window.__logout() on 401 (auto-logout)
 */

const BASE = "/api";   // Vite proxies /api → http://localhost:8000

export function getToken() {
  return localStorage.getItem("rp_token");
}

export function saveToken(token) {
  localStorage.setItem("rp_token", token);
}

export function clearToken() {
  localStorage.removeItem("rp_token");
  localStorage.removeItem("rp_user");
}

export function saveUser(user) {
  localStorage.setItem("rp_user", JSON.stringify(user));
}

export function loadUser() {
  try {
    return JSON.parse(localStorage.getItem("rp_user"));
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper.
 * @param {string} path  - API path, e.g. "/patients"
 * @param {RequestInit} options - fetch options
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window.__logout === "function") window.__logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const api = {
  auth: {
    login: (username, password) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => apiFetch("/auth/me"),
  },

  // -------------------------------------------------------------------------
  // Doctors
  // -------------------------------------------------------------------------
  doctors: {
    list: () => apiFetch("/doctors"),
    get: (id) => apiFetch(`/doctors/${id}`),
    create: (data) => apiFetch("/doctors", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/doctors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/doctors/${id}`, { method: "DELETE" }),
  },

  // -------------------------------------------------------------------------
  // Patients
  // -------------------------------------------------------------------------
  patients: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== "")
      ).toString();
      return apiFetch(`/patients${qs ? `?${qs}` : ""}`);
    },
    get: (id) => apiFetch(`/patients/${id}`),
    create: (data) => apiFetch("/patients", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/patients/${id}`, { method: "DELETE" }),

    // Nested
    getAssessment: (id) => apiFetch(`/patients/${id}/assessment`),
    upsertAssessment: (id, data) =>
      apiFetch(`/patients/${id}/assessment`, { method: "POST", body: JSON.stringify(data) }),

    getTreatmentPlan: (id) => apiFetch(`/patients/${id}/treatment-plan`),
    upsertTreatmentPlan: (id, data) =>
      apiFetch(`/patients/${id}/treatment-plan`, { method: "POST", body: JSON.stringify(data) }),

    listSessions: (id) => apiFetch(`/patients/${id}/sessions`),
    addSession: (id, data) =>
      apiFetch(`/patients/${id}/sessions`, { method: "POST", body: JSON.stringify(data) }),
  },

  // -------------------------------------------------------------------------
  // Appointments
  // -------------------------------------------------------------------------
  appointments: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== "")
      ).toString();
      return apiFetch(`/appointments${qs ? `?${qs}` : ""}`);
    },
    get: (id) => apiFetch(`/appointments/${id}`),
    create: (data) => apiFetch("/appointments", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/appointments/${id}`, { method: "DELETE" }),
  },

  // -------------------------------------------------------------------------
  // Exercises
  // -------------------------------------------------------------------------
  exercises: {
    list: (category) =>
      apiFetch(`/exercise-library${category ? `?category=${category}` : ""}`),
    create: (data) =>
      apiFetch("/exercise-library", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`/exercise-library/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/exercise-library/${id}`, { method: "DELETE" }),
  },

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------
  reports: {
    list: () => apiFetch("/reports"),
    get: (patientId) => apiFetch(`/reports/${patientId}`),
  },

  health: () => apiFetch("/health"),
};
