"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardStats, RecentInvoice } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return {
      totalInvoiced: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
    };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return {
      totalInvoiced: 0,
      paid: 0,
      outstanding: 0,
      overdue: 0,
    };
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("business_id", business.id);

  const stats: DashboardStats = {
    totalInvoiced: 0,
    paid: 0,
    outstanding: 0,
    overdue: 0,
  };

  invoices?.forEach((invoice) => {
    stats.totalInvoiced += Number(invoice.total) || 0;
    if (invoice.status === "paid") stats.paid += Number(invoice.total) || 0;
    if (invoice.status === "sent") stats.outstanding += Number(invoice.total) || 0;
    if (invoice.status === "overdue") stats.overdue += Number(invoice.total) || 0;
  });

  return stats;
}

export async function getRecentInvoices(): Promise<RecentInvoice[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return [];
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return [];
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, due_date, invoice_date, customer_id, customers ( name )")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!invoices) {
    return [];
  }

  interface InvoiceWithCustomer {
    id: string;
    invoice_number: string;
    status: string;
    total: string | number;
    due_date: string;
    invoice_date: string;
    customers?: { name?: string };
  }

  return invoices.map((invoice) => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: (invoice as InvoiceWithCustomer).customers?.name || "Unknown",
    status: invoice.status,
    total: Number(invoice.total) || 0,
    due_date: invoice.due_date,
    invoice_date: invoice.invoice_date,
  }));
}
