import React, { useState, useEffect } from "react";
import {
  Routes, Route, Navigate, Outlet, NavLink, useNavigate, useParams,
} from "react-router-dom";
import {
  LayoutDashboard, Stethoscope, Users, CalendarDays, Dumbbell,
  FileText, Settings as SettingsIcon, Search, Bell, Printer,
  Check, X, RotateCcw, ChevronDown, Plus, LogOut, ArrowLeft,
  Activity, TrendingUp, HeartPulse, ShieldCheck, Sparkles, Clock, AlertCircle
} from "lucide-react";

/* ============ MODERN COLOR SYSTEM ============ */
const CHIP_STYLES = {
  Completed: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-1 ring-emerald-500/10", dot: "bg-emerald-500" },
  Ongoing: { bg: "bg-teal-50 text-teal-700 border-teal-200/60 ring-1 ring-teal-500/10", dot: "bg-teal-500 animate-pulse" },
  Active: { bg: "bg-teal-50 text-teal-700 border-teal-200/60 ring-1 ring-teal-500/10", dot: "bg-teal-500" },
  Discharged: { bg: "bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-400/10", dot: "bg-slate-400" },
  Scheduled: { bg: "bg-amber-50 text-amber-800 border-amber-200/60 ring-1 ring-amber-500/10", dot: "bg-amber-500" },
  New: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60 ring-1 ring-indigo-500/10", dot: "bg-indigo-500 animate-pulse" },
  "On Leave": { bg: "bg-amber-50 text-amber-800 border-amber-200/60 ring-1 ring-amber-500/10", dot: "bg-amber-500" },
  Cancelled: { bg: "bg-rose-50 text-rose-700 border-rose-200/60 ring-1 ring-rose-500/10", dot: "bg-rose-500" },
  Missed: { bg: "bg-slate-100 text-slate-600 border-slate-200 ring-1 ring-slate-400/10", dot: "bg-slate-400" },
};

function Chip({ status }) {
  const s = CHIP_STYLES[status] || CHIP_STYLES.Missed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function Card({ children, className = "", hover = false, ...rest }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${hover ? "transition-all duration-200 hover:shadow-[0_8px_20px_-4px_rgba(15,23,42,0.08)] hover:border-slate-300" : ""
        } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "default", disabled, type = "button", className = "", size = "md" }) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5 font-semibold",
    md: "px-4 py-2 text-[13px] rounded-xl gap-2 font-semibold",
    lg: "px-5 py-2.5 text-sm rounded-xl gap-2 font-bold",
  };
  const variantClasses = {
    default: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98]",
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-600/20 active:scale-[0.98]",
    admin: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-[0.98]",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-[0.98]",
    soft: "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children, required }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[85px]"
    />
  );
}

function Modal({ open, onClose, title, children, footer, small }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`bg-white rounded-2xl w-full ${small ? "max-w-md" : "max-w-xl"} max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden transform transition-all`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="font-display font-bold text-lg text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ STAT CARD ============ */
function StatCard({ label, value, change, trend = "up", icon: IconComponent, color = "teal" }) {
  const colorMap = {
    teal: { bg: "bg-teal-50 text-teal-600 border-teal-100", stroke: "#0D9488" },
    indigo: { bg: "bg-indigo-50 text-indigo-600 border-indigo-100", stroke: "#4F46E5" },
    blue: { bg: "bg-blue-50 text-blue-600 border-blue-100", stroke: "#2563EB" },
    emerald: { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", stroke: "#10B981" },
  };
  const theme = colorMap[color] || colorMap.teal;

  return (
    <Card hover className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <div className="text-3xl font-display font-bold text-slate-900 mt-1">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${theme.bg}`}>
          {IconComponent && <IconComponent size={20} />}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${trend === "up" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-100"}`}>
            {trend === "up" ? "↑" : "•"} {change}
          </span>
          <span className="text-slate-400">vs last period</span>
        </div>
        <svg width="64" height="20" className="opacity-70 group-hover:opacity-100 transition-opacity">
          <polyline
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,15 12,12 24,14 36,8 48,11 64,3"
          />
        </svg>
      </div>
    </Card>
  );
}

/* ============ PAIN METER ============ */
function PainMeter({ value, max = 10, showLabel = true }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const getColors = (v) => {
    if (v <= 3) return { label: "Mild Discomfort", text: "text-emerald-700", light: "bg-emerald-50 border-emerald-200" };
    if (v <= 6) return { label: "Moderate Pain", text: "text-amber-700", light: "bg-amber-50 border-amber-200" };
    return { label: "Severe Pain", text: "text-rose-700", light: "bg-rose-50 border-rose-200" };
  };
  const info = getColors(value);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-slate-500">PAIN SCORE</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${info.light} ${info.text}`}>
            {value}/10 · {info.label}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #EF4444 100%)",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
        <span>0 No Pain</span>
        <span>5 Moderate</span>
        <span>10 Worst</span>
      </div>
    </div>
  );
}

/* ============ MOCK DATA ============ */
const today = new Date().toISOString().slice(0, 10);

const initialDoctors = [
  { id: 1, code: "DR001", name: "Dr. Sara Iqbal", specialization: "Sports Rehabilitation", phone: "+91 98765 10001", email: "sara.iqbal@sunrisephysio.com", availableDays: "Mon–Fri", status: "Active" },
  { id: 2, code: "DR002", name: "Dr. Ali Rahman", specialization: "Orthopedic Physio", phone: "+91 98765 10002", email: "ali.rahman@sunrisephysio.com", availableDays: "Mon–Sat", status: "Active" },
  { id: 3, code: "DR003", name: "Dr. Neha Kapoor", specialization: "Post-Surgical Rehab", phone: "+91 98765 10003", email: "neha.kapoor@sunrisephysio.com", availableDays: "Tue–Sat", status: "Active" },
  { id: 4, code: "DR004", name: "Dr. Vikram Shah", specialization: "Geriatric Physio", phone: "+91 98765 10004", email: "vikram.shah@sunrisephysio.com", availableDays: "Mon, Wed, Fri", status: "On Leave" },
];

