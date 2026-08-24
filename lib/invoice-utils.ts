import { InvoiceStatus } from "@/types";

export function getEffectiveStatus(status: string, dueDate: string): InvoiceStatus {
  if (status === "sent") {
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) {
      return "overdue";
    }
  }
  return status as InvoiceStatus;
}

export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "sent":
      return "secondary";
    case "overdue":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "outline";
  }
}

const STATUS_TRANSITIONS: Record<string, InvoiceStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "cancelled"],
  paid: ["cancelled"],
  overdue: ["paid", "cancelled"],
  cancelled: ["draft"],
};

export function getAvailableTransitions(currentStatus: string): InvoiceStatus[] {
  const underlying = currentStatus === "overdue" ? "sent" : currentStatus;
  return STATUS_TRANSITIONS[underlying] || [];
}

const STATUS_TRANSITION_LABELS: Record<string, string> = {
  sent: "Mark as Sent",
  paid: "Mark as Paid",
  cancelled: "Cancel Invoice",
  draft: "Reopen as Draft",
};

export function getStatusTransitionLabel(to: InvoiceStatus): string {
  return STATUS_TRANSITION_LABELS[to] || to;
}

export function formatCurrency(
  amount: number,
  currency: string,
  maximumFractionDigits: number = 2,
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits,
    }).format(amount);
  }
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}
