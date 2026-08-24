"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const existingBusiness = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingBusiness.data) {
    redirect("/dashboard");
  }

  const logoFile = formData.get("logo") as File | null;
  let logoPath: string | null = null;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_SIZE) {
      return { error: "Logo must be less than 2MB." };
    }

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(fileName, logoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: "Failed to upload logo. Please try again." };
    }

    logoPath = fileName;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: formData.get("full_name") as string | null,
  });

  if (error) {
    return { error: "Failed to create profile. Please try again." };
  }

  const { error: businessError } = await supabase.from("businesses").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    country: (formData.get("country") as string) || null,
    currency: formData.get("currency") as string,
    logo_url: logoPath,
    brand_colour: (formData.get("brand_colour") as string) || "#4F46E5",
    invoice_prefix: (formData.get("invoice_prefix") as string) || "INV",
    invoice_start_number: parseInt(
      (formData.get("invoice_start_number") as string) || "1",
      10,
    ),
    next_invoice_number: parseInt(
      (formData.get("invoice_start_number") as string) || "1",
      10,
    ),
    default_payment_terms:
      (formData.get("default_payment_terms") as string) || "Net 30",
    invoice_template:
      (formData.get("invoice_template") as string) || "modern",
  });

  if (businessError) {
    return { error: "Failed to create business. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  redirect("/dashboard");
}

export async function updateBusiness(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !business) {
    redirect("/dashboard/onboarding");
  }

  const logoFile = formData.get("logo") as File | null;
  let logoPath = business.logo_url;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_SIZE) {
      return { error: "Logo must be less than 2MB." };
    }

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(fileName, logoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: "Failed to upload logo. Please try again." };
    }

    if (business.logo_url) {
      await supabase.storage
        .from("business-logos")
        .remove([business.logo_url]);
    }

    logoPath = fileName;
  }

  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
    });

  if (profileError) {
    return { error: "Failed to update profile. Please try again." };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      country: (formData.get("country") as string) || null,
      currency: formData.get("currency") as string,
      logo_url: logoPath,
      brand_colour: (formData.get("brand_colour") as string) || "#4F46E5",
      invoice_prefix: (formData.get("invoice_prefix") as string) || "INV",
      invoice_start_number: parseInt(
        (formData.get("invoice_start_number") as string) || "1",
        10,
      ),
      default_payment_terms:
        (formData.get("default_payment_terms") as string) || "Net 30",
      invoice_template:
        (formData.get("invoice_template") as string) || "modern",
    })
    .eq("id", business.id);

  if (error) {
    return { error: "Failed to update business. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}