const initialPatients = [
  {
    id: 12, code: "PT0012", name: "Ayesha Khan", age: 24, gender: "Female",
    phone: "+91 98765 43210", email: "ayesha.khan@mail.com", address: "B-14, Vastrapur, Ahmedabad",
    emergencyContact: "Imran Khan · +91 98700 11223", occupation: "Software Engineer",
    referredBy: "Dr. Neha Patel (Orthopedic)", medicalHistory: "No prior surgeries; mild scoliosis noted",
    doctorId: 1, registrationDate: "2026-08-10", status: "Ongoing",
    assessment: { mainComplaint: "Chronic lower back pain", bodyPart: "Lumbar Spine", onset: "Started ~3 weeks ago", painLevel: 8, painType: "Dull, occasional sharp on bending", rangeOfMotion: "Restricted forward flexion (60%)", muscleStrength: "Core strength 3/5", posture: "Forward-leaning, slight pelvic tilt", diagnosis: "Mechanical Lower Back Pain (Non-specific)" },
    treatment: { plan: [{ treatment: "Stretching exercises", frequency: "3× weekly", duration: "15 min" }, { treatment: "Core Strength training", frequency: "2× weekly", duration: "20 min" }, { treatment: "Manual therapy", frequency: "2× weekly", duration: "15 min" }, { treatment: "Heat therapy", frequency: "2× weekly", duration: "10 min" }], startDate: "2026-08-15", endDate: "2026-10-10", plannedSessions: 10 },
    sessions: [
      { id: 1, date: "2026-08-14", painBefore: 8, painAfter: 6, treatmentGiven: "Manual therapy + Heat pack", duration: 40, notes: "Mild soreness post-session, advised ice at home." },
      { id: 2, date: "2026-08-17", painBefore: 6, painAfter: 4, treatmentGiven: "Lumbar Mobilization + Stretching", duration: 40, notes: "Good response, ROM improving steadily." },
      { id: 3, date: "2026-08-20", painBefore: 5, painAfter: 3, treatmentGiven: "Core activation + McKenzie extension", duration: 45, notes: "Patient reported improved comfort while sitting at desk." },
    ],
  },
  {
    id: 13, code: "PT0013", name: "Rahul Verma", age: 31, gender: "Male",
    phone: "+91 98765 43211", email: "rahul.verma@mail.com", address: "Satellite, Ahmedabad",
    emergencyContact: "Priya Verma · +91 98700 11224", occupation: "Accountant",
    referredBy: "Self", medicalHistory: "Meniscus tear, non-surgical",
    doctorId: 1, registrationDate: "2026-08-05", status: "Ongoing",
    assessment: { mainComplaint: "Right knee pain on flexion", bodyPart: "Right Knee", onset: "6 weeks ago, gym injury", painLevel: 6, painType: "Sharp on stairs, dull otherwise", rangeOfMotion: "Flexion limited to 90°", muscleStrength: "Quadriceps 3/5", posture: "Normal gait", diagnosis: "Meniscus strain, conservative management" },
    treatment: { plan: [{ treatment: "Quadriceps strengthening", frequency: "3× weekly", duration: "20 min" }, { treatment: "Knee Mobilization", frequency: "1× weekly", duration: "15 min" }], startDate: "2026-08-06", endDate: "2026-09-20", plannedSessions: 10 },
    sessions: [
      { id: 1, date: "2026-08-08", painBefore: 6, painAfter: 5, treatmentGiven: "Knee Mobilization + Ice", duration: 35, notes: "Baseline session." },
      { id: 2, date: "2026-08-13", painBefore: 5, painAfter: 4, treatmentGiven: "Isometrics + Quad Sets", duration: 30, notes: "Tolerating resistance work well." },
      { id: 3, date: "2026-08-19", painBefore: 4, painAfter: 3, treatmentGiven: "Step downs + hamstring stretch", duration: 30, notes: "Improved stair climbing tolerance." },
    ],
  },
  {
    id: 14, code: "PT0014", name: "Meera Nair", age: 45, gender: "Female",
    phone: "+91 98765 43212", email: "meera.nair@mail.com", address: "Bodakdev, Ahmedabad",
    emergencyContact: "Suresh Nair · +91 98700 11225", occupation: "Teacher",
    referredBy: "Dr. Ali Rahman", medicalHistory: "Frozen shoulder, right side",
    doctorId: 2, registrationDate: "2026-08-18", status: "New",
    assessment: { mainComplaint: "Right shoulder stiffness and pain", bodyPart: "Right Shoulder", onset: "2 months, gradual", painLevel: 7, painType: "Dull ache, sharp on overhead reach", rangeOfMotion: "Abduction limited to 70°", muscleStrength: "Deltoid 3/5", posture: "Slight right shoulder elevation", diagnosis: "Adhesive Capsulitis (Frozen Shoulder Phase 1)" },
    treatment: { plan: [{ treatment: "Capsular stretching", frequency: "3× weekly", duration: "15 min" }, { treatment: "Scapular stabilization", frequency: "2× weekly", duration: "20 min" }], startDate: "2026-08-19", endDate: "2026-11-01", plannedSessions: 8 },
    sessions: [
      { id: 1, date: "2026-08-19", painBefore: 7, painAfter: 6, treatmentGiven: "Gentle pendulum + heat", duration: 30, notes: "First session, gentle mobilization." },
    ],
  },
  {
    id: 15, code: "PT0015", name: "Farhan Sheikh", age: 52, gender: "Male",
    phone: "+91 98765 43213", email: "farhan.sheikh@mail.com", address: "Navrangpura, Ahmedabad",
    emergencyContact: "Ayaan Sheikh · +91 98700 11226", occupation: "Business Owner",
    referredBy: "Dr. Neha Patel", medicalHistory: "Post ACL-surgery rehabilitation",
    doctorId: 1, registrationDate: "2026-07-28", status: "Ongoing",
    assessment: { mainComplaint: "Post-surgical knee weakness", bodyPart: "Left Knee", onset: "Surgery 6 weeks ago", painLevel: 4, painType: "Dull, worse with weight-bearing", rangeOfMotion: "Flexion 100°, improving", muscleStrength: "Quadriceps 2/5", posture: "Guarded gait, mild limp", diagnosis: "Post-ACL Reconstruction Rehabilitation (Phase 2)" },
    treatment: { plan: [{ treatment: "Closed kinetic chain strength", frequency: "3× weekly", duration: "25 min" }, { treatment: "Cryotherapy", frequency: "2× weekly", duration: "10 min" }], startDate: "2026-07-29", endDate: "2026-10-15", plannedSessions: 10 },
    sessions: [
      { id: 1, date: "2026-08-01", painBefore: 6, painAfter: 5, treatmentGiven: "Gentle ROM + Cryotherapy", duration: 35, notes: "Early stage rehab." },
      { id: 2, date: "2026-08-08", painBefore: 5, painAfter: 4, treatmentGiven: "Mini squats + balance board", duration: 35, notes: "Progressing well." },
      { id: 3, date: "2026-08-15", painBefore: 4, painAfter: 3, treatmentGiven: "Leg press + gait training", duration: 40, notes: "Weight-bearing improving steadily." },
    ],
  },
  {
    id: 9, code: "PT0009", name: "Zoya Ahmed", age: 27, gender: "Female",
    phone: "+91 98765 43214", email: "zoya.ahmed@mail.com", address: "Maninagar, Ahmedabad",
    emergencyContact: "Kabir Ahmed · +91 98700 11227", occupation: "Athlete (Amateur)",
    referredBy: "Self", medicalHistory: "Hamstring strain",
    doctorId: 2, registrationDate: "2026-06-20", status: "Discharged",
    assessment: { mainComplaint: "Left hamstring tightness and pain", bodyPart: "Left Hamstring", onset: "Sports injury, sprinting", painLevel: 6, painType: "Sharp on stretch, dull at rest", rangeOfMotion: "Straight leg raise 60°", muscleStrength: "Hamstring 3/5", posture: "Normal", diagnosis: "Grade I Hamstring Strain — Fully Recovered" },
    treatment: { plan: [{ treatment: "Eccentric hamstring curls", frequency: "4× weekly", duration: "15 min" }, { treatment: "Dynamic mobility", frequency: "3× weekly", duration: "20 min" }], startDate: "2026-06-21", endDate: "2026-08-01", plannedSessions: 10 },
    sessions: [
      { id: 1, date: "2026-06-22", painBefore: 6, painAfter: 5, treatmentGiven: "Stretching & soft tissue work", duration: 30, notes: "Baseline." },
      { id: 2, date: "2026-07-05", painBefore: 4, painAfter: 2, treatmentGiven: "Strength training + agility drills", duration: 30, notes: "Good progress." },
      { id: 3, date: "2026-07-30", painBefore: 1, painAfter: 0, treatmentGiven: "Final discharge test & plyometrics", duration: 20, notes: "Full recovery, pain 0/10, discharged." },
    ],
  },
];

const initialAppointments = [
  { id: 1, patientId: 12, doctorId: 1, date: today, time: "09:00", treatmentType: "Manual Therapy", status: "Completed", notes: "Patient reported better lumbar mobility." },
  { id: 2, patientId: 13, doctorId: 1, date: today, time: "10:30", treatmentType: "Strength Training", status: "Scheduled", notes: "Focus on quad isometrics." },
  { id: 3, patientId: 14, doctorId: 2, date: today, time: "11:45", treatmentType: "Stretching & Mobilization", status: "Scheduled", notes: "Shoulder abduction progress check." },
  { id: 4, patientId: 15, doctorId: 1, date: today, time: "14:00", treatmentType: "Cryotherapy & Gait", status: "Missed", notes: "Follow up for rescheduling." },
];

const initialExercises = [
  { id: 1, name: "Knee Extension", part: "Knee / Quads", category: "Strength", desc: "Seated, extend knee fully and hold 3 seconds.", sets: 3, reps: 12, duration: null, level: "Beginner" },
  { id: 2, name: "Straight Leg Raises", part: "Hip / Core", category: "Stability", desc: "Lying flat, raise leg to 45° keeping it straight.", sets: 3, reps: 10, duration: null, level: "Beginner" },
  { id: 3, name: "Hamstring Active Stretch", part: "Hamstring", category: "Mobility", desc: "Seated forward fold, gentle stretch only.", sets: 3, reps: null, duration: "30 sec", level: "All Levels" },
  { id: 4, name: "Scapular Wall Slides", part: "Shoulder", category: "Mobility", desc: "Slow controlled slides up wall keeping forearms flush.", sets: 2, reps: 15, duration: null, level: "Intermediate" },
  { id: 5, name: "Cervical Retraction (Chin Tucks)", part: "Neck / Cervical", category: "Posture", desc: "Gently retract head back without tilting down.", sets: 4, reps: 10, duration: "5 sec hold", level: "Beginner" },
  { id: 6, name: "Bird Dog Core Exercise", part: "Core / Lumbar", category: "Strength", desc: "Opposite arm/leg extension on all-fours.", sets: 3, reps: 10, duration: null, level: "Intermediate" },
];

/* ============ NAV ============ */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { key: "doctors", label: "Doctors", icon: Stethoscope, adminOnly: true, section: "Clinic Management" },
  { key: "patients", label: "Patients", icon: Users, adminOnly: false, section: "Clinical Care" },
  { key: "appointments", label: "Appointments", icon: CalendarDays, adminOnly: false },
  { key: "library", label: "Exercise Library", icon: Dumbbell, adminOnly: false },
  { key: "reports", label: "Reports", icon: FileText, adminOnly: false, section: "Insights" },
  { key: "settings", label: "Settings", icon: SettingsIcon, adminOnly: true },
];

