import { createClient } from "@/lib/supabase/server";
import { TherapistsClient } from "@/components/therapists/TherapistsClient";

export default async function TherapistsPage() {
  const supabase = await createClient();
  const { data: therapists } = await supabase
    .from("therapists")
    .select("*, patients(count)")
    .order("name");

  return <TherapistsClient therapists={therapists ?? []} />;
}
