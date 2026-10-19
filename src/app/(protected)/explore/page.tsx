import {
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import {
  formatServicePrice,
  isPricingUnit,
  normalizeSkillName,
  parseUsdToCents,
} from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Explore services" };
export const instant = false;

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string;
    skill?: string | string[];
    min?: string;
    max?: string;
    sort?: string;
  }>;
};

type ServiceResult = {
  service_id: string;
  title: string;
  description: string;
  price_cents: number;
  price_unit: string;
  published_at: string;
  provider_id: string;
  provider_name: string | null;
  skill_names: string[];
};

type PopularSkill = {
  name: string;
  normalized_name: string;
  service_count: number;
};

const sortOptions = new Set(["newest", "price_asc", "price_desc"]);

function selectedValues(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function skillUrl(skill: string) {
  const query = new URLSearchParams({ skill });
  return `/explore?${query.toString()}`;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  await connection();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedSkills = selectedValues(params.skill).map(normalizeSkillName);
  const minCents = params.min ? parseUsdToCents(params.min) : null;
  const maxCents = params.max ? parseUsdToCents(params.max) : null;
  const sort = sortOptions.has(params.sort ?? "") ? params.sort! : "newest";
  const hasFilters = Boolean(
    query ||
    selectedSkills.length ||
    params.min ||
    params.max ||
    sort !== "newest",
  );
  const supabase = await createClient();

  const [servicesResult, popularResult, skillsResult] = await Promise.all([
    supabase.rpc("search_services", {
      search_query: query || null,
      skill_filters: selectedSkills,
      min_price_cents: minCents,
      max_price_cents: maxCents,
      sort_option: sort,
    }),
    supabase.rpc("popular_skills", { result_limit: 8 }),
    supabase
      .from("skills")
      .select("name,normalized_name")
      .eq("is_hidden", false)
      .order("normalized_name")
      .limit(100),
  ]);

  if (servicesResult.error || popularResult.error || skillsResult.error) {
    throw new Error("Unable to load the service directory.");
  }

  const services = (servicesResult.data ?? []) as ServiceResult[];
  const popularSkills = (popularResult.data ?? []) as PopularSkill[];
  const availableSkills = skillsResult.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Built by SDSU students
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
            Find the talent already on campus.
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground lg:pb-1">
          Search published services, compare prices, and discover students with
          the exact skills you need.
        </p>
      </section>

      <form className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px_150px_190px_auto] lg:items-end">
          <label className="text-sm font-semibold">
            Search services
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-accent focus:ring-3 focus:ring-accent/15"
                defaultValue={query}
                name="q"
                placeholder="Photography, tutoring, design…"
                type="search"
              />
            </div>
          </label>
          <label className="text-sm font-semibold">
            Minimum price
            <input
              className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
              defaultValue={params.min ?? ""}
              inputMode="decimal"
              name="min"
              pattern="[0-9]+([.][0-9]{1,2})?"
              placeholder="$0"
            />
          </label>
          <label className="text-sm font-semibold">
            Maximum price
            <input
              className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
              defaultValue={params.max ?? ""}
              inputMode="decimal"
              name="max"
              pattern="[0-9]+([.][0-9]{1,2})?"
              placeholder="Any"
            />
          </label>
          <label className="text-sm font-semibold">
            Sort by
            <select
              className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
              defaultValue={sort}
              name="sort"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Apply
          </button>
        </div>

        {availableSkills.length > 0 ? (
          <details
            className="mt-5 border-t border-border pt-5"
            open={selectedSkills.length > 0}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold">
              <Filter aria-hidden="true" className="size-4" />
              Filter by skills
              {selectedSkills.length > 0 ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {selectedSkills.length}
                </span>
              ) : null}
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              {availableSkills.map((skill) => (
                <label
                  key={skill.normalized_name}
                  className="cursor-pointer has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground rounded-full border border-border px-3 py-2 text-xs font-semibold transition hover:border-foreground/30"
                >
                  <input
                    className="sr-only"
                    defaultChecked={selectedSkills.includes(
                      skill.normalized_name,
                    )}
                    name="skill"
                    type="checkbox"
                    value={skill.normalized_name}
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </details>
        ) : null}
      </form>

      {popularSkills.length > 0 ? (
        <section className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
            Popular
          </span>
          {popularSkills.map((skill) => (
            <Link
              key={skill.normalized_name}
              className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-foreground/30"
              href={skillUrl(skill.normalized_name)}
            >
              {skill.name} · {skill.service_count}
            </Link>
          ))}
        </section>
      ) : null}

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {hasFilters ? "Directory results" : "Recently published"}
            </p>
            <h2 className="mt-3 font-heading text-4xl tracking-[-0.04em]">
              {hasFilters
                ? `${services.length} services found`
                : "Fresh from campus"}
            </h2>
          </div>
          {hasFilters ? (
            <Link
              className="text-sm font-bold underline underline-offset-4"
              href="/explore"
            >
              Clear all filters
            </Link>
          ) : null}
        </div>

        {services.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto size-6 text-muted-foreground"
            />
            <h3 className="mt-5 font-heading text-3xl">
              No services match yet.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Try removing a skill, widening the price range, or searching with
              fewer words.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const priceUnit = isPricingUnit(service.price_unit)
                ? service.price_unit
                : "hour";
              const providerName = service.provider_name ?? "SDSU student";
              const initials = providerName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();

              return (
                <article
                  key={service.service_id}
                  className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`relative flex aspect-[16/10] items-end overflow-hidden p-5 ${
                      index % 3 === 0
                        ? "bg-secondary"
                        : index % 3 === 1
                          ? "bg-accent/15"
                          : "bg-muted"
                    }`}
                  >
                    <div className="absolute -right-14 -top-16 size-48 rounded-full border border-foreground/10 transition duration-500 group-hover:scale-110" />
                    <div className="absolute -bottom-20 -left-10 size-44 rounded-full bg-accent/85 transition duration-500 group-hover:scale-110" />
                    <span className="relative rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      {formatServicePrice(service.price_cents, priceUnit)}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-3xl leading-tight tracking-[-0.03em]">
                      {service.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {service.description}
                    </p>
                    {service.skill_names.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {service.skill_names.map((skill) => (
                          <Link
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
                            href={skillUrl(skill)}
                          >
                            <Tag aria-hidden="true" className="size-3" />
                            {skill}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          {initials || (
                            <UserRound aria-hidden="true" className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {providerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Verified student
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