/* ============ LOGIN ============ */
const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "admin", name: "Priya Shah" },
  { username: "dr.sara", password: "sara123", role: "therapist", doctorId: 1, name: "Dr. Sara Iqbal" },
  { username: "dr.ali", password: "ali123", role: "therapist", doctorId: 2, name: "Dr. Ali Rahman" },
];

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const match = DEMO_ACCOUNTS.find((a) => a.username === username.trim() && a.password === password);
    if (!match) {
      setError("Invalid credentials. You can click a quick demo account below.");
      return;
    }
    setError("");
    onLogin(match);
  }

  function quickLogin(acc) {
    setUsername(acc.username);
    setPassword(acc.password);
    onLogin(acc);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-9 shadow-2xl border border-slate-100 relative z-10">
        <div className="flex items-center gap-3.5 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <HeartPulse size={26} />
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-slate-900 leading-tight">Recovery Path</div>
            <div className="text-xs font-semibold text-teal-700 tracking-wide">CLINICAL PHYSIOTHERAPY SYSTEM</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs font-semibold rounded-xl p-3 bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. admin or dr.sara" autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <Btn type="submit" variant="primary" className="w-full py-3 text-sm">
            Sign In to Clinical Portal
          </Btn>
        </form>

        <div className="mt-7 pt-6 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            One-Click Demo Access
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin(DEMO_ACCOUNTS[0])}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-colors"
            >
              👑 Admin
            </button>
            <button
              onClick={() => quickLogin(DEMO_ACCOUNTS[1])}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 transition-colors"
            >
              🩺 Dr. Sara
            </button>
            <button
              onClick={() => quickLogin(DEMO_ACCOUNTS[2])}
              className="px-2.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors"
            >
              🩺 Dr. Ali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ SIDEBAR + TOPBAR ============ */
