"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSdsuEmail } from "@/lib/auth/validation";
import {
  type ServiceFormFields,
  validateService,
} from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

export type ServiceFormState = {
  error?: string;
  fields: ServiceFormFields;
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function serviceId(formData: FormData) {
  const id = field(formData, "serviceId");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
    ? id
    : null;
}

function dashboardRedirect(kind: "error" | "message", message: string): never {
  const query = new URLSearchParams({ [kind]: message });
  redirect(`/dashboard?${query.toString()}#services`);
}

function submittedFields(formData: FormData): ServiceFormFields {
  const priceUnit = field(formData, "priceUnit");

  return {
    title: field(formData, "title"),
    description: field(formData, "description"),
    price: field(formData, "price"),
    priceUnit: priceUnit === "project" ? "project" : "hour",
  };
}

async function authenticatedStudent(nextPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : "";

  if (!claims?.sub || !isSdsuEmail(email)) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, userId: claims.sub };
}

export async function createService(
  _previousState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const fields = submittedFields(formData);
  const result = validateService(
    fields.title,
    fields.description,
    field(formData, "price"),
    field(formData, "priceUnit"),
  );

  if (result.error || !result.data) {
    return { fields, error: result.error };
  }

  const { supabase, userId } = await authenticatedStudent("/services/new");
  const { data, error } = await supabase
    .from("services")
    .insert({
      student_id: userId,
      title: result.data.title,
      description: result.data.description,
      price_cents: result.data.priceCents,
      price_unit: result.data.priceUnit,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      fields,
      error: "Your draft could not be created. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/services/${data.id}/edit?message=Draft+created.`);
}

export async function updateService(
  serviceId: string,
  _previousState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const fields = submittedFields(formData);
  const result = validateService(
    fields.title,
    fields.description,
    field(formData, "price"),
    field(formData, "priceUnit"),
  );

  if (result.error || !result.data) {
    return { fields, error: result.error };
  }

  const editPath = `/services/${serviceId}/edit`;
  const { supabase, userId } = await authenticatedStudent(editPath);
  const { data, error } = await supabase
    .from("services")
    .update({
      title: result.data.title,
      description: result.data.description,
      price_cents: result.data.priceCents,
      price_unit: result.data.priceUnit,
    })
    .eq("id", serviceId)
    .eq("student_id", userId)
    .neq("status", "hidden")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      fields,
      error: "Your service could not be saved. Please try again.",
    };
  }

  if (!data) {
    return {
      fields,
      error: "That service was not found or cannot be edited.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(editPath);
  redirect(`${editPath}?message=Service+saved.`);
}

export async function publishService(formData: FormData) {
  const id = serviceId(formData);
  if (!id) dashboardRedirect("error", "Choose a valid service.");

  const { supabase } = await authenticatedStudent("/dashboard");
  const { error } = await supabase.rpc("publish_service", {
    target_service_id: id,
  });

  if (error) {
    const safeMessage = [
      "Complete your name and bio before publishing.",
      "Add at least one visible contact method before publishing.",
      "That service cannot be published.",
    ].includes(error.message)
      ? error.message
      : "Your service could not be published. Please try again.";
    dashboardRedirect("error", safeMessage);
  }

  revalidatePath("/dashboard");
  dashboardRedirect("message", "Service published.");
}

export async function archiveService(formData: FormData) {
  const id = serviceId(formData);
  if (!id) dashboardRedirect("error", "Choose a valid service.");

  const { supabase } = await authenticatedStudent("/dashboard");
  const { error } = await supabase.rpc("archive_service", {
    target_service_id: id,
  });

  if (error) {
    dashboardRedirect(
      "error",
      error.message === "That service cannot be archived."
        ? error.message
        : "Your service could not be archived. Please try again.",
    );
  }

  revalidatePath("/dashboard");
  dashboardRedirect("message", "Service archived.");
}

export async function deleteService(formData: FormData) {
  const id = serviceId(formData);
  if (!id) dashboardRedirect("error", "Choose a valid service.");

  const { supabase, userId } = await authenticatedStudent("/dashboard");
  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("student_id", userId)
    .neq("status", "hidden")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    dashboardRedirect(
      "error",
      "That service could not be deleted. It may be locked by moderation.",
    );
  }

  revalidatePath("/dashboard");
  dashboardRedirect("message", "Service permanently deleted.");
}
