"use client";

import {
  ArrowLeft,
  CircleAlert,
  ChevronDown,
  Eye,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useActionState, useState } from "react";

import {
  createService,
  type ServiceFormState,
  updateService,
} from "@/app/(protected)/services/actions";
import { inputClassName } from "@/components/auth/styles";
import {
  formatServicePrice,
  MAX_SERVICE_SKILLS,
  normalizeSkillName,
  parseUsdToCents,
  type ServiceFormFields,
} from "@/lib/services/validation";

type ServiceFormProps = {
  availableSkills: string[];
  initialFields: ServiceFormFields;
  initialSkills?: string[];
  message?: string;
  mode: "create" | "edit";
  serviceId?: string;
  status?: "draft" | "published" | "archived";
  previewImageUrl?: string | null;
  listingContext?: {
    hasCover: boolean;
    portfolioCount: number;
    profileReady: boolean;
  };
};

export function ServiceForm({
  availableSkills,
  initialFields,
  initialSkills = [],
  message,
  mode,
  serviceId,
  status = "draft",
  previewImageUrl,
  listingContext,
}: ServiceFormProps) {
  const action =
    mode === "edit" && serviceId
      ? updateService.bind(null, serviceId)
      : createService;
  const initialState: ServiceFormState = { fields: initialFields };
  const [formState, formAction, pending] = useActionState(action, initialState);
  const [preview, setPreview] = useState(initialFields);
  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [skillInput, setSkillInput] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);
  const previewCents = parseUsdToCents(preview.price);
  const strengthChecks = listingContext
    ? [
        {
          complete: preview.description.trim().length >= 100,
          label: "Detailed description",
        },
        {
          complete: selectedSkills.length >= 1,
          label: "At least one skill",
        },
        { complete: listingContext.hasCover, label: "Portfolio cover" },
        {
          complete: listingContext.portfolioCount >= 3,
          label: "Three portfolio images",
        },
        {
          complete: listingContext.profileReady,
          label: "Publish-ready profile",
        },
      ]
    : [];
  const strengthScore = strengthChecks.length
    ? Math.round(
        (strengthChecks.filter((check) => check.complete).length /
          strengthChecks.length) *
          100,
      )
    : 0;

  function addSkill() {
    const skill = skillInput.trim().replace(/\s+/g, " ");

    if (!skill) return;
    if (skill.length > 50) {
      setSkillError("Skills can use at most 50 characters.");
      return;
    }
    if (selectedSkills.length >= MAX_SERVICE_SKILLS) {
      setSkillError(`Choose no more than ${MAX_SERVICE_SKILLS} skills.`);
      return;
    }
    const existingSkill = availableSkills.find(
      (available) =>
        normalizeSkillName(available) === normalizeSkillName(skill),
    );
    if (!existingSkill) {
      setSkillError("Choose a skill from the dropdown.");
      return;
    }
    if (
      selectedSkills.some(
        (selected) =>
          normalizeSkillName(selected) === normalizeSkillName(skill),
      )
    ) {
      setSkillError("That skill is already selected.");
      return;
    }

    setSelectedSkills((current) => [...current, existingSkill ?? skill]);
    setSkillInput("");
    setSkillError(null);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-start">
      <section>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          href="/dashboard"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to dashboard
        </Link>

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {mode === "create" ? "New service" : `Editing ${status}`}
          </p>
          <h1 className="mt-3 font-heading text-5xl leading-none tracking-[-0.04em]">
            {mode === "create" ? "Offer your talent." : "Shape your listing."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Start with the essentials. Save this listing as a draft, then add
            portfolio images from the edit page before publishing it.
          </p>
        </div>

        <form
          action={formAction}
          className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
        >
          {formState.error ? (
            <div
              className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {formState.error}
            </div>
          ) : message ? (
            <div
              className="mb-6 rounded-xl border border-secondary bg-secondary/60 px-4 py-3 text-sm"
              role="status"
            >
              {message}
            </div>
          ) : null}

          <div className="space-y-7">
            <label className="block text-sm font-semibold">
              Service title
              <input
                className={inputClassName}
                defaultValue={formState.fields.title}
                maxLength={100}
                minLength={5}
                name="title"
                placeholder="Portrait photography for graduation"
                required
                type="text"
                onChange={(event) =>
                  setPreview((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
              <span className="mt-2 block text-xs font-normal text-muted-foreground">
                Be specific about what another student can ask you to do.
              </span>
            </label>

            <label className="block text-sm font-semibold">
              Description
              <textarea
                className={`${inputClassName} min-h-48 resize-y py-3 leading-6`}
                defaultValue={formState.fields.description}
                maxLength={2000}
                minLength={20}
                name="description"
                placeholder="Describe what you offer, what is included, and what a student should know before contacting you."
                required
                onChange={(event) =>
                  setPreview((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
              <span className="mt-2 block text-xs font-normal text-muted-foreground">
                20–2,000 characters.
              </span>
            </label>

            <fieldset>
              <legend className="text-sm font-semibold">Pricing</legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Price in USD
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      aria-describedby="price-help"
                      className={`${inputClassName} !mt-0 pl-8`}
                      defaultValue={formState.fields.price}
                      inputMode="decimal"
                      maxLength={11}
                      name="price"
                      pattern="[0-9]+([.][0-9]{1,2})?"
                      placeholder="25.00"
                      required
                      type="text"
                      onChange={(event) =>
                        setPreview((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium">
                  Charge per
                  <div className="relative mt-2">
                    <select
                      className={`${inputClassName} !mt-0 appearance-none pr-11`}
                      defaultValue={formState.fields.priceUnit}
                      name="priceUnit"
                      required
                      onChange={(event) =>
                        setPreview((current) => ({
                          ...current,
                          priceUnit: event.target.value as "hour" | "project",
                        }))
                      }
                    >
                      <option value="hour">Hour</option>
                      <option value="project">Service</option>
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </label>
              </div>
              <p
                className="mt-3 text-xs leading-5 text-muted-foreground"
                id="price-help"
              >
                Pricing is required and may use up to two decimal places.
              </p>
              {previewCents === 0 ? (
                <div
                  aria-live="polite"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 text-sm"
                >
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent"
                  />
                  <p>
                    This service will be displayed as <strong>Free</strong>.
                  </p>
                </div>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">Skills</legend>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Add up to five skills that help students discover this service.
                Choose from the approved skill catalog, including Other.
              </p>

              {selectedSkills.map((skill) => (
                <input key={skill} name="skills" type="hidden" value={skill} />
              ))}

              <div className="mt-4 flex gap-2">
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor="skill-input">
                    Add a skill
                  </label>
                  <div className="relative">
                    <select
                      className={`${inputClassName} !mt-0 appearance-none pr-11`}
                      disabled={selectedSkills.length >= MAX_SERVICE_SKILLS}
                      id="skill-input"
                      value={skillInput}
                      onChange={(event) => setSkillInput(event.target.value)}
                    >
                      <option value="">Choose a skill…</option>
                      {availableSkills
                        .filter(
                          (skill) =>
                            !selectedSkills.some(
                              (selected) =>
                                normalizeSkillName(selected) ===
                                normalizeSkillName(skill),
                            ),
                        )
                        .map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold transition hover:border-foreground/30 hover:bg-muted disabled:opacity-50"
                  disabled={
                    selectedSkills.length >= MAX_SERVICE_SKILLS ||
                    !skillInput.trim()
                  }
                  type="button"
                  onClick={addSkill}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add
                </button>
              </div>

              <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                  >
                    <Tag aria-hidden="true" className="size-3" />
                    {skill}
                    <button
                      aria-label={`Remove ${skill}`}
                      className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                      type="button"
                      onClick={() => {
                        setSelectedSkills((current) =>
                          current.filter((selected) => selected !== skill),
                        );
                        setSkillError(null);
                      }}
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">
                  {selectedSkills.length}/{MAX_SERVICE_SKILLS} selected
                </span>
              </div>
              {skillError ? (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {skillError}
                </p>
              ) : null}
            </fieldset>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition hover:bg-muted"
                href="/dashboard"
              >
                Cancel
              </Link>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:translate-y-0 disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {pending
                  ? "Saving…"
                  : mode === "create"
                    ? "Create draft"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <aside className="xl:sticky xl:top-24">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Eye aria-hidden="true" className="size-4" />
          Listing preview
        </div>
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative flex aspect-[16/10] items-end overflow-hidden bg-secondary p-6">
            {previewImageUrl ? (
              <Image
                alt="Selected portfolio cover"
                className="object-cover"
                fill
                sizes="(max-width: 1280px) 100vw, 420px"
                src={previewImageUrl}
              />
            ) : (
              <>
                <div className="absolute -right-12 -top-16 size-56 rounded-full border border-foreground/10" />
                <div className="absolute -bottom-20 -left-10 size-52 rounded-full bg-accent/90" />
              </>
            )}
            <span className="relative inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-2 text-xs font-bold backdrop-blur">
              <Sparkles aria-hidden="true" className="size-3.5 text-accent" />
              {mode === "create"
                ? "Save draft to add portfolio images"
                : "Manage portfolio below"}
            </span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-5">
              <h2 className="font-heading text-3xl leading-tight tracking-[-0.03em]">
                {preview.title.trim() || "Your service title"}
              </h2>
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold capitalize">
                {status}
              </span>
            </div>
            <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {preview.description.trim() ||
                "Your description will appear here as you type."}
            </p>
            {selectedSkills.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Starting at
              </p>
              <p className="mt-1 text-xl font-bold">
                {previewCents === null
                  ? "Add a valid price"
                  : formatServicePrice(previewCents, preview.priceUnit)}
              </p>
            </div>
          </div>
        </article>
        {listingContext ? (
          <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  Listing strength
                </p>
                <h2 className="mt-2 font-heading text-3xl">
                  Make it stand out.
                </h2>
              </div>
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-sm font-black">
                {strengthScore}%
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${strengthScore}%` }}
              />
            </div>
            <ul className="mt-5 space-y-3">
              {strengthChecks.map((check) => (
                <li
                  className="flex items-center gap-3 text-sm"
                  key={check.label}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-xs font-black ${
                      check.complete
                        ? "bg-secondary text-foreground"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {check.complete ? "✓" : "·"}
                  </span>
                  <span
                    className={
                      check.complete ? "font-semibold" : "text-muted-foreground"
                    }
                  >
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
