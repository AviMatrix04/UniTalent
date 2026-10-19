import type { Metadata } from "next";
import { connection } from "next/server";

import { ServiceForm } from "@/components/services/service-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Offer a service" };

export const instant = false;

export default async function NewServicePage() {
  await connection();
  const supabase = await createClient();
  const { data: skills, error } = await supabase
    .from("skills")
    .select("name")
    .eq("is_hidden", false)
    .order("normalized_name")
    .limit(100);

  if (error) throw new Error("Unable to load available skills.");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <ServiceForm
        availableSkills={(skills ?? []).map((skill) => skill.name)}
        initialFields={{
          title: "",
          description: "",
          price: "",
          priceUnit: "hour",
        }}
        mode="create"
      />
    </main>
  );
}
