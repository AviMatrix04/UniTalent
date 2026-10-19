import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { ServiceForm } from "@/components/services/service-form";
import {
  PortfolioManager,
  type PortfolioItem,
} from "@/components/services/portfolio-manager";
import { ServiceCelebration } from "@/components/services/service-celebration";
import { ToastMessage } from "@/components/ui/toast-message";
import { SERVICE_IMAGE_BUCKET } from "@/lib/services/portfolio";
import { centsToUsdInput, isPricingUnit } from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit service" };
export const instant = false;

type EditServicePageProps = {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ celebrate?: string; message?: string }>;
};

export default async function EditServicePage({
  params,
  searchParams,
}: EditServicePageProps) {
  await connection();
  const [{ serviceId }, { celebrate, message }] = await Promise.all([
    params,
    searchParams,
  ]);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect(`/auth/login?next=/services/${serviceId}/edit`);

  const [
    serviceResult,
    availableSkillsResult,
    selectedSkillsResult,
    portfolioResult,
    profileResult,
    contactsResult,
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id,title,description,price_cents,price_unit,status")
      .eq("id", serviceId)
      .eq("student_id", userId)
      .maybeSingle(),
    supabase
      .from("skills")
      .select("name")
      .eq("is_hidden", false)
      .order("normalized_name")
      .limit(100),
    supabase
      .from("service_skills")
      .select("position,skills(name)")
      .eq("service_id", serviceId)
      .order("position"),
    supabase
      .from("portfolio_items")
      .select(
        "id,storage_path,caption,mime_type,size_bytes,sort_order,is_cover",
      )
      .eq("service_id", serviceId)
      .order("sort_order"),
    supabase.from("profiles").select("full_name,bio").eq("id", userId).single(),
    supabase
      .from("contact_methods")
      .select("id")
      .eq("profile_id", userId)
      .eq("is_visible", true)
      .limit(1),
  ]);

  const { data: service, error } = serviceResult;

  if (
    error ||
    !service ||
    service.status === "hidden" ||
    availableSkillsResult.error ||
    selectedSkillsResult.error ||
    portfolioResult.error ||
    profileResult.error ||
    contactsResult.error
  ) {
    notFound();
  }

  const initialSkills = (selectedSkillsResult.data ?? [])
    .map((link) => {
      const related = link.skills as
        { name?: string } | { name?: string }[] | null;
      return Array.isArray(related) ? related[0]?.name : related?.name;
    })
    .filter((name): name is string => Boolean(name));

  const priceUnit = isPricingUnit(service.price_unit)
    ? service.price_unit
    : "hour";
  const status =
    service.status === "published" || service.status === "archived"
      ? service.status
      : "draft";
  const orderedSkills = [...(availableSkillsResult.data ?? [])].sort(
    (left, right) => {
      if (left.name.toLowerCase() === "other") return 1;
      if (right.name.toLowerCase() === "other") return -1;
      return left.name.localeCompare(right.name);
    },
  );
  const portfolioItems = await Promise.all(
    (portfolioResult.data ?? []).map(async (item) => {
      const { data } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .createSignedUrl(item.storage_path, 60 * 60);
      return { ...item, signedUrl: data?.signedUrl ?? "" } as PortfolioItem;
    }),
  );
  const previewImageUrl =
    portfolioItems.find((item) => item.is_cover)?.signedUrl ||
    portfolioItems[0]?.signedUrl ||
    null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <ToastMessage message={message} />
      <ServiceCelebration
        kind={celebrate === "draft" ? "draft" : undefined}
        serviceId={serviceId}
      />
      <ServiceForm
        availableSkills={orderedSkills.map((skill) => skill.name)}
        initialFields={{
          title: service.title,
          description: service.description,
          price: centsToUsdInput(service.price_cents),
          priceUnit,
        }}
        mode="edit"
        initialSkills={initialSkills}
        listingContext={{
          hasCover: portfolioItems.some((item) => item.is_cover),
          portfolioCount: portfolioItems.length,
          profileReady: Boolean(
            profileResult.data.full_name &&
            profileResult.data.bio &&
            contactsResult.data?.length,
          ),
        }}
        serviceId={service.id}
        status={status}
        previewImageUrl={previewImageUrl}
      />
      <PortfolioManager
        initialItems={portfolioItems}
        serviceId={service.id}
        userId={userId}
      />
    </main>
  );
}
