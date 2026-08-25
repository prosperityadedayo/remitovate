"use server";

import { createClient } from "@/lib/supabase/server";

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

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

export async function generateReminderText(
  invoiceId: string,
): Promise<{ email: string; whatsapp: string } | null> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return null;
    }

    const supabase = await getSupabase();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        "*, customers (*), businesses (*)",
      )
      .eq("id", invoiceId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error || !invoice) {
      return null;
    }

    const customer = invoice.customers as { name?: string; email?: string; phone?: string } | null;
    const business = invoice.businesses as { name?: string; email?: string; payment_information?: string } | null;

    const customerName = customer?.name || "Customer";
    const businessName = business?.name || "We";
    const businessEmail = business?.email || "";
    const paymentInfo = business?.payment_information || "";
    const total = formatCurrency(Number(invoice.total) || 0, "NGN");
    const invoiceNumber = invoice.invoice_number;
    const dueDate = new Date(invoice.due_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const isOverdue = invoice.status === "sent" && new Date(invoice.due_date) < new Date();

    const emailLines = [
      `Subject: Friendly Reminder: Invoice ${invoiceNumber} from ${businessName}`,
      "",
      `Dear ${customerName},`,
      "",
      `I hope you're doing well. This is a friendly reminder that invoice ${invoiceNumber} for ${total} was due on ${dueDate}.`,
      "",
      `If you've already sent the payment, please ignore this reminder. If not, we'd greatly appreciate it if you could process the payment at your earliest convenience.`,
      ...(paymentInfo
        ? [
            "",
            `Payment details:`,
            ...paymentInfo.split("\n").map((line) => `  ${line}`),
          ]
        : []),
      "",
      `If you have any questions or need additional information, please don't hesitate to reach out.`,
      "",
      `Thank you for your business!`,
      "",
      `Best regards,`,
      `${businessName}`,
      `${businessEmail || ""}`,
    ];

    const whatsappLines = [
      `Hi ${customerName}, this is a friendly reminder from ${businessName}.`,
      `Invoice ${invoiceNumber} for ${total} was due on ${dueDate}.`,
      ...(isOverdue ? ["This invoice is now overdue."] : []),
      ...(paymentInfo
        ? [
            "",
            `Payment details:`,
            ...paymentInfo.split("\n").map((line) => `• ${line}`),
          ]
        : []),
      "",
      `Please let us know if you have any questions. Thank you!`,
    ];

    return {
      email: emailLines.join("\n"),
      whatsapp: whatsappLines.join("\n"),
    };
  } catch {
    return null;
  }
}

export async function recordReminderSent(
  invoiceId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return { error: "You must have a business to record reminders." };
    }

    const supabase = await getSupabase();
    const { error } = await supabase
      .from("invoices")
      .update({ last_reminded_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("business_id", businessId);

    if (error) {
      return { error: "Failed to record reminder. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Failed to record reminder. Please try again." };
  }
}
