"use client";

import { useState, useTransition } from "react";
import { addExercise } from "@/lib/actions/exercises";
import { Plus, Search, Dumbbell, X, Check } from "lucide-react";

const LEVELS: Record<string, string> = {
  Beginner:     "badge-completed",
  Intermediate: "badge-scheduled",
  Advanced:     "badge-cancelled",
};

export function ExercisesClient({ exercises: initial }: { exercises: any[] }) {
  const [exercises, setExercises] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: "",
    category: "Spine & Core",
    body_part: "Lumbar Spine",
    sets: "3",
    reps: "12",
    duration_min: "15",
    level: "Beginner",
    description: "",
  });

  const categories = ["All", "Spine & Core", "Knee & Lower Limb", "Shoulder & Upper Limb", "Neck & Cervical", "Hip & Pelvis"];

  const filtered = exercises.filter((e) => {
    const matchQ   = !q || e.name.toLowerCase().includes(q.toLowerCase()) || (e.body_part && e.body_part.toLowerCase().includes(q.toLowerCase()));
    const matchCat = cat === "All" || e.category === cat;
    return matchQ && matchCat;
  });

  const saveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const ex = await addExercise({
        name:         form.name,
        category:     form.category || null,
        body_part:    form.body_part || null,
        sets:         form.sets ? Number(form.sets) : null,
        reps:         form.reps ? Number(form.reps) : null,
        duration_min: form.duration_min ? Number(form.duration_min) : null,
        level:        (form.level as any) || null,
        description:  form.description || null,
      });
      setExercises((prev) => [...prev, ex]);
      setShowModal(false);
      setForm({ name: "", category: "Spine & Core", body_part: "Lumbar Spine", sets: "3", reps: "12", duration_min: "15", level: "Beginner", description: "" });
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Exercise Library</h1>
          <p className="body-sm mt-0.5">{exercises.length} prescribed physiotherapy rehabilitation routines</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus size={15} /> Add New Exercise
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-white p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises by name or body region…"
            className="input-base pl-9 text-xs"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
                cat === c
                  ? "bg-dark text-white shadow-sm"
                  : "bg-[#DDD5C7] text-[#4B4B4B] hover:bg-[#CFC8BA]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((e) => {
          const badgeCls = LEVELS[e.level] || "badge-completed";
          return (
            <div
              key={e.id}
              className="card-white p-5 hover:shadow-panel transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                      <Dumbbell size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A] text-sm leading-tight">{e.name}</h3>
                      <p className="text-xs text-accent font-medium mt-0.5">{e.body_part || "General Rehab"}</p>
                    </div>
                  </div>
                  <span className={`${badgeCls} text-[11px]`}>
                    {e.level || "Beginner"}
                  </span>
                </div>

                <p className="text-xs text-[#4B4B4B] leading-relaxed line-clamp-2 mb-4">
                  {e.description || "Supervised clinical rehabilitation exercise."}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E8E4DB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#1A1A1A]">
                  {e.sets && e.reps ? (
                    <span>{e.sets} sets × {e.reps} reps</span>
                  ) : e.duration_min ? (
                    <span>{e.duration_min} mins</span>
                  ) : (
                    <span>Daily protocol</span>
                  )}
                </div>
                <span className="text-[11px] text-[#9B9B9B] font-medium">{e.category || "Physiotherapy"}</span>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <div className="col-span-3 text-center py-16 card-white">
            <Dumbbell size={36} className="mx-auto text-[#D4CFC6] mb-2" />
            <p className="font-semibold text-[#1A1A1A] text-sm">No exercises found.</p>
            <p className="text-xs text-[#9B9B9B] mt-1">Try changing your search query or add a new exercise.</p>
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-white max-w-lg w-full p-6 space-y-5 animate-fade-in shadow-panel border border-[#D4CFC6]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <Dumbbell size={18} />
                </div>
                <h3 className="heading-sm">Add New Protocol Exercise</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full text-[#9B9B9B] hover:text-[#1A1A1A] hover:bg-[#DDD5C7] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                  Exercise Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Quad Sets, McKenzie Lumbar Extensions"
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Body Region</label>
                  <input
                    value={form.body_part}
                    onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                    placeholder="e.g. Lumbar Spine, Knee"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-base cursor-pointer"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Sets</label>
                  <input
                    type="number"
                    min={1}
                    value={form.sets}
                    onChange={(e) => setForm({ ...form, sets: e.target.value })}
                    className="input-base text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Reps</label>
                  <input
                    type="number"
                    min={1}
                    value={form.reps}
                    onChange={(e) => setForm({ ...form, reps: e.target.value })}
                    className="input-base text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Difficulty</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="input-base cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Clinical Instructions & Technique</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Patient posture cues, breath instructions, contraindications…"
                  className="input-base resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 btn-primary text-xs"
                >
                  {pending ? "Saving…" : "Save Exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ExercisesClient;
