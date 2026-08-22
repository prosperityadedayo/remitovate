"use server";

import { createClient } from "@/lib/supabase/server";
import { Customer, Business, InvoiceWithItems, InvoiceLineItemInput, InvoiceItem, RecentInvoice } from "@/types";

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return null;
  }

  return business.id;
}

export async function getCustomersForInvoice(): Promise<Customer[]> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return [];
    }

    const supabase = await getSupabase();
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (error || !customers) {
      return [];
    }

    return customers;
  } catch {
    return [];
  }
}

export async function getBusinessForInvoice(): Promise<Business | null> {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return null;
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !business) {
      return null;
    }

    return business;
  } catch {
    return null;
  }
}

export async function createInvoice(data: {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  paymentInformation?: string;
  items: InvoiceLineItemInput[];
}): Promise<{ success: true; invoiceId: string } | { error: string }> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return { error: "You must have a business to create invoices." };
    }

    const supabase = await getSupabase();

    // Validate customer belongs to business
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", data.customerId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (customerError || !customer) {
      return { error: "Invalid customer selected." };
    }

    // Validate invoice date
    const invoiceDate = new Date(data.invoiceDate);
    if (isNaN(invoiceDate.getTime())) {
      return { error: "Invalid invoice date." };
    }

    // Validate due date
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      return { error: "Invalid due date." };
    }

    if (dueDate < invoiceDate) {
      return { error: "Due date cannot be before the invoice date." };
    }

    // Validate line items
    if (!data.items || data.items.length === 0) {
      return { error: "Add at least one line item." };
    }

    const validatedItems = data.items.map((item, index) => {
      const description = item.description.trim();
      if (!description) {
        throw new Error(`Item ${index + 1} must have a description.`);
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Item ${index + 1} quantity must be greater than 0.`);
      }

      const unitPrice = Number(item.unit_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new Error(`Item ${index + 1} unit price cannot be negative.`);
      }

      const discountAmount = Number(item.discount_amount);
      if (isNaN(discountAmount) || discountAmount < 0) {
        throw new Error(`Item ${index + 1} discount cannot be negative.`);
      }

      if (item.discount_type === "percentage") {
        const discountPercent = Number(item.discount_amount);
        if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
          throw new Error(`Item ${index + 1} discount percentage must be between 0 and 100.`);
        }
      }

      if (!["percentage", "fixed"].includes(item.discount_type)) {
        throw new Error(`Item ${index + 1} has an invalid discount type.`);
      }

      const taxRate = Number(item.tax_rate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error(`Item ${index + 1} tax rate must be between 0 and 100.`);
      }

      return {
        description,
        quantity,
        unit_price: unitPrice,
        discount_amount: discountAmount,
        discount_type: item.discount_type,
        tax_rate: taxRate,
      };
    });

    // Call RPC
    const { data: invoiceId, error: rpcError } = await supabase.rpc(
      "create_invoice_with_items",
      {
        p_business_id: businessId,
        p_customer_id: data.customerId,
        p_status: "draft",
        p_invoice_date: data.invoiceDate,
        p_due_date: data.dueDate,
        p_notes: data.notes || null,
        p_payment_information: data.paymentInformation || null,
        p_items: validatedItems,
      }
    );

    if (rpcError) {
      if (rpcError.code === "23505") {
        return { error: "This invoice number already exists. Please try again." };
      }
      if (process.env.NODE_ENV === "development") {
        return { error: `Database error: ${rpcError.message}` };
      }
      return { error: "Failed to create invoice. Please try again." };
    }

    if (!invoiceId) {
      return { error: "Failed to create invoice. Please try again." };
    }

    return { success: true, invoiceId: String(invoiceId) };
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Failed to create invoice. Please try again." };
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceWithItems | null> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return null;
    }

    const supabase = await getSupabase();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        "*, customers (*), businesses (*), invoice_items (*)",
      )
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error || !invoice) {
      return null;
    }

    const transformed: InvoiceWithItems = {
      ...invoice,
      items: (invoice as { invoice_items?: InvoiceItem[] }).invoice_items || [],
    };

    return transformed as InvoiceWithItems;
  } catch {
    return null;
  }
}

export async function getInvoices(): Promise<RecentInvoice[]> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return [];
    }

    const supabase = await getSupabase();
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, status, total, due_date, invoice_date, customers ( name )",
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

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
