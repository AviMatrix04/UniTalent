import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { ServiceForm } from "@/components/services/service-form";
import { centsToUsdInput, isPricingUnit } from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit service" };
export const instant = false;

type EditServicePageProps = {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ message?: string }>;
};

export default async function EditServicePage({
  params,
  searchParams,
}: EditServicePageProps) {
  await connection();
  const [{ serviceId }, { message }] = await Promise.all([
    params,
    searchParams,
  ]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect(`/auth/login?next=/services/${serviceId}/edit`);

  const { data: service, error } = await supabase
    .from("services")
    .select("id,title,description,price_cents,price_unit,status")
    .eq("id", serviceId)
    .eq("student_id", userId)
    .maybeSingle();

  if (error || !service || service.status === "hidden") notFound();

  const priceUnit = isPricingUnit(service.price_unit)
    ? service.price_unit
    : "hour";
  const status =
    service.status === "published" || service.status === "archived"
      ? service.status
      : "draft";

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <ServiceForm
        initialFields={{
          title: service.title,
          description: service.description,
          price: centsToUsdInput(service.price_cents),
          priceUnit,
        }}
        message={message}
        mode="edit"
        serviceId={service.id}
        status={status}
      />
    </main>
  );
}
