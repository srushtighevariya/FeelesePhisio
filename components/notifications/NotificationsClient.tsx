"use client";

import { useState, useTransition } from "react";
import { logNotification } from "@/lib/actions/notifications";
import { Send, MessageSquare, Smartphone, Bell, X, ExternalLink } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  WhatsApp: <MessageSquare size={14} className="text-[#25D366]" />,
  SMS:      <Smartphone    size={14} className="text-blue-600" />,
  Reminder: <Send          size={14} className="text-accent" />,
  Appointment: <Bell       size={14} className="text-purple-600" />,
};

export function AdminNotificationsClient({ logs, patients }: { logs: any[]; patients: any[] }) {
  const [list, setList] = useState(logs);
  const [form, setForm] = useState({ type: "WhatsApp", patient_id: "", message: "" });
  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();

  const selectedPatient = patients.find((p) => p.id === form.patient_id);

  const send = () => {
    start(async () => {
      await logNotification({
        type:       form.type,
        patient_id: form.patient_id || null,
        message:    form.message || null,
      });
      const patientName = patients.find((p) => p.id === form.patient_id)?.name;
      setList([{
        id: Date.now().toString(),
        type: form.type,
        message: form.message,
        sent_at: new Date().toISOString(),
        patients: patientName ? { name: patientName } : null,
        therapists: null,
      }, ...list]);
      setShowForm(false);
      setForm({ type: "WhatsApp", patient_id: "", message: "" });
    });
  };

  const whatsappCount = list.filter((n) => n.type === "WhatsApp").length;
  const inAppCount = list.filter((n) => n.type === "Appointment" || n.type === "Reminder").length;
  const smsCount = list.filter((n) => n.type === "SMS").length;

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Purpose Overview & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-900 mb-0.5">Admin Dispatch &amp; Notification Control</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Central communication bridge for your clinic: automatically streams real-time appointment alerts to therapists&apos; dashboards (via the bell feed) and allows direct WhatsApp/SMS reminders to patients on their phones.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary shrink-0 text-xs"
            >
              <Send size={14} /> Compose Patient Follow-up
            </button>
          </div>
        </div>

        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{inAppCount}</p>
            <p className="text-xs text-[#9B9B9B]">Therapist In-App Alerts</p>
          </div>
        </div>

        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{whatsappCount}</p>
            <p className="text-xs text-[#9B9B9B]">WhatsApp Dispatches</p>
          </div>
        </div>

        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Smartphone size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{smsCount}</p>
            <p className="text-xs text-[#9B9B9B]">SMS Sent</p>
          </div>
        </div>

        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Send size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{list.length}</p>
            <p className="text-xs text-[#9B9B9B]">Total System Dispatches</p>
          </div>
        </div>
      </div>


      {/* Manual Send Form */}
      {showForm && (
        <div className="card-white p-5 space-y-4 animate-fade-in shadow-panel border border-[#D4CFC6]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DB]">
            <h3 className="heading-sm text-sm">Send WhatsApp / SMS to Patient</h3>
            <button
              onClick={() => setShowForm(false)}
              className="w-7 h-7 rounded-full text-[#9B9B9B] hover:text-[#1A1A1A] hover:bg-[#DDD5C7] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Channel</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-base cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp Business</option>
                <option value="SMS">SMS Gateway</option>
                <option value="Reminder">In-App Reminder</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Recipient Patient</label>
              <select
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="input-base cursor-pointer"
              >
                <option value="">Choose patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Message Content</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={2}
              placeholder="e.g. Friendly reminder: You have a physiotherapy appointment tomorrow at 10:00 AM. Please be on time."
              className="input-base resize-none"
            />
          </div>

          {/* Quick WhatsApp link if patient has phone */}
          {form.type === "WhatsApp" && selectedPatient?.phone && form.message && (
            <a
              href={`https://wa.me/91${selectedPatient.phone.replace(/\D/g, "")}?text=${encodeURIComponent(form.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#25D366] font-semibold hover:underline"
            >
              <ExternalLink size={12} />
              Open WhatsApp for {selectedPatient.name} →
            </a>
          )}

          <div className="flex gap-2.5">
            <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-xs">
              Cancel
            </button>
            <button
              onClick={send}
              disabled={pending}
              className="flex-1 btn-primary text-xs"
            >
              {pending ? "Sending…" : "Log & Send Notification"}
            </button>
          </div>
        </div>
      )}

      {/* Notification Activity Log */}
      <div className="card-white p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8E4DB] flex items-center justify-between">
          <div>
            <h3 className="heading-sm text-sm">Full Activity Log</h3>
            <p className="text-xs text-[#9B9B9B] mt-0.5">All notifications sent — auto and manual</p>
          </div>
          <span className="text-xs text-[#9B9B9B] font-medium">{list.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>Recipient</th>
                <th>Message</th>
                <th className="text-right font-mono">When</th>
              </tr>
            </thead>
            <tbody>
              {list.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium bg-[#EDE9E1] border border-[#D4CFC6]/60">
                      {TYPE_ICONS[log.type] || <Bell size={14} className="text-[#9B9B9B]" />}
                      <span>{log.type}</span>
                    </span>
                  </td>
                  <td className="font-semibold text-[#1A1A1A]">
                    {(log.patients as any)?.name ?? (log.therapists as any)?.name ?? "System"}
                  </td>
                  <td className="text-[#4B4B4B] max-w-md truncate">
                    {log.message || "Notification dispatched"}
                  </td>
                  <td className="text-right font-mono text-[#9B9B9B] text-xs">
                    {log.sent_at
                      ? new Date(log.sent_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "Recent"}
                  </td>
                </tr>
              ))}

              {!list.length && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#9B9B9B]">
                    <Bell size={28} className="mx-auto text-[#D4CFC6] mb-2" />
                    <p className="font-semibold text-[#1A1A1A] text-sm">No notifications logged yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export { AdminNotificationsClient as NotificationsClient };
export default AdminNotificationsClient;
