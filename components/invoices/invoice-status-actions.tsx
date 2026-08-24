"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Send, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { InvoiceStatus } from "@/types";
import {
  getEffectiveStatus,
  getAvailableTransitions,
  getStatusTransitionLabel,
} from "@/lib/invoice-utils";
import { useToast } from "@/components/ui/toast";
import { updateInvoiceStatus } from "@/app/actions/invoices";

interface InvoiceStatusActionsProps {
  invoiceId: string;
  status: string;
  dueDate?: string;
}

const TRANSITION_ICONS: Record<string, React.ElementType> = {
  sent: Send,
  paid: CheckCircle2,
  cancelled: XCircle,
  draft: RefreshCw,
};

export function InvoiceStatusActions({
  invoiceId,
  status,
  dueDate,
}: InvoiceStatusActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const effectiveStatus = dueDate
    ? getEffectiveStatus(status, dueDate)
    : (status as InvoiceStatus);

  const availableTransitions = getAvailableTransitions(effectiveStatus);

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdating) return;

    setIsUpdating(true);
    const result = await updateInvoiceStatus(invoiceId, newStatus);

    if (result && "error" in result) {
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: result.error,
      });
      setIsUpdating(false);
      return;
    }

    toast({
      variant: "success",
      title: "Status updated",
      description: `Invoice marked as ${newStatus}.`,
    });

    router.refresh();
    setIsUpdating(false);
  };

  if (availableTransitions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-1"
          aria-label="Invoice status actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Mark as
        </div>
        {availableTransitions.map((transition) => {
          const Icon = TRANSITION_ICONS[transition] || null;
          return (
            <DropdownMenuItem
              key={transition}
              onClick={() => handleStatusChange(transition)}
              disabled={isUpdating}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              <span>{getStatusTransitionLabel(transition)}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
