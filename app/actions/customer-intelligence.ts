"use server";

import { createClient } from "@/lib/supabase/server";
import { CustomerIntelligence, InvoiceHistoryEntry, ServiceSuggestion } from "@/types";
import { getFrequentServicesForCustomer } from "./invoice-memory";

function getSupabase() {
  return createClient();
}

async function getBusinessId() {
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

export async function getCustomerIntelligence(
  customerId: string,
): Promise<CustomerIntelligence | null> {
  try {
    const business = await getBusinessId();

    if (!business) {
      return null;
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase.rpc("get_customer_intelligence", {
      p_customer_id: customerId,
    });

    if (error || !data || data.length === 0) {
      return {
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        invoiceCount: 0,
        paidCount: 0,
        outstandingCount: 0,
        overdueCount: 0,
        latestInvoiceDate: null,
        currency: business.currency,
      };
    }

    const row = data[0];
    return {
      totalInvoiced: Number(row.total_invoiced) || 0,
      totalPaid: Number(row.total_paid) || 0,
      totalOutstanding: Number(row.total_outstanding) || 0,
      totalOverdue: Number(row.total_overdue) || 0,
      invoiceCount: Number(row.invoice_count) || 0,
      paidCount: Number(row.paid_count) || 0,
      outstandingCount: Number(row.outstanding_count) || 0,
      overdueCount: Number(row.overdue_count) || 0,
      latestInvoiceDate: row.latest_invoice_date || null,
      currency: business.currency,
    };
  } catch {
    return null;
  }
}

export async function getCustomerInvoiceHistory(
  customerId: string,
): Promise<InvoiceHistoryEntry[]> {
  try {
    const business = await getBusinessId();

    if (!business) {
      return [];
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, due_date, status, total")
      .eq("customer_id", customerId)
      .eq("business_id", business.id)
      .order("invoice_date", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      total: Number(invoice.total) || 0,
    }));
  } catch {
    return [];
  }
}

export async function getCustomerFrequentServices(
  customerId: string,
  limit = 5,
): Promise<ServiceSuggestion[]> {
  try {
    const business = await getBusinessId();

    if (!business) {
      return [];
    }

    return getFrequentServicesForCustomer(business.id, customerId, limit);
  } catch {
    return [];
  }
}