function Sidebar({ role, doctorMe, accountName, onLogout }) {
  const isAdmin = role === "admin";
  const name = isAdmin ? accountName : (doctorMe?.name || "Doctor");
  const initials = name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
          <HeartPulse size={22} />
        </div>
        <div>
          <div className="font-display font-bold text-lg text-white tracking-tight">Recovery Path</div>
          <div className="text-[10.5px] font-semibold text-teal-400 uppercase tracking-wider">Sunrise Physio</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const label = !isAdmin && item.key === "patients" ? "My Patients" : !isAdmin && item.key === "appointments" ? "My Schedule" : item.label;
          return (
            <div key={item.key}>
              {item.section && (
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 px-3 pt-4 pb-1.5">
                  {item.section}
                </div>
              )}
              <NavLink
                to={`/${item.key}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{name}</div>
            <div className="text-[10.5px] text-slate-400 truncate">{isAdmin ? "Clinic Administrator" : (doctorMe?.specialization || "Therapist")}</div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ role, accountName, doctorMe, onQuickRoleSwitch }) {
  const isAdmin = role === "admin";
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="w-80 relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search patients, doctors, appointments..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <span className="text-[11px] text-slate-400 px-2 font-bold uppercase tracking-wider hidden sm:inline">Role:</span>
          <button
            onClick={() => onQuickRoleSwitch("admin")}
            className={`px-2.5 py-1 rounded-lg transition-all ${isAdmin ? "bg-indigo-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
          >
            👑 Admin
          </button>
          <button
            onClick={() => onQuickRoleSwitch("therapist", 1)}
            className={`px-2.5 py-1 rounded-lg transition-all ${!isAdmin && doctorMe?.id === 1 ? "bg-teal-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
          >
            🩺 Dr. Sara
          </button>
          <button
            onClick={() => onQuickRoleSwitch("therapist", 2)}
            className={`px-2.5 py-1 rounded-lg transition-all ${!isAdmin && doctorMe?.id === 2 ? "bg-teal-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
          >
            🩺 Dr. Ali
          </button>
        </div>

        <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 relative transition-colors">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Clinic Open · 4 On-Duty
        </div>
      </div>
    </header>
  );
}

/* ============ DASHBOARD ============ */
function DoctorCard({ doctor, patients, appts, goToPatient }) {
  const [open, setOpen] = useState(false);
  const myPatients = patients.filter((p) => p.doctorId === doctor.id);
  const todayCount = appts.filter((a) => a.doctorId === doctor.id && a.date === today).length;
  const initials = doctor.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").toUpperCase();

  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-display font-bold text-base flex items-center justify-center shadow-md">
              {initials}
            </div>
            <div>
              <div className="font-display font-bold text-base text-slate-900">{doctor.name}</div>
              <div className="text-xs font-semibold text-teal-700">{doctor.specialization}</div>
            </div>
          </div>
          <Chip status={doctor.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 text-center">
          <div>
            <div className="text-xl font-display font-bold text-slate-900">{myPatients.length}</div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Assigned Patients</div>
          </div>
          <div>
            <div className="text-xl font-display font-bold text-teal-600">{todayCount}</div>
            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Today's Sessions</div>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-xs font-bold text-teal-700 hover:text-teal-800 py-1.5 transition-colors"
        >
          <span>{open ? "Collapse Patient List" : `View Patients (${myPatients.length})`}</span>
          <ChevronDown size={14} className={`transform transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 max-h-48 overflow-y-auto">
            {myPatients.length === 0 && (
              <div className="text-xs text-slate-400 py-2 text-center">No patients assigned yet.</div>
            )}
            {myPatients.map((p) => (
              <div
                key={p.id}
                onClick={() => goToPatient(p.id)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate group-hover:text-teal-700">{p.name}</div>
                    <div className="text-[10.5px] text-slate-400 truncate">{p.assessment?.bodyPart || "Physio Care"}</div>
                  </div>
                </div>
                <Chip status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Dashboard({ role, doctors, patients, appts, doctorMe, accountName, goToPatient, onNavigate }) {
  const isAdmin = role === "admin";
  const todaysAppts = appts.filter((a) => a.date === today && (isAdmin || a.doctorId === doctorMe.id));
  const myPatients = patients.filter((p) => isAdmin || p.doctorId === doctorMe.id);
  const totalSessions = myPatients.reduce((sum, p) => sum + p.sessions.length, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2 border border-teal-500/30">
              <Sparkles size={14} /> Clinical Intelligence Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Good day, {isAdmin ? accountName.split(" ")[0] : doctorMe?.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              {isAdmin
                ? `You have ${todaysAppts.length} appointments scheduled across ${doctors.filter((d) => d.status === "Active").length} active doctors today.`
                : `You have ${todaysAppts.length} sessions on your schedule today. ${myPatients.length} active recovery cases under your care.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Btn
              variant="primary"
              size="md"
              onClick={() => onNavigate("appointments")}
              className="shadow-lg shadow-teal-500/20"
            >
              <CalendarDays size={15} /> Book Appointment
            </Btn>
            <Btn
              variant="default"
              size="md"
              onClick={() => onNavigate("patients")}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 backdrop-blur-sm"
            >
              <Users size={15} /> View Patients
            </Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={isAdmin ? "Total Patients" : "My Active Patients"}
          value={myPatients.length}
          change="+12%"
          trend="up"
          color="teal"
          icon={Users}
        />
        <StatCard
          label={isAdmin ? "Active Doctors" : "Today's Schedule"}
          value={isAdmin ? doctors.filter((d) => d.status === "Active").length : todaysAppts.length}
          change={isAdmin ? "100% capacity" : `${todaysAppts.filter(a => a.status === "Completed").length} done`}
          trend="up"
          color="indigo"
          icon={isAdmin ? Stethoscope : CalendarDays}
        />
        <StatCard
          label="Today's Sessions"
          value={todaysAppts.length}
          change="On Track"
          trend="up"
          color="blue"
          icon={Activity}
        />
        <StatCard
          label="Rehab Sessions Logged"
          value={totalSessions}
          change="+24 this week"
          trend="up"
          color="emerald"
          icon={HeartPulse}
        />
      </div>

      {isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Therapists & Patient Allocation</h2>
              <p className="text-xs text-slate-500">Live active clinical workload per doctor</p>
            </div>
            <Btn variant="soft" size="sm" onClick={() => onNavigate("doctors")}>
              Manage Doctors →
            </Btn>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} patients={patients} appts={appts} goToPatient={goToPatient} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">
              {isAdmin ? "Today's Clinic Schedule" : "My Schedule Today"}
            </h2>
            <p className="text-xs text-slate-500">Live sessions for {today}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            {todaysAppts.length} Appointments
          </span>
        </div>
        <ApptTable appts={todaysAppts} patients={patients} doctors={doctors} showDoctor={isAdmin} onRowClick={goToPatient} />
      </Card>
    </div>
  );
}

function ApptTable({ appts, patients, doctors, showDoctor, onRowClick, actions }) {
  const pName = (id) => patients.find((p) => p.id === id)?.name || "—";
  const pObj = (id) => patients.find((p) => p.id === id);
  const dName = (id) => doctors.find((d) => d.id === id)?.name || "—";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
            <th className="pb-3 pr-4 font-bold">Time</th>
            <th className="pb-3 pr-4 font-bold">Patient</th>
            {showDoctor && <th className="pb-3 pr-4 font-bold">Physiotherapist</th>}
            <th className="pb-3 pr-4 font-bold">Treatment Modality</th>
            <th className="pb-3 pr-4 font-bold">Status</th>
            {actions && <th className="pb-3 font-bold text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appts.map((a) => {
            const patient = pObj(a.patientId);
            return (
              <tr
                key={a.id}
                onClick={() => onRowClick && onRowClick(a.patientId)}
                className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                <td className="py-3.5 pr-4 font-mono font-bold text-slate-700">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs">
                    <Clock size={12} className="text-slate-400" /> {a.time}
                  </div>
                </td>
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {pName(a.patientId).split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-[13px]">{pName(a.patientId)}</div>
                      <div className="text-[11px] text-slate-400">{patient?.code} · {patient?.assessment?.bodyPart || "Rehab"}</div>
                    </div>
                  </div>
                </td>
                {showDoctor && (
                  <td className="py-3.5 pr-4">
                    <div className="font-semibold text-slate-700">{dName(a.doctorId)}</div>
                  </td>
                )}
                <td className="py-3.5 pr-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {a.treatmentType || "General Care"}
                  </span>
                </td>
                <td className="py-3.5 pr-4">
                  <Chip status={a.status} />
                </td>
                {actions && <td className="py-3.5 text-right">{actions(a)}</td>}
              </tr>
            );
          })}
          {appts.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400">
                No appointments found for this schedule.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============ DOCTORS PAGE ============ */
function DoctorsPage({ doctors, patients, addDoctor }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialization: "", phone: "", email: "", availableDays: "" });

  function save() {
    addDoctor(form);
    setForm({ name: "", specialization: "", phone: "", email: "", availableDays: "" });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinic Management</div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Physiotherapy Staff & Doctors</h1>
        </div>
        <Btn variant="admin" onClick={() => setOpen(true)}>
          <Plus size={16} /> Add New Doctor
        </Btn>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4 font-bold">Code</th>
                <th className="py-3.5 pr-4 font-bold">Doctor Profile</th>
                <th className="py-3.5 pr-4 font-bold">Specialization</th>
                <th className="py-3.5 pr-4 font-bold">Active Patients</th>
                <th className="py-3.5 pr-4 font-bold">Working Days</th>
                <th className="py-3.5 pr-4 font-bold">Contact</th>
                <th className="py-3.5 pr-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {doctors.map((d) => {
                const docPatients = patients.filter((p) => p.doctorId === d.id);
                const initials = d.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").toUpperCase();
                return (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pl-6 pr-4 font-mono font-bold text-slate-400">{d.code}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-[11px] text-slate-400">{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-800">
                      {docPatients.length} patients
                    </td>
                    <td className="py-4 pr-4 text-slate-600 font-medium">{d.availableDays}</td>
                    <td className="py-4 pr-4 text-slate-500 font-mono text-xs">{d.phone}</td>
                    <td className="py-4 pr-6">
                      <Chip status={d.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add New Physiotherapist"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="admin" disabled={!form.name} onClick={save}>Save Doctor Profile</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Rohan Mehta" />
          </Field>
          <Field label="Specialization" required>
            <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Sports Rehabilitation" />
          </Field>
          <Field label="Phone Number">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 00000" />
          </Field>
          <Field label="Email Address">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@sunrisephysio.com" />
          </Field>
        </div>
        <Field label="Available Schedule Days">
          <Input value={form.availableDays} onChange={(e) => setForm({ ...form, availableDays: e.target.value })} placeholder="Mon–Sat (9:00 AM – 5:00 PM)" />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ PATIENTS PAGE ============ */
function PatientsPage({ role, doctors, doctorMe, patients, addPatient, goToPatient }) {
  const isAdmin = role === "admin";
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [open, setOpen] = useState(false);
  const empty = { name: "", age: "", gender: "Female", phone: "", email: "", address: "", emergencyContact: "", occupation: "", referredBy: "", medicalHistory: "" };
  const [form, setForm] = useState(empty);

  const scoped = isAdmin ? patients : patients.filter((p) => p.doctorId === doctorMe.id);
  const filtered = scoped.filter((p) => {
    const s = search.toLowerCase();
    const matchesSearch = !s || (
      p.name.toLowerCase().includes(s) ||
      p.code.toLowerCase().includes(s) ||
      (p.phone || "").includes(s) ||
      (p.assessment?.diagnosis || "").toLowerCase().includes(s) ||
      (p.assessment?.bodyPart || "").toLowerCase().includes(s)
    );
    if (!matchesSearch) return false;
    if (filterTag === "Ongoing") return p.status === "Ongoing";
    if (filterTag === "New") return p.status === "New";
    if (filterTag === "Discharged") return p.status === "Discharged";
    return true;
  });

  function save() {
    addPatient({ ...form, doctorId: doctorMe ? doctorMe.id : 1 });
    setForm(empty);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isAdmin ? "Clinic-Wide Directory" : "My Patient Cases"}
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {isAdmin ? "All Patients" : "My Assigned Patients"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Btn variant="primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Register New Patient
          </Btn>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, phone, condition or body part..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
          {["All", "Ongoing", "New", "Discharged"].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterTag === tag
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-4 font-bold">Patient Code</th>
                <th className="py-3.5 pr-4 font-bold">Patient Name</th>
                <th className="py-3.5 pr-4 font-bold">Condition & Body Part</th>
                {isAdmin && <th className="py-3.5 pr-4 font-bold">Attending Doctor</th>}
                <th className="py-3.5 pr-4 font-bold">Session Progress</th>
                <th className="py-3.5 pr-4 font-bold">Pain Level</th>
                <th className="py-3.5 pr-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filtered.map((p) => {
                const doc = doctors.find((d) => d.id === p.doctorId);
                const planned = p.treatment?.plannedSessions || 10;
                const done = p.sessions.length;
                const pct = Math.min(Math.round((done / planned) * 100), 100);
                const lastPain = done ? p.sessions[done - 1].painAfter : (p.assessment?.painLevel || 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => goToPatient(p.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 pl-6 pr-4 font-mono font-bold text-slate-400">{p.code}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.age} yrs · {p.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div>
                        <span className="font-semibold text-slate-800">{p.assessment?.bodyPart || "Lumbar / Spine"}</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.assessment?.diagnosis || "Initial Evaluation"}</div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-4 pr-4 font-medium text-slate-700">
                        {doc?.name || "—"}
                      </td>
                    )}
                    <td className="py-4 pr-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>{done} / {planned} done</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${lastPain <= 3 ? "bg-emerald-50 text-emerald-700" : lastPain <= 6 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                        }`}>
                        {lastPain}/10 Pain
                      </span>
                    </td>
                    <td className="py-4 pr-6">
                      <Chip status={p.status} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No patients match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register New Patient"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={!form.name} onClick={save}>Complete Registration</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Patient Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ayesha Khan" />
          </Field>
          <Field label="Age" required>
            <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 28" />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Phone Number" required>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email Address">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@mail.com" />
          </Field>
          <Field label="Occupation">
            <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Software Engineer" />
          </Field>
        </div>
        <Field label="Residential Address">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Area, City" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Emergency Contact (Name & Phone)">
            <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Imran Khan · +91 98700 11223" />
          </Field>
          <Field label="Referred By">
            <Input value={form.referredBy} onChange={(e) => setForm({ ...form, referredBy: e.target.value })} placeholder="Dr. Neha Patel (Orthopedic)" />
          </Field>
        </div>
        <Field label="Medical History / Comorbidities">
          <TextArea value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Prior surgeries, allergies, chronic conditions..." />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ PATIENT PROFILE ============ */
const emptyAssessment = { mainComplaint: "", bodyPart: "", onset: "", painLevel: 5, painType: "", rangeOfMotion: "", muscleStrength: "", posture: "", diagnosis: "" };
const emptyTreatment = { plan: [{ treatment: "", frequency: "", duration: "" }], startDate: new Date().toISOString().slice(0, 10), endDate: "", plannedSessions: 10 };

function PatientProfile({ patient, doctor, addSession, updateAssessment, updateTreatment, goBack, goToReport, isAdmin }) {
  const [tab, setTab] = useState("Overview");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sf, setSf] = useState({ painBefore: 5, painAfter: 3, treatmentGiven: "", duration: 35, notes: "" });
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [af, setAf] = useState(emptyAssessment);
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [tf, setTf] = useState(emptyTreatment);

  const TABS = ["Overview", "Clinical Assessment", "Treatment Plan", "Sessions History", "Recovery Progress Graph"];

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-400">
        Patient record not found. <button onClick={goBack} className="text-teal-600 underline font-bold">Return to Patients</button>
      </div>
    );
  }

  const initials = patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const doneSessions = patient.sessions.length;
  const plannedSessions = patient.treatment?.plannedSessions || 10;
  const progressPct = Math.min(Math.round((doneSessions / plannedSessions) * 100), 100);
  const currentPain = doneSessions ? patient.sessions[doneSessions - 1].painAfter : (patient.assessment?.painLevel || 0);

  function saveSession() {
    addSession(patient.id, { ...sf, date: new Date().toISOString().slice(0, 10) });
    setSf({ painBefore: 5, painAfter: 3, treatmentGiven: "", duration: 35, notes: "" });
    setSessionOpen(false);
  }

  function openAssessmentModal() {
    setAf(patient.assessment ? { ...patient.assessment } : emptyAssessment);
    setAssessmentOpen(true);
  }
  function saveAssessment() {
    updateAssessment(patient.id, af);
    setAssessmentOpen(false);
  }

  function openTreatmentModal() {
    setTf(patient.treatment ? { ...patient.treatment, plan: patient.treatment.plan.map((r) => ({ ...r })) } : { ...emptyTreatment, plan: [{ treatment: "", frequency: "", duration: "" }] });
    setTreatmentOpen(true);
  }
  function saveTreatment() {
    updateTreatment(patient.id, { ...tf, plan: tf.plan.filter((r) => r.treatment.trim() !== "") });
    setTreatmentOpen(false);
  }
  function updatePlanRow(i, field, value) {
    const plan = tf.plan.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    setTf({ ...tf, plan });
  }
  function addPlanRow() {
    setTf({ ...tf, plan: [...tf.plan, { treatment: "", frequency: "", duration: "" }] });
  }
  function removePlanRow(i) {
    setTf({ ...tf, plan: tf.plan.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Patients Directory / {patient.code}
      </button>

      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-teal-800 text-white font-display font-bold text-2xl flex items-center justify-center shadow-lg shadow-teal-900/10">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-slate-900">{patient.name}</h1>
              <Chip status={patient.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
              <span>ID: <b className="font-mono text-slate-800">{patient.code}</b></span>
              <span>•</span>
              <span>{patient.age} yrs · {patient.gender}</span>
              <span>•</span>
              <span>Attending: <b className="text-slate-800">{doctor?.name}</b></span>
              <span>•</span>
              <span>Registered: <b className="text-slate-800">{patient.registrationDate}</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Btn variant="default" onClick={() => goToReport(patient.id)}>
            <Printer size={15} /> {isAdmin ? "View Growth Report" : "Print Clinical Report"}
          </Btn>
          {!isAdmin && (
            <Btn variant="primary" onClick={() => setSessionOpen(true)}>
              <Plus size={15} /> Log Therapy Session
            </Btn>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tab === t
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-900"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">
              Personal & Clinical Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[13.5px]">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Phone</span>
                <span className="font-medium text-slate-800 font-mono">{patient.phone}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Email</span>
                <span className="font-medium text-slate-800">{patient.email}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Residential Address</span>
                <span className="font-medium text-slate-800">{patient.address}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Emergency Contact</span>
                <span className="font-medium text-slate-800">{patient.emergencyContact}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Occupation</span>
                <span className="font-medium text-slate-800">{patient.occupation}</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Referred By</span>
                <span className="font-medium text-slate-800">{patient.referredBy}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Medical History / Comorbidities</span>
                <span className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl block mt-1 border border-slate-100">
                  {patient.medicalHistory || "None recorded"}
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">
                Rehabilitation Vitals
              </div>
              <div className="space-y-4">
                <PainMeter value={currentPain} />
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Rehab Protocol Progress</span>
                    <span>{progressPct}% ({doneSessions}/{plannedSessions})</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck size={16} /> Clinical Diagnosis
              </div>
              <div className="font-display font-bold text-lg text-white mb-2">
                {patient.assessment?.diagnosis || "Evaluation In Progress"}
              </div>
              <p className="text-xs text-slate-300">
                Target Body Part: <b className="text-white">{patient.assessment?.bodyPart || "General"}</b>
              </p>
            </Card>
          </div>
        </div>
      )}

      {tab === "Clinical Assessment" && (
        <Card>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Physiotherapy Assessment & Diagnosis</h2>
              <p className="text-xs text-slate-500">Comprehensive musculoskeletal examination findings</p>
            </div>
            <Btn variant={patient.assessment ? "default" : "primary"} onClick={openAssessmentModal}>
              <Plus size={15} /> {patient.assessment ? "Update Assessment" : "Record Assessment"}
            </Btn>
          </div>

          {patient.assessment ? (
            <div className="space-y-6">
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">Primary Clinical Diagnosis</span>
                <div className="text-lg font-display font-bold text-teal-950">{patient.assessment.diagnosis}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-[13.5px]">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Chief Complaint</span>
                  <span className="font-bold text-slate-800">{patient.assessment.mainComplaint}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Body Region</span>
                  <span className="font-bold text-teal-700">{patient.assessment.bodyPart}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Onset & Duration</span>
                  <span className="font-bold text-slate-800">{patient.assessment.onset}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pain Characteristic</span>
                  <span className="font-bold text-slate-800">{patient.assessment.painType}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Range of Motion (ROM)</span>
                  <span className="font-bold text-slate-800">{patient.assessment.rangeOfMotion}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Muscle Strength (MMT)</span>
                  <span className="font-bold text-indigo-700">{patient.assessment.muscleStrength}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2 lg:col-span-3">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Posture & Biomechanical Notes</span>
                  <span className="font-medium text-slate-700">{patient.assessment.posture}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No clinical assessment recorded yet for this patient.
            </div>
          )}
        </Card>
      )}

      {tab === "Treatment Plan" && (
        <Card>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Customized Rehabilitation Plan</h2>
              <p className="text-xs text-slate-500">Therapeutic modalities, target frequencies and duration</p>
            </div>
            <Btn variant={patient.treatment ? "default" : "primary"} onClick={openTreatmentModal}>
              <Plus size={15} /> {patient.treatment ? "Edit Treatment Plan" : "Create Plan"}
            </Btn>
          </div>

          {patient.treatment ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 pl-4 pr-4">Prescribed Modality</th>
                      <th className="py-3 pr-4">Target Frequency</th>
                      <th className="py-3 pr-4">Session Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {patient.treatment.plan.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-3.5 pl-4 pr-4 font-bold text-slate-800">{r.treatment}</td>
                        <td className="py-3.5 pr-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                            {r.frequency}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 font-medium text-slate-600">{r.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Start Date</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{patient.treatment.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Estimated Completion</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{patient.treatment.endDate || "Ongoing"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Planned Sessions</span>
                  <span className="font-bold text-teal-700 text-sm">{patient.treatment.plannedSessions} Sessions Total</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No treatment plan configured yet.
            </div>
          )}
        </Card>
      )}

      {tab === "Sessions History" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Clinical Session Logs</h2>
              <p className="text-xs text-slate-500">Record of therapeutic interventions and pain response</p>
            </div>
            <Btn variant="primary" onClick={() => setSessionOpen(true)}>
              <Plus size={15} /> Log New Session
            </Btn>
          </div>

          {patient.sessions.length === 0 && (
            <Card className="py-12 text-center text-slate-400">
              No treatment sessions logged yet.
            </Card>
          )}

          <div className="space-y-3">
            {[...patient.sessions].reverse().map((s, i) => {
              const delta = s.painBefore - s.painAfter;
              return (
                <Card key={s.id} hover className="border-l-4 border-l-teal-600">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-base text-slate-900">
                        Session #{patient.sessions.length - i}
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {s.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        ⏱ {s.duration} mins
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${delta > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}>
                        {delta > 0 ? `↓ ${delta} pts Pain Relief` : "Pain Stable"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Pain Score Response</span>
                      <div className="flex items-center gap-3 font-semibold text-slate-700">
                        <span>Before: <b className="text-rose-600">{s.painBefore}/10</b></span>
                        <span>→</span>
                        <span>After: <b className="text-emerald-600">{s.painAfter}/10</b></span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Therapeutic Intervention Given</span>
                      <span className="font-bold text-slate-900">{s.treatmentGiven}</span>
                    </div>
                  </div>

                  {s.notes && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                      <b className="text-slate-800">Therapist Notes:</b> {s.notes}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {(tab === "Recovery Progress" || tab === "Recovery Progress Graph") && (
        <Card>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Pain Trend & Rehabilitation Velocity</h2>
              <p className="text-xs text-slate-500">Longitudinal pain score trajectory across logged sessions</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              📈 Recovery Trajectory Active
            </span>
          </div>

          {patient.sessions.length > 0 ? (
            <div className="space-y-6">
              <div className="w-full bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
                <svg viewBox="0 0 500 180" className="w-full h-48 overflow-visible">
                  <defs>
                    <linearGradient id="painGradApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {[0, 2, 4, 6, 8, 10].map((v) => {
                    const y = 150 - (v / 10) * 130;
                    return (
                      <g key={v}>
                        <line x1="40" y1={y} x2="480" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                        <text x="25" y={y + 4} fontSize="10" fill="#94A3B8" fontWeight="bold">{v}</text>
                      </g>
                    );
                  })}

                  <polygon
                    fill="url(#painGradApp)"
                    points={`40,150 ${patient.sessions.map((s, i) => {
                      const x = 50 + i * (420 / Math.max(patient.sessions.length - 1, 1));
                      const y = 150 - (s.painAfter / 10) * 130;
                      return `${x},${y}`;
                    }).join(" ")} ${50 + (patient.sessions.length - 1) * (420 / Math.max(patient.sessions.length - 1, 1))},150`}
                  />

                  <polyline
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={patient.sessions.map((s, i) => {
                      const x = 50 + i * (420 / Math.max(patient.sessions.length - 1, 1));
                      const y = 150 - (s.painAfter / 10) * 130;
                      return `${x},${y}`;
                    }).join(" ")}
                  />

                  {patient.sessions.map((s, i) => {
                    const x = 50 + i * (420 / Math.max(patient.sessions.length - 1, 1));
                    const y = 150 - (s.painAfter / 10) * 130;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="6" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                        <text x={x} y={y - 12} fontSize="11" fill="#0F172A" fontWeight="bold" textAnchor="middle">
                          {s.painAfter}/10
                        </text>
                        <text x={x} y={168} fontSize="10" fill="#64748B" fontWeight="600" textAnchor="middle">
                          S#{i + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Initial Pain Baseline</span>
                  <div className="text-2xl font-display font-bold text-rose-600 mt-1">
                    {patient.sessions[0].painBefore}/10
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Current Pain Level</span>
                  <div className="text-2xl font-display font-bold text-teal-600 mt-1">
                    {patient.sessions[patient.sessions.length - 1].painAfter}/10
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-700 font-bold uppercase">Total Pain Improvement</span>
                  <div className="text-2xl font-display font-bold text-emerald-700 mt-1">
                    ↓ {patient.sessions[0].painBefore - patient.sessions[patient.sessions.length - 1].painAfter} Points
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Log at least one session to populate the visual recovery trajectory chart.
            </div>
          )}
        </Card>
      )}

      <Modal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        title="Log Therapy Session"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setSessionOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveSession}>Save Session Record</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pain Level Before (0–10)" required>
            <Input type="number" min="0" max="10" value={sf.painBefore} onChange={(e) => setSf({ ...sf, painBefore: Number(e.target.value) })} />
          </Field>
          <Field label="Pain Level After (0–10)" required>
            <Input type="number" min="0" max="10" value={sf.painAfter} onChange={(e) => setSf({ ...sf, painAfter: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Treatment / Modality Performed" required>
          <Input value={sf.treatmentGiven} onChange={(e) => setSf({ ...sf, treatmentGiven: e.target.value })} placeholder="e.g. Lumbar Mobilization + McKenzie Extension" />
        </Field>
        <Field label="Session Duration (Minutes)">
          <Input type="number" value={sf.duration} onChange={(e) => setSf({ ...sf, duration: Number(e.target.value) })} />
        </Field>
        <Field label="Clinical Observations & Notes">
          <TextArea value={sf.notes} onChange={(e) => setSf({ ...sf, notes: e.target.value })} placeholder="Patient response, tolerance, home exercises prescribed..." />
        </Field>
      </Modal>

      <Modal
        open={assessmentOpen}
        onClose={() => setAssessmentOpen(false)}
        title={patient.assessment ? "Edit Clinical Assessment" : "Record Initial Assessment"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setAssessmentOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveAssessment}>Save Assessment</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Chief Problem / Complaint" required>
            <Input value={af.mainComplaint} onChange={(e) => setAf({ ...af, mainComplaint: e.target.value })} placeholder="e.g. Chronic lower back pain" />
          </Field>
          <Field label="Body Part / Region" required>
            <Input value={af.bodyPart} onChange={(e) => setAf({ ...af, bodyPart: e.target.value })} placeholder="e.g. Lumbar Spine" />
          </Field>
          <Field label="Onset / Duration">
            <Input value={af.onset} onChange={(e) => setAf({ ...af, onset: e.target.value })} placeholder="e.g. 3 weeks ago" />
          </Field>
          <Field label="Baseline Pain Score (0–10)">
            <Input type="number" min="0" max="10" value={af.painLevel} onChange={(e) => setAf({ ...af, painLevel: Number(e.target.value) })} />
          </Field>
          <Field label="Pain Characteristic">
            <Input value={af.painType} onChange={(e) => setAf({ ...af, painType: e.target.value })} placeholder="e.g. Dull ache, sharp on flexion" />
          </Field>
          <Field label="Range of Motion (ROM)">
            <Input value={af.rangeOfMotion} onChange={(e) => setAf({ ...af, rangeOfMotion: e.target.value })} placeholder="e.g. Forward flexion 60%" />
          </Field>
          <Field label="Muscle Strength (MMT)">
            <Input value={af.muscleStrength} onChange={(e) => setAf({ ...af, muscleStrength: e.target.value })} placeholder="e.g. Core Strength 3/5" />
          </Field>
          <Field label="Postural Alignment">
            <Input value={af.posture} onChange={(e) => setAf({ ...af, posture: e.target.value })} placeholder="e.g. Anterior pelvic tilt" />
          </Field>
        </div>
        <Field label="Definitive Clinical Diagnosis" required>
          <Input value={af.diagnosis} onChange={(e) => setAf({ ...af, diagnosis: e.target.value })} placeholder="e.g. Mechanical Lower Back Pain (Non-specific)" />
        </Field>
      </Modal>

      <Modal
        open={treatmentOpen}
        onClose={() => setTreatmentOpen(false)}
        title={patient.treatment ? "Edit Rehabilitation Plan" : "Create Rehabilitation Plan"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setTreatmentOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveTreatment}>Save Rehabilitation Plan</Btn>
          </>
        }
      >
        <div className="mb-3">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Prescribed Modalities</label>
          <div className="space-y-2">
            {tf.plan.map((row, i) => (
              <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-2 items-center">
                <Input placeholder="Modality (e.g. Manual Therapy)" value={row.treatment} onChange={(e) => updatePlanRow(i, "treatment", e.target.value)} />
                <Input placeholder="Freq (e.g. 3× weekly)" value={row.frequency} onChange={(e) => updatePlanRow(i, "frequency", e.target.value)} />
                <Input placeholder="Duration (e.g. 20 min)" value={row.duration} onChange={(e) => updatePlanRow(i, "duration", e.target.value)} />
                <button
                  type="button"
                  onClick={() => removePlanRow(i)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 border border-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPlanRow}
            className="mt-2 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus size={14} /> Add Another Modality Row
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <Field label="Start Date">
            <Input type="date" value={tf.startDate} onChange={(e) => setTf({ ...tf, startDate: e.target.value })} />
          </Field>
          <Field label="Target End Date">
            <Input type="date" value={tf.endDate} onChange={(e) => setTf({ ...tf, endDate: e.target.value })} />
          </Field>
          <Field label="Total Sessions">
            <Input type="number" value={tf.plannedSessions} onChange={(e) => setTf({ ...tf, plannedSessions: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ APPOINTMENTS PAGE ============ */
function AppointmentsPage({ role, doctors, doctorMe, patients, appts, addAppt, setApptStatus }) {
  const isAdmin = role === "admin";
  const scoped = isAdmin ? appts : appts.filter((a) => a.doctorId === doctorMe.id);
  const [open, setOpen] = useState(false);
  const empty = { patientId: "", doctorId: isAdmin ? "" : (doctorMe?.id || 1), date: today, time: "09:00", treatmentType: "Manual Therapy", notes: "" };
  const [form, setForm] = useState(empty);
  const [cancelTarget, setCancelTarget] = useState(null);

  const visiblePatients = isAdmin ? patients : patients.filter((p) => p.doctorId === doctorMe.id);

  function save() {
    addAppt({ ...form, patientId: Number(form.patientId), doctorId: Number(form.doctorId) });
    setForm(empty);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Appointment Management</div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {isAdmin ? "Clinic-Wide Appointments" : "My Appointment Schedule"}
          </h1>
        </div>
        <Btn variant="primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Schedule New Appointment
        </Btn>
      </div>

      <Card className="!p-0 overflow-hidden">
        <ApptTable
          appts={scoped}
          patients={patients}
          doctors={doctors}
          showDoctor={isAdmin}
          actions={(a) =>
            a.status === "Scheduled" ? (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  title="Mark Completed"
                  onClick={() => setApptStatus(a.id, "Completed")}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button
                  title="Cancel Appointment"
                  onClick={() => setCancelTarget(a)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <X size={14} />
                </button>
                <button
                  title="Reschedule (+1 Day Demo)"
                  onClick={() => setApptStatus(a.id, "Scheduled")}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">—</span>
            )
          }
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule Clinic Appointment"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={!form.patientId || (isAdmin && !form.doctorId)} onClick={save}>Confirm Booking</Btn>
          </>
        }
      >
        <Field label="Select Patient" required>
          <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
            <option value="">Choose a patient from directory…</option>
            {visiblePatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) — {p.assessment?.bodyPart || "Care"}
              </option>
            ))}
          </Select>
        </Field>

        {isAdmin && (
          <Field label="Assign Attending Physiotherapist" required>
            <Select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
              <option value="">Select a doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Appointment Date" required>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Time Slot" required>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
        </div>

        <Field label="Treatment Modality">
          <Select value={form.treatmentType} onChange={(e) => setForm({ ...form, treatmentType: e.target.value })}>
            <option>Manual Therapy</option>
            <option>Strength Training</option>
            <option>Stretching & Mobilization</option>
            <option>Heat / Cryotherapy</option>
            <option>Comprehensive Follow-up Review</option>
          </Select>
        </Field>

        <Field label="Special Clinical Notes">
          <TextArea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Focus areas, precautions, equipment requirements..." />
        </Field>
      </Modal>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Scheduled Appointment?"
        small
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCancelTarget(null)}>Keep Appointment</Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setApptStatus(cancelTarget.id, "Cancelled");
                setCancelTarget(null);
              }}
            >
              Yes, Cancel It
            </Btn>
          </>
        }
      >
        <div className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to cancel the appointment for{" "}
          <b className="text-slate-900">{patients.find((p) => p.id === cancelTarget?.patientId)?.name}</b> scheduled for{" "}
          <b className="text-slate-900">{cancelTarget?.time}</b> on <b className="text-slate-900">{cancelTarget?.date}</b>?
        </div>
      </Modal>
    </div>
  );
}

/* ============ EXERCISE LIBRARY ============ */
function LibraryPage({ exercises, addExercise }) {
  const [open, setOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [form, setForm] = useState({ name: "", part: "", category: "Strength", desc: "", sets: "", reps: "", duration: "", level: "Beginner" });

  const filtered = exercises.filter((e) => filterCat === "All" || e.category === filterCat);

  function save() {
    addExercise(form);
    setForm({ name: "", part: "", category: "Strength", desc: "", sets: "", reps: "", duration: "", level: "Beginner" });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Physiotherapy Protocols</div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Exercise & Rehabilitation Library</h1>
        </div>
        <Btn variant="primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Add Exercise Template
        </Btn>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["All", "Strength", "Mobility", "Stability", "Posture"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCat === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => (
          <Card key={e.id} hover className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-display font-bold text-base text-slate-900">{e.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {e.category || "Care"}
                </span>
              </div>
              <div className="text-xs font-bold text-teal-700 mb-2.5">{e.part}</div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{e.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2 font-semibold">
                {e.sets && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{e.sets} Sets</span>}
                {e.reps && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{e.reps} Reps</span>}
                {e.duration && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{e.duration}</span>}
              </div>
              <span className="text-[11px] font-bold text-slate-400">{e.level || "Beginner"}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Exercise to Clinical Library"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={!form.name} onClick={save}>Save Exercise</Btn>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Exercise Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Scapular Wall Slides" />
          </Field>
          <Field label="Target Body Region" required>
            <Input value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })} placeholder="e.g. Shoulder / Scapula" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Strength</option>
              <option>Mobility</option>
              <option>Stability</option>
              <option>Posture</option>
            </Select>
          </Field>
          <Field label="Difficulty Level">
            <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>All Levels</option>
            </Select>
          </Field>
          <Field label="Prescribed Sets">
            <Input type="number" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} placeholder="e.g. 3" />
          </Field>
          <Field label="Repetitions">
            <Input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} placeholder="e.g. 12" />
          </Field>
        </div>
        <Field label="Hold / Duration (Optional)">
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 30 sec hold" />
        </Field>
        <Field label="Instructions & Biomechanical Cues">
          <TextArea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Step-by-step form execution instructions..." />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ REPORTS PAGE ============ */
function ReportsPage({ role, patients, doctors }) {
  const isAdmin = role === "admin";
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(routeId || (patients[0]?.id || ""));

  useEffect(() => {
    if (routeId) setSelectedId(routeId);
  }, [routeId]);

  function handleSelect(newId) {
    setSelectedId(newId);
    navigate(newId ? `/reports/${newId}` : "/reports", { replace: true });
  }

  const patient = patients.find((p) => p.id === Number(selectedId));
  const doctor = patient && doctors.find((d) => d.id === patient.doctorId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Documentation</div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {isAdmin ? "Clinic Treatment Reports" : "My Patient Reports"}
          </h1>
        </div>
        {patient && (
          <Btn variant="primary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Export Official PDF
          </Btn>
        )}
      </div>

      <Card>
        <Field label="Select Patient for Formal Clinical Report">
          <Select value={selectedId || ""} onChange={(e) => handleSelect(e.target.value)}>
            <option value="">Choose a patient from records…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code}) — {p.assessment?.diagnosis || p.status}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {patient ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6 print:m-0 print:border-none print:shadow-none">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <div className="text-2xl font-display font-bold text-slate-900">SUNRISE PHYSIOTHERAPY CLINIC</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Comprehensive Musculoskeletal & Rehabilitation Report</div>
              <div className="text-xs text-slate-400 mt-1">Surat, Gujarat · Contact: +91 261 400 1122</div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
                OFFICIAL MEDICAL RECORD
              </span>
              <div className="text-xs text-slate-400 font-mono mt-1">Date: {today}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Patient ID</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{patient.code}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Attending Doctor</span>
              <span className="font-bold text-slate-900 text-sm">{doctor?.name || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block">Registration Date</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{patient.registrationDate}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Clinical Diagnosis & Findings</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
              <div><b className="text-slate-800">Primary Diagnosis:</b> <span className="text-teal-800 font-bold">{patient.assessment?.diagnosis || "Non-specific"}</span></div>
              <div><b className="text-slate-800">Target Region:</b> {patient.assessment?.bodyPart || "—"}</div>
              <div><b className="text-slate-800">Range of Motion:</b> {patient.assessment?.rangeOfMotion || "—"}</div>
              <div><b className="text-slate-800">Muscle Strength Score:</b> {patient.assessment?.muscleStrength || "—"}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Rehabilitation Milestones</h3>
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase block">Sessions Completed</span>
                <span className="font-bold text-base text-slate-800">{patient.sessions.length} of {patient.treatment?.plannedSessions || 10}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase block">Baseline Pain</span>
                <span className="font-bold text-base text-rose-600">{patient.sessions[0]?.painBefore ?? patient.assessment?.painLevel ?? "—"}/10</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold uppercase block">Current Pain Score</span>
                <span className="font-bold text-base text-emerald-600">{patient.sessions[patient.sessions.length - 1]?.painAfter ?? "—"}/10</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
            <div>
              <div className="text-slate-400">Status: <b className="text-slate-800">{patient.status}</b></div>
              <div className="text-slate-400 mt-0.5">Report generated by Recovery Path Clinical Engine</div>
            </div>
            <div className="text-right">
              <div className="w-40 border-b border-slate-400 pb-1 mb-1" />
              <div className="font-bold text-slate-800">{doctor?.name || "Attending Physiotherapist"}</div>
              <div className="text-slate-400 text-[11px]">Authorized Signatory</div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="py-12 text-center text-slate-400">
          Select a patient above to view their comprehensive treatment report.
        </Card>
      )}
    </div>
  );
}

/* ============ SETTINGS ============ */
function SettingsPage() {
  const [reminders, setReminders] = useState(true);
  const [autoFollowUp, setAutoFollowUp] = useState(true);
  const [selfDischarge, setSelfDischarge] = useState(false);

  const Toggle = ({ on, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none flex-shrink-0 cursor-pointer ${on ? "bg-teal-600" : "bg-slate-200"
        }`}
    >
      <span
        className={`w-5 h-5 rounded-full bg-white block absolute top-0.5 transition-transform shadow-sm ${on ? "left-5" : "left-0.5"
          }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">System Administration</div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Clinic Settings & Access Control</h1>
      </div>

      <Card>
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">
          Clinic Profile Information
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Clinic Name</span>
            <span className="font-bold text-slate-800 text-sm">Sunrise Physiotherapy & Rehab Center</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Operating Hours</span>
            <span className="font-bold text-slate-800 text-sm">9:00 AM – 7:00 PM, Mon–Sat</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Official Contact</span>
            <span className="font-bold text-slate-800 text-sm font-mono">+91 261 400 1122</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase block mb-1">Location</span>
            <span className="font-bold text-slate-800 text-sm">Vastrapur / Surat, Gujarat</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">
          Automations & Clinical Rules
        </div>
        <div className="space-y-4 divide-y divide-slate-100 text-xs">
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">SMS & WhatsApp Session Reminders</div>
              <div className="text-slate-400">Automatically notify patients 24 hours prior to their therapy session</div>
            </div>
            <Toggle on={reminders} onClick={() => setReminders(!reminders)} />
          </div>
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">Follow-up Disengagement Flagging</div>
              <div className="text-slate-400">Highlight patients with no logged sessions for 7+ consecutive days</div>
            </div>
            <Toggle on={autoFollowUp} onClick={() => setAutoFollowUp(!autoFollowUp)} />
          </div>
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">Doctor Self-Discharge Authorization</div>
              <div className="text-slate-400">Allow physiotherapists to formally discharge patients without admin sign-off</div>
            </div>
            <Toggle on={selfDischarge} onClick={() => setSelfDischarge(!selfDischarge)} />
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-display font-bold text-base text-slate-900">Role Permissions Matrix</h3>
          <p className="text-xs text-slate-500">Access controls per system role</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 pl-6 pr-4">Capability</th>
              <th className="py-3 pr-4">Clinic Administrator</th>
              <th className="py-3 pr-6">Physiotherapist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {[
              ["View All Clinic Patients & Schedules", "Full Access", "Assigned Patients Only"],
              ["Register & Manage Doctors", "Full Access", "Restricted"],
              ["Create Assessments & Treatment Plans", "Full Access", "Full Access"],
              ["Log Therapy Sessions", "Full Access", "Full Access"],
              ["Generate Official Clinic Reports", "Full Access", "Own Patients"],
              ["Modify Clinic Settings", "Full Access", "Restricted"],
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="py-3.5 pl-6 pr-4 font-bold text-slate-800">{row[0]}</td>
                <td className="py-3.5 pr-4 text-teal-700 font-bold">✓ {row[1]}</td>
                <td className="py-3.5 pr-6 text-slate-600 font-medium">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============ ROUTING HELPERS ============ */
function PatientProfileRoute({ role, patients, doctors, addSession, updateAssessment, updateTreatment }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === Number(id));
  const doctor = patient && doctors.find((d) => d.id === patient.doctorId);
  return (
    <PatientProfile
      patient={patient}
      doctor={doctor}
      addSession={addSession}
      updateAssessment={updateAssessment}
      updateTreatment={updateTreatment}
      isAdmin={role === "admin"}
      goBack={() => navigate("/patients")}
      goToReport={(pid) => navigate(`/reports/${pid}`)}
    />
  );
}

function AdminOnly({ role, children }) {
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function ProtectedLayout({ loggedIn, role, doctorMe, accountName, onLogout, onQuickRoleSwitch }) {
  if (!loggedIn) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar role={role} doctorMe={doctorMe} accountName={accountName} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar role={role} accountName={accountName} doctorMe={doctorMe} onQuickRoleSwitch={onQuickRoleSwitch} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ============ ROOT APP ============ */
export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(true); // default logged in for instant preview
  const [role, setRole] = useState("admin");
  const [accountName, setAccountName] = useState("Priya Shah");
  const [doctorId, setDoctorId] = useState(1);

  const [doctors, setDoctors] = useState(initialDoctors);
  const [patients, setPatients] = useState(initialPatients);
  const [appts, setAppts] = useState(initialAppointments);
  const [exercises, setExercises] = useState(initialExercises);

  const doctorMe = doctors.find((d) => d.id === doctorId) || doctors[0];

  function handleLogin(acc) {
    setRole(acc.role);
    setAccountName(acc.name);
    if (acc.doctorId) setDoctorId(acc.doctorId);
    setLoggedIn(true);
    navigate("/dashboard");
  }

  function handleLogout() {
    setLoggedIn(false);
    navigate("/login");
  }

  function handleQuickRoleSwitch(newRole, targetDocId = 1) {
    setRole(newRole);
    if (newRole === "admin") {
      setAccountName("Priya Shah");
    } else {
      setDoctorId(targetDocId);
      const doc = doctors.find((d) => d.id === targetDocId);
      if (doc) setAccountName(doc.name);
    }
  }

  function addDoctor(form) {
    const id = Math.max(0, ...doctors.map((d) => d.id)) + 1;
    const code = "DR" + String(doctors.length + 1).padStart(3, "0");
    setDoctors([...doctors, { id, code, status: "Active", ...form }]);
  }

  function addPatient(form) {
    const id = Math.max(0, ...patients.map((p) => p.id)) + 1;
    const code = "PT" + String(1000 + patients.length + 1).slice(1);
    setPatients([...patients, {
      id, code, ...form, age: Number(form.age) || null, doctorId: Number(form.doctorId) || 1,
      registrationDate: today, status: "New", assessment: null, treatment: null, sessions: [],
    }]);
  }

  function addSession(patientId, session) {
    setPatients(patients.map((p) => {
      if (p.id !== patientId) return p;
      const nextId = Math.max(0, ...p.sessions.map((s) => s.id)) + 1;
      return { ...p, sessions: [...p.sessions, { id: nextId, ...session }], status: "Ongoing" };
    }));
  }

  function updateAssessment(patientId, assessment) {
    setPatients(patients.map((p) => (p.id === patientId ? { ...p, assessment } : p)));
  }

  function updateTreatment(patientId, treatment) {
    setPatients(patients.map((p) => (p.id === patientId ? { ...p, treatment, status: p.status === "New" ? "Ongoing" : p.status } : p)));
  }

  function addAppt(form) {
    const id = Math.max(0, ...appts.map((a) => a.id)) + 1;
    setAppts([...appts, { id, status: "Scheduled", ...form }]);
  }

  function setApptStatus(id, status) {
    setAppts(appts.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function addExercise(form) {
    const id = Math.max(0, ...exercises.map((e) => e.id)) + 1;
    setExercises([...exercises, { id, ...form }]);
  }

  function goToPatient(id) {
    navigate(`/patients/${id}`);
  }

  const scopedPatients = role === "admin" ? patients : patients.filter((p) => p.doctorId === doctorMe.id);

  return (
    <Routes>
      <Route path="/login" element={loggedIn ? <Navigate to="/dashboard" replace /> : <LoginScreen onLogin={handleLogin} />} />

      <Route element={<ProtectedLayout loggedIn={loggedIn} role={role} doctorMe={doctorMe} accountName={accountName} onLogout={handleLogout} onQuickRoleSwitch={handleQuickRoleSwitch} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard role={role} doctors={doctors} patients={patients} appts={appts} doctorMe={doctorMe} accountName={accountName} goToPatient={goToPatient} onNavigate={(path) => navigate(`/${path}`)} />} />
        <Route path="/doctors" element={<AdminOnly role={role}><DoctorsPage doctors={doctors} patients={patients} addDoctor={addDoctor} /></AdminOnly>} />
        <Route path="/patients" element={<PatientsPage role={role} doctors={doctors} doctorMe={doctorMe} patients={patients} addPatient={addPatient} goToPatient={goToPatient} />} />
        <Route path="/patients/:id" element={<PatientProfileRoute role={role} patients={patients} doctors={doctors} addSession={addSession} updateAssessment={updateAssessment} updateTreatment={updateTreatment} />} />
        <Route path="/appointments" element={<AppointmentsPage role={role} doctors={doctors} doctorMe={doctorMe} patients={patients} appts={appts} addAppt={addAppt} setApptStatus={setApptStatus} />} />
        <Route path="/library" element={<LibraryPage exercises={exercises} addExercise={addExercise} />} />
        <Route path="/reports" element={<ReportsPage role={role} patients={scopedPatients} doctors={doctors} />} />
        <Route path="/reports/:id" element={<ReportsPage role={role} patients={scopedPatients} doctors={doctors} />} />
        <Route path="/settings" element={<AdminOnly role={role}><SettingsPage /></AdminOnly>} />
      </Route>

      <Route path="*" element={<Navigate to={loggedIn ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
