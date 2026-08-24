"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { deleteInvoice } from "@/app/actions/invoices";

interface InvoiceDeleteButtonProps {
  invoiceId: string;
  invoiceNumber?: string;
}

export function InvoiceDeleteButton({
  invoiceId,
  invoiceNumber = "",
}: InvoiceDeleteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    const result = await deleteInvoice(invoiceId);

    if (result && "error" in result) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.error,
      });
      setDeleting(false);
      return;
    }

    toast({
      variant: "success",
      title: "Invoice deleted",
      description: `Invoice #${invoiceNumber || ""} has been removed.`,
    });

    await router.push("/invoices");
    router.refresh();
  };

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5">
        <span className="text-xs text-muted-foreground">
          This cannot be undone.
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirmDelete(true)}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete invoice"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
