"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPublicLogoUrl(path: string): Promise<string | null> {
  if (!path) return null;

  const supabase = await createClient();

  const { data: publicUrlData } = supabase.storage
    .from("business-logos")
    .getPublicUrl(path);

  return publicUrlData?.publicUrl || null;
}
