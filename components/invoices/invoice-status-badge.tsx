"use client";

import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types";
import {
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { getEffectiveStatus, getStatusVariant } from "@/lib/invoice-utils";

interface InvoiceStatusBadgeProps {
  status: string;
  dueDate?: string;
  showIcon?: boolean;
  className?: string;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  paid: CheckCircle2,
  sent: FileText,
  overdue: AlertCircle,
  cancelled: XCircle,
  draft: Clock,
};

export function InvoiceStatusBadge({
  status,
  dueDate,
  showIcon = true,
  className,
}: InvoiceStatusBadgeProps) {
  const effectiveStatus = dueDate
    ? getEffectiveStatus(status, dueDate)
    : (status as InvoiceStatus);

  const Icon = STATUS_ICONS[effectiveStatus] || Clock;
  const iconColor = {
    paid: "text-green-600 dark:text-green-400",
    sent: "text-blue-600 dark:text-blue-400",
    overdue: "text-red-600 dark:text-red-400",
    cancelled: "text-muted-foreground",
    draft: "text-muted-foreground",
  }[effectiveStatus] || "text-muted-foreground";

  return (
    <Badge variant={getStatusVariant(effectiveStatus)} className={className}>
      {showIcon && <Icon className={`h-4 w-4 ${iconColor}`} />}
      <span className="ml-1 capitalize">{effectiveStatus}</span>
    </Badge>
  );
}

export function getStatusIcon(status: string): React.ReactNode {
  const Icon = STATUS_ICONS[status] || Clock;
  const iconColor = {
    paid: "text-green-600 dark:text-green-400",
    sent: "text-blue-600 dark:text-blue-400",
    overdue: "text-red-600 dark:text-red-400",
    cancelled: "text-muted-foreground",
    draft: "text-muted-foreground",
  }[status] || "text-muted-foreground";

  return <Icon className={`h-4 w-4 ${iconColor}`} />;
}
