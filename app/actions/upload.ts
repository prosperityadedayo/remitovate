"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSignedLogoUrl(path: string): Promise<string | null> {
  if (!path) return null;

  const supabase = await createClient();

  const { data: signedUrlData, error } = await supabase.storage
    .from("business-logos")
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (error) {
    return null;
  }

  return signedUrlData?.signedUrl || null;
}
