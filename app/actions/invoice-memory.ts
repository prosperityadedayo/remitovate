"use server";

import { createClient } from "@/lib/supabase/server";
import { ServiceSuggestion } from "@/types";

function getSupabase() {
  return createClient();
}

export async function getFrequentServices(
  businessId: string,
  limit = 5,
): Promise<ServiceSuggestion[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("invoice_items")
      .select("description, unit_price, invoices!inner(business_id, status, created_at)")
      .eq("invoices.business_id", businessId)
      .not("invoices.status", "in", "('draft','cancelled')")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !data) {
      return [];
    }

    const map = new Map<string, { count: number; latestUnitPrice: number; latestDate: string }>();

    for (const item of data as { description: string; unit_price: number; invoices: { created_at: string }[] }[]) {
      const invoice = item.invoices[0];
      if (!invoice) continue;
      const existing = map.get(item.description);
      if (!existing || invoice.created_at > existing.latestDate) {
        map.set(item.description, {
          count: (existing?.count || 0) + 1,
          latestUnitPrice: Number(item.unit_price) || 0,
          latestDate: invoice.created_at,
        });
      } else {
        existing.count += 1;
      }
    }

    return Array.from(map.entries())
      .map(([description, info]) => ({
        description,
        latestUnitPrice: info.latestUnitPrice,
        usageCount: info.count,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getFrequentServicesForCustomer(
  businessId: string,
  customerId: string,
  limit = 5,
): Promise<ServiceSuggestion[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("invoice_items")
      .select("description, unit_price, invoices!inner(business_id, customer_id, status, created_at)")
      .eq("invoices.business_id", businessId)
      .eq("invoices.customer_id", customerId)
      .not("invoices.status", "in", "('draft','cancelled')")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !data) {
      return [];
    }

    const map = new Map<string, { count: number; latestUnitPrice: number; latestDate: string }>();

    for (const item of data as { description: string; unit_price: number; invoices: { created_at: string }[] }[]) {
      const invoice = item.invoices[0];
      if (!invoice) continue;
      const existing = map.get(item.description);
      if (!existing || invoice.created_at > existing.latestDate) {
        map.set(item.description, {
          count: (existing?.count || 0) + 1,
          latestUnitPrice: Number(item.unit_price) || 0,
          latestDate: invoice.created_at,
        });
      } else {
        existing.count += 1;
      }
    }

    return Array.from(map.entries())
      .map(([description, info]) => ({
        description,
        latestUnitPrice: info.latestUnitPrice,
        usageCount: info.count,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  } catch {
    return [];
  }
}
