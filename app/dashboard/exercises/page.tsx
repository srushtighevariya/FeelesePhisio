import { createClient } from "@/lib/supabase/server";
import { ExercisesClient } from "@/components/exercises/ExercisesClient";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("name");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A]">Exercise Library</h2>
          <p className="text-sm text-[#9B9B9B]">{exercises?.length ?? 0} exercises</p>
        </div>
      </div>
      <ExercisesClient exercises={exercises ?? []} />
    </div>
  );
}
