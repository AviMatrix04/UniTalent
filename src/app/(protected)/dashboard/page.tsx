import {
  Archive,
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  FilePenLine,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { ServiceCelebration } from "@/components/services/service-celebration";
import { DashboardStatCarousel } from "@/components/services/dashboard-stat-carousel";
import { ServiceActions } from "@/components/services/service-actions";
import { ToastMessage } from "@/components/ui/toast-message";
import { SERVICE_IMAGE_BUCKET } from "@/lib/services/portfolio";
import { formatServicePrice, isPricingUnit } from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };
export const instant = false;

type ServiceStatus = "draft" | "published" | "archived" | "hidden";

type Service = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  price_unit: string;
  status: ServiceStatus;
  updated_at: string;
};

const statusStyles: Record<ServiceStatus, string> = {
  draft: "bg-muted text-foreground",
  published: "bg-secondary text-secondary-foreground",
  archived: "bg-foreground/8 text-foreground",
  hidden: "bg-destructive/10 text-destructive",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type DashboardPageProps = {
  searchParams: Promise<{
    celebrate?: string;
    error?: string;
    message?: string;
    serviceId?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await connection();
  const {
    celebrate,
    error,
    message,
    serviceId: celebratedServiceId,
  } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/auth/login?next=/dashboard");

  const [profileResult, contactsResult, servicesResult] = await Promise.all([
    supabase.from("profiles").select("full_name,bio").eq("id", userId).single(),
    supabase
      .from("contact_methods")
      .select("id")
      .eq("profile_id", userId)
      .eq("is_visible", true)
      .limit(1),
    supabase
      .from("services")
      .select("id,title,description,price_cents,price_unit,status,updated_at")
      .eq("student_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (
    profileResult.error ||
    !profileResult.data ||
    contactsResult.error ||
    servicesResult.error
  ) {
    throw new Error("Unable to load your dashboard.");
  }

  const profile = profileResult.data;
  const services = (servicesResult.data ?? []) as Service[];
  const serviceIds = services.map((service) => service.id);
  const coversResult = serviceIds.length
    ? await supabase
        .from("portfolio_items")
        .select("service_id,storage_path")
        .in("service_id", serviceIds)
        .eq("is_cover", true)
    : { data: [], error: null };

  if (coversResult.error) {
    throw new Error("Unable to load your service covers.");
  }

  const coverEntries = await Promise.all(
    (coversResult.data ?? []).map(async (cover) => {
      const { data } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .createSignedUrl(cover.storage_path, 60 * 60);
      return [cover.service_id, data?.signedUrl ?? null] as const;
    }),
  );
  const coverUrls = new Map(coverEntries);
  const hasVisibleContact = Boolean(contactsResult.data?.length);
  const profileReady = Boolean(
    profile.full_name && profile.bio && hasVisibleContact,
  );
  const counts = services.reduce(
    (current, service) => {
      current[service.status] += 1;
      return current;
    },
    { draft: 0, published: 0, archived: 0, hidden: 0 },
  );
  const profileStepsCompleted = [
    Boolean(profile.full_name),
    Boolean(profile.bio),
    hasVisibleContact,
  ].filter(Boolean).length;
  const profileCompletion = Math.round((profileStepsCompleted / 3) * 100);
  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "creator";

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <ToastMessage error={error} message={message} />
      <ServiceCelebration
        kind={celebrate === "published" ? "published" : undefined}
        serviceId={celebratedServiceId}
      />
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-28 size-80 rounded-full border border-primary-foreground/15" />
        <div className="absolute -bottom-40 right-16 size-72 rounded-full bg-accent" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/60">
              Your creative desk
            </p>
            <h1 className="mt-4 max-w-2xl font-heading text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-primary-foreground/70">
              What will you share with campus today? Create listings, shape
              private drafts, and manage everything you offer from one place.
            </p>
          </div>
          <Link
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground transition hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring lg:self-auto"
            href="/services/new"
          >
            <Plus aria-hidden="true" className="size-4" />
            Offer a service
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <DashboardStatCarousel
          all={services.length}
          drafts={counts.draft}
          published={counts.published}
        />

        <div
          className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
            profileReady
              ? "border-secondary bg-secondary"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-start gap-3">
            {profileReady ? (
              <BadgeCheck aria-hidden="true" className="mt-0.5 size-5" />
            ) : (
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-5 text-accent"
              />
            )}
            <div>
              <h2 className="font-semibold">
                {profileReady ? "Ready to publish" : "Profile needs attention"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {profileReady
                  ? "Your bio and visible contact method are ready for publishing."
                  : "Add a bio and at least one visible contact before publishing."}
              </p>
              <div
                className="mt-4"
                aria-label={`${profileCompletion}% profile complete`}
              >
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span>Profile completion</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              <Link
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline decoration-1 underline-offset-4"
                href="/profile/settings"
              >
                Review profile
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 scroll-mt-24" id="services">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Service manager
            </p>
            <h2 className="mt-3 font-heading text-4xl tracking-[-0.04em]">
              Your listings
            </h2>
          </div>
          {services.length > 0 ? (
            <Link
              className="hidden items-center gap-2 text-sm font-bold sm:inline-flex"
              href="/services/new"
            >
              <Plus aria-hidden="true" className="size-4" />
              New service
            </Link>
          ) : null}
        </div>

        {services.length === 0 ? (
          <div className="mt-7 overflow-hidden rounded-3xl border border-dashed border-border bg-card p-8 text-center sm:p-14">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <h3 className="mt-5 font-heading text-3xl">
              Your first idea starts here.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Create a private draft for something you can teach, make, design,
              photograph, perform, or help another SDSU student accomplish.
            </p>
            <Link
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
              href="/services/new"
            >
              <Plus aria-hidden="true" className="size-4" />
              Create your first draft
            </Link>
          </div>
        ) : (
          <div className="mt-7 space-y-3">
            {services.map((service, index) => {
              const priceUnit = isPricingUnit(service.price_unit)
                ? service.price_unit
                : "hour";
              const coverUrl = coverUrls.get(service.id);

              return (
                <article
                  key={service.id}
                  className="group grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
                >
                  <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-secondary font-heading text-lg sm:size-20">
                    {coverUrl ? (
                      <Image
                        alt=""
                        className="object-cover transition duration-500 group-hover:scale-105"
                        fill
                        sizes="80px"
                        src={coverUrl}
                      />
                    ) : (
                      <>
                        <span className="absolute -bottom-6 -right-5 size-14 rounded-full bg-accent/20" />
                        <span className="relative">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-bold">
                        {service.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${statusStyles[service.status]}`}
                      >
                        {service.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">
                        {formatServicePrice(service.price_cents, priceUnit)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        Updated{" "}
                        {dateFormatter.format(new Date(service.updated_at))}
                      </span>
                      {service.status === "archived" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Archive aria-hidden="true" className="size-3.5" />
                          Not visible in discovery
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {service.status === "hidden" ? (
                    <span className="text-xs font-semibold text-destructive">
                      Locked by moderation
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Link
                        className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-bold transition hover:bg-muted"
                        href={`/services/${service.id}`}
                      >
                        View
                      </Link>
                      <Link
                        aria-label={`Edit ${service.title}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-bold transition hover:border-foreground/30 hover:bg-muted"
                        href={`/services/${service.id}/edit`}
                      >
                        <FilePenLine aria-hidden="true" className="size-4" />
                        Edit
                      </Link>
                      <ServiceActions
                        serviceId={service.id}
                        status={service.status}
                        title={service.title}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
