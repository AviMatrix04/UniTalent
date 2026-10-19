import { ArrowLeft, BadgeCheck, ExternalLink, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { contactHref } from "@/lib/services/portfolio";
import { AVATAR_BUCKET } from "@/lib/profile/avatar";
import { formatServicePrice, isPricingUnit } from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Student profile" };
export const instant = false;

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await connection();
  const { studentId } = await params;
  const supabase = await createClient();
  const [profileResult, contactsResult, servicesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,bio,avatar_path")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("contact_methods")
      .select("type,value")
      .eq("profile_id", studentId)
      .eq("is_visible", true)
      .order("type"),
    supabase
      .from("services")
      .select("id,title,description,price_cents,price_unit")
      .eq("student_id", studentId)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ]);
  if (
    profileResult.error ||
    !profileResult.data ||
    contactsResult.error ||
    servicesResult.error
  )
    notFound();
  const profile = profileResult.data;
  const avatarResult = profile.avatar_path
    ? await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(profile.avatar_path, 15 * 60)
    : null;
  const avatarUrl = avatarResult?.data?.signedUrl ?? null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
        href="/explore"
      >
        <ArrowLeft className="size-4" />
        Back to explore
      </Link>
      <section className="mt-7 rounded-[2rem] bg-primary px-7 py-10 text-primary-foreground sm:px-10">
        <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary-foreground/10 font-heading text-2xl">
          {avatarUrl ? (
            <Image
              alt={`${profile.full_name ?? "Student"} profile photo`}
              className="object-cover"
              fill
              priority
              sizes="64px"
              src={avatarUrl}
            />
          ) : (
            (profile.full_name ?? "S")
              .split(/\s+/)
              .slice(0, 2)
              .map((part: string) => part[0])
              .join("")
              .toUpperCase()
          )}
        </div>
        <h1 className="mt-6 font-heading text-5xl tracking-[-0.04em]">
          {profile.full_name ?? "SDSU student"}
        </h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-primary-foreground/70">
          <BadgeCheck className="size-4" />
          Verified SDSU student
        </p>
        {profile.bio ? (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-primary-foreground/75">
            {profile.bio}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-2">
          {(contactsResult.data ?? []).map((contact) => {
            const Icon =
              contact.type === "email"
                ? Mail
                : contact.type === "phone"
                  ? Phone
                  : ExternalLink;
            return contact.type === "phone" ? (
              <span
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-foreground px-4 text-sm font-bold text-primary"
                key={contact.type}
              >
                <Icon className="size-4" />
                {contact.value}
              </span>
            ) : (
              <a
                key={contact.type}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-foreground px-4 text-sm font-bold text-primary"
                href={contactHref(contact.type, contact.value)}
                rel="noreferrer"
                target={
                  contact.type === "instagram" || contact.type === "linkedin"
                    ? "_blank"
                    : undefined
                }
              >
                <Icon className="size-4" />
                {contact.type}
              </a>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Services
        </p>
        <h2 className="mt-3 font-heading text-4xl">What they offer</h2>
        {(servicesResult.data ?? []).length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {(servicesResult.data ?? []).map((service) => {
              const unit = isPricingUnit(service.price_unit)
                ? service.price_unit
                : "hour";
              return (
                <Link
                  key={service.id}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  href={`/services/${service.id}`}
                >
                  <h3 className="font-heading text-3xl">{service.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                  <p className="mt-5 text-sm font-bold">
                    {formatServicePrice(service.price_cents, unit)}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No published services yet.
          </div>
        )}
      </section>
    </main>
  );
}
