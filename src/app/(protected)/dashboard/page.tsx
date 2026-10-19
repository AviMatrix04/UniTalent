import {
  Archive,
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  Eye,
  FilePenLine,
  Layers3,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { FormMessage } from "@/components/auth/form-elements";
import { ServiceActions } from "@/components/services/service-actions";
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
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  await connection();
  const { error, message } = await searchParams;
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

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-28 size-80 rounded-full border border-primary-foreground/15" />
        <div className="absolute -bottom-40 right-16 size-72 rounded-full bg-accent" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/60">
              Your creative desk
            </p>
            <h1 className="mt-4 max-w-2xl font-heading text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              What will you share with campus?
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-primary-foreground/70">
              Create listings, keep private drafts, and manage everything you
              offer from one place.
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

      <section className="mt-6 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:gap-5 sm:p-6">
          {[
            { label: "All services", value: services.length, icon: Layers3 },
            { label: "Published", value: counts.published, icon: Eye },
            { label: "Drafts", value: counts.draft, icon: FilePenLine },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <Icon
                aria-hidden="true"
                className="mb-5 size-4 text-muted-foreground"
              />
              <p className="font-heading text-4xl tracking-[-0.04em]">
                {value}
              </p>
              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>

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

        <div className="mt-6">
          <FormMessage error={error} message={message} />
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

              return (
                <article
                  key={service.id}
                  className="group grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-secondary font-heading text-lg">
                    {String(index + 1).padStart(2, "0")}
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
