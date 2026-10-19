import {
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import {
  deleteContactMethod,
  saveContactMethod,
  updateProfile,
} from "./actions";
import { FormMessage, SubmitButton } from "@/components/auth/form-elements";
import { inputClassName } from "@/components/auth/styles";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { AVATAR_BUCKET } from "@/lib/profile/avatar";
import type { ContactType } from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile settings" };
export const instant = false;

type ContactMethod = {
  type: ContactType;
  value: string;
  is_visible: boolean;
};

const contactOptions = [
  {
    type: "email",
    label: "Contact email",
    description: "This can be different from your SDSU login email.",
    placeholder: "you@example.com",
    icon: Mail,
    inputType: "email",
  },
  {
    type: "phone",
    label: "Phone number",
    description: "Include the country code when appropriate.",
    placeholder: "+1 (619) 555-0123",
    icon: Phone,
    inputType: "tel",
  },
  {
    type: "instagram",
    label: "Instagram",
    description: "Enter a handle or an Instagram profile URL.",
    placeholder: "@yourhandle",
    icon: AtSign,
    inputType: "text",
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    description: "Use your personal LinkedIn profile URL.",
    placeholder: "linkedin.com/in/your-name",
    icon: BriefcaseBusiness,
    inputType: "text",
  },
] as const;

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    section?: string;
  }>;
};

export default async function ProfileSettingsPage({
  searchParams,
}: SettingsPageProps) {
  await connection();
  const { error, message, section } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) redirect("/auth/login?next=/profile/settings");

  const [profileResult, contactsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,bio,avatar_path")
      .eq("id", userId)
      .single(),
    supabase
      .from("contact_methods")
      .select("type,value,is_visible")
      .eq("profile_id", userId)
      .order("type"),
  ]);

  if (profileResult.error || !profileResult.data || contactsResult.error) {
    throw new Error("Unable to load profile settings.");
  }

  const profile = profileResult.data;
  const avatarResult = profile.avatar_path
    ? await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(profile.avatar_path, 60 * 60)
    : null;
  const avatarUrl = avatarResult?.data?.signedUrl ?? null;
  const contacts = (contactsResult.data ?? []) as ContactMethod[];
  const contactsByType = new Map(
    contacts.map((contact) => [contact.type, contact]),
  );
  const hasVisibleContact = contacts.some((contact) => contact.is_visible);
  const profileComplete = Boolean(
    profile.full_name && profile.bio && hasVisibleContact,
  );
  const initials = (profile.full_name ?? "SDSU Student")
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:gap-16">
        <aside>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Your presence
          </p>
          <h1 className="mt-4 font-heading text-5xl leading-[1.02] tracking-[-0.04em]">
            Profile settings
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Tell students who you are and choose exactly how they can contact
            you.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <p className="mb-4 font-semibold">
              {profile.full_name ?? "SDSU student"}
            </p>
            <AvatarUploader
              initialPath={profile.avatar_path}
              initialUrl={avatarUrl}
              initials={initials}
              userId={userId}
            />
            <div
              className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ${
                profileComplete ? "bg-secondary" : "bg-muted"
              }`}
            >
              {profileComplete ? (
                <BadgeCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
              ) : (
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-accent"
                />
              )}
              <p className="leading-5">
                {profileComplete
                  ? "Your provider profile is ready for service publishing."
                  : "Add a bio and at least one visible contact method to prepare for publishing."}
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-12">
          <section id="profile" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold">About you</h2>
                <p className="text-sm text-muted-foreground">
                  Visible to verified SDSU students.
                </p>
              </div>
            </div>

            {section === "profile" ? (
              <FormMessage error={error} message={message} />
            ) : null}

            <form
              action={updateProfile}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
            >
              <div className="space-y-6">
                <label className="block text-sm font-semibold">
                  Full name
                  <input
                    className={inputClassName}
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    defaultValue={profile.full_name ?? ""}
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Bio
                  <textarea
                    className={`${inputClassName} min-h-36 resize-y py-3 leading-6`}
                    name="bio"
                    defaultValue={profile.bio ?? ""}
                    maxLength={500}
                    placeholder="What do you enjoy creating, teaching, or helping with?"
                  />
                  <span className="mt-2 block text-xs font-normal text-muted-foreground">
                    Up to 500 characters.
                  </span>
                </label>
                <div className="max-w-44">
                  <SubmitButton>Save profile</SubmitButton>
                </div>
              </div>
            </form>
          </section>

          <section id="contacts" className="scroll-mt-24">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Contact methods</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add any methods you want. Only methods marked visible can be
                seen by other verified students.
              </p>
            </div>

            {section === "contacts" ? (
              <FormMessage error={error} message={message} />
            ) : null}

            <div className="space-y-4">
              {contactOptions.map((option) => {
                const contact = contactsByType.get(option.type);
                const Icon = option.icon;

                return (
                  <form
                    action={saveContactMethod}
                    key={option.type}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                  >
                    <input name="type" type="hidden" value={option.type} />
                    <div className="flex items-start gap-4">
                      <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <label className="block text-sm font-semibold">
                          {option.label}
                          <input
                            className={inputClassName}
                            name="contactValue"
                            type={option.inputType}
                            defaultValue={contact?.value ?? ""}
                            placeholder={option.placeholder}
                            maxLength={320}
                            required
                          />
                        </label>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {option.description}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
                          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                            <input
                              className="size-4 accent-[var(--accent)]"
                              name="isVisible"
                              type="checkbox"
                              defaultChecked={contact?.is_visible ?? false}
                            />
                            Visible to students
                          </label>
                          <div className="flex items-center gap-2">
                            {contact ? (
                              <button
                                className="rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                formAction={deleteContactMethod}
                                formNoValidate
                                type="submit"
                              >
                                Remove
                              </button>
                            ) : null}
                            <button
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              type="submit"
                            >
                              {contact ? "Update" : "Add"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
