"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RecentInvoice, BusinessSetupStatus } from "@/types";

function getSupabase() {
  return createClient();
}

export async function getBusinessId() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return null;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id, currency")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return null;
  }

  return { id: business.id, currency: business.currency || "NGN" };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const business = await getBusinessId();

    if (!business) {
      return {
        totalInvoiced: 0,
        paid: 0,
        outstanding: 0,
        overdue: 0,
        currency: "NGN",
      };
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      p_business_id: business.id,
    });

    if (error || !data || data.length === 0) {
      return {
        totalInvoiced: 0,
        paid: 0,
        outstanding: 0,
        overdue: 0,
        currency: business.currency,
      };
    }

    const row = data[0];
    return {
      totalInvoiced: Number(row.total_invoiced) || 0,
      paid: Number(row.paid) || 0,
      outstanding: Number(row.outstanding) || 0,
      overdue: Number(row.overdue) || 0,
      currency: business.currency,
    };
  } catch {
    return {
      totalInvoiced: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
      currency: "NGN",
    };
  }
}

export async function getRecentInvoices(): Promise<RecentInvoice[]> {
  try {
    const business = await getBusinessId();

    if (!business) {
      return [];
    }

    const supabase = await getSupabase();
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, status, total, due_date, invoice_date, customers ( name )",
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !invoices) {
      return [];
    }

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: (invoice as { customers?: { name?: string } }).customers?.name || "Unknown",
      status: invoice.status,
      total: Number(invoice.total) || 0,
      due_date: invoice.due_date,
      invoice_date: invoice.invoice_date,
    }));
  } catch {
    return [];
  }
}

export async function getBusinessSetupStatus(): Promise<BusinessSetupStatus> {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return { hasProfile: false, hasCustomers: false, hasInvoices: false };
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!business) {
      return { hasProfile: false, hasCustomers: false, hasInvoices: false };
    }

    const [{ count: customerCount }, { count: invoiceCount }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id),
      ]);

    return {
      hasProfile: true,
      hasCustomers: (customerCount || 0) > 0,
      hasInvoices: (invoiceCount || 0) > 0,
    };
  } catch {
    return { hasProfile: false, hasCustomers: false, hasInvoices: false };
  }
}
