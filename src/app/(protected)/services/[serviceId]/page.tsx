import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PortfolioLightbox } from "@/components/services/portfolio-lightbox";
import { contactHref, SERVICE_IMAGE_BUCKET } from "@/lib/services/portfolio";
import { AVATAR_BUCKET } from "@/lib/profile/avatar";
import { formatServicePrice, isPricingUnit } from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Service details" };
export const instant = false;

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  await connection();
  const { serviceId } = await params;
  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from("services")
    .select(
      "id,student_id,title,description,price_cents,price_unit,status,published_at",
    )
    .eq("id", serviceId)
    .maybeSingle();
  if (error || !service) notFound();

  const [profileResult, contactsResult, skillsResult, imagesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name,bio,avatar_path")
        .eq("id", service.student_id)
        .single(),
      supabase
        .from("contact_methods")
        .select("type,value")
        .eq("profile_id", service.student_id)
        .eq("is_visible", true)
        .order("type"),
      supabase
        .from("service_skills")
        .select("position,skills(name)")
        .eq("service_id", service.id)
        .order("position"),
      supabase
        .from("portfolio_items")
        .select("id,storage_path,caption,is_cover,sort_order")
        .eq("service_id", service.id)
        .order("sort_order"),
    ]);
  if (
    profileResult.error ||
    !profileResult.data ||
    contactsResult.error ||
    skillsResult.error ||
    imagesResult.error
  )
    notFound();

  const images = await Promise.all(
    (imagesResult.data ?? []).map(async (item) => {
      const { data } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .createSignedUrl(item.storage_path, 60 * 60);
      return { ...item, signedUrl: data?.signedUrl ?? "" };
    }),
  );
  images.sort(
    (left, right) =>
      Number(right.is_cover) - Number(left.is_cover) ||
      left.sort_order - right.sort_order,
  );
  const skills = (skillsResult.data ?? []).flatMap((link) => {
    const related = link.skills as
      { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(related) ? related[0]?.name : related?.name;
    return name ? [name] : [];
  });
  const unit = isPricingUnit(service.price_unit) ? service.price_unit : "hour";
  const profile = profileResult.data;
  const avatarResult = profile.avatar_path
    ? await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(profile.avatar_path, 15 * 60)
    : null;
  const avatarUrl = avatarResult?.data?.signedUrl ?? null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
        href="/explore"
      >
        <ArrowLeft className="size-4" />
        Back to explore
      </Link>
      <div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <section>
          {images.length ? (
            <PortfolioLightbox images={images} serviceTitle={service.title} />
          ) : (
            <div className="flex aspect-[16/8] items-center justify-center rounded-3xl bg-secondary text-sm text-muted-foreground">
              Portfolio images coming soon
            </div>
          )}

          <p className="mt-9 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {service.status === "published"
              ? "Available on campus"
              : service.status}
          </p>
          <h1 className="mt-3 font-heading text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
            {service.title}
          </h1>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-muted-foreground">
            {service.description}
          </p>
          {skills.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-muted px-3 py-2 text-xs font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Starting at
            </p>
            <p className="mt-2 font-heading text-4xl">
              {formatServicePrice(service.price_cents, unit)}
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <Link
                className="flex items-center gap-3"
                href={`/students/${service.student_id}`}
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                  {avatarUrl ? (
                    <Image
                      alt={`${profile.full_name ?? "Student"} profile photo`}
                      className="object-cover"
                      fill
                      sizes="48px"
                      src={avatarUrl}
                    />
                  ) : (
                    <UserRound className="size-5" />
                  )}
                </span>
                <span>
                  <strong className="block">
                    {profile.full_name ?? "SDSU student"}
                  </strong>
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <BadgeCheck className="size-3.5" />
                    Verified student
                  </span>
                </span>
              </Link>
              {profile.bio ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {profile.bio}
                </p>
              ) : null}
            </div>
            <div className="mt-6 space-y-2">
              {(contactsResult.data ?? []).map((contact) => {
                const Icon =
                  contact.type === "email"
                    ? Mail
                    : contact.type === "phone"
                      ? Phone
                      : ExternalLink;
                return contact.type === "phone" ? (
                  <div
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                    key={contact.type}
                  >
                    <Icon className="size-4" />
                    {contact.value}
                  </div>
                ) : (
                  <a
                    key={contact.type}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                    href={contactHref(contact.type, contact.value)}
                    rel="noreferrer"
                    target={
                      contact.type === "instagram" ||
                      contact.type === "linkedin"
                        ? "_blank"
                        : undefined
                    }
                  >
                    <Icon className="size-4" />
                    Contact via {contact.type}
                  </a>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
