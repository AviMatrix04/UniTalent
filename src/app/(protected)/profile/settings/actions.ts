"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSdsuEmail } from "@/lib/auth/validation";
import {
  isContactType,
  validateContact,
  validateProfile,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function settingsRedirect(
  kind: "error" | "message",
  message: string,
  section: "profile" | "contacts",
): never {
  const query = new URLSearchParams({ [kind]: message, section });
  redirect(`/profile/settings?${query.toString()}#${section}`);
}

async function authenticatedStudent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : "";

  if (!claims?.sub || !isSdsuEmail(email)) {
    redirect("/auth/login?next=/profile/settings");
  }

  return { supabase, userId: claims.sub };
}

export async function updateProfile(formData: FormData) {
  const result = validateProfile(
    value(formData, "fullName"),
    value(formData, "bio"),
  );

  if (result.error || !result.data) {
    settingsRedirect("error", result.error, "profile");
  }

  const { supabase, userId } = await authenticatedStudent();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: result.data.fullName,
      bio: result.data.bio,
    })
    .eq("id", userId);

  if (error) {
    settingsRedirect(
      "error",
      "Your profile could not be saved. Please try again.",
      "profile",
    );
  }

  revalidatePath("/profile/settings");
  settingsRedirect("message", "Profile saved.", "profile");
}

export async function saveContactMethod(formData: FormData) {
  const type = value(formData, "type");
  if (!isContactType(type)) {
    settingsRedirect("error", "Choose a valid contact type.", "contacts");
  }

  const result = validateContact(type, value(formData, "contactValue"));
  if (result.error || !result.value) {
    settingsRedirect(
      "error",
      result.error ?? "Enter valid contact details.",
      "contacts",
    );
  }

  const { supabase, userId } = await authenticatedStudent();
  const { error } = await supabase.from("contact_methods").upsert(
    {
      profile_id: userId,
      type,
      value: result.value,
      is_visible: formData.get("isVisible") === "on",
    },
    { onConflict: "profile_id,type" },
  );

  if (error) {
    settingsRedirect(
      "error",
      "That contact method could not be saved. Please try again.",
      "contacts",
    );
  }

  revalidatePath("/profile/settings");
  settingsRedirect("message", "Contact method saved.", "contacts");
}

export async function deleteContactMethod(formData: FormData) {
  const type = value(formData, "type");
  if (!isContactType(type)) {
    settingsRedirect("error", "Choose a valid contact type.", "contacts");
  }

  const { supabase, userId } = await authenticatedStudent();
  const { error } = await supabase
    .from("contact_methods")
    .delete()
    .eq("profile_id", userId)
    .eq("type", type);

  if (error) {
    settingsRedirect(
      "error",
      "That contact method could not be removed. Please try again.",
      "contacts",
    );
  }

  revalidatePath("/profile/settings");
  settingsRedirect("message", "Contact method removed.", "contacts");
}
