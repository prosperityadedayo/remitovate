"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { InvoiceWithItems } from "@/types";
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Share2,
  Copy,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getEffectiveStatus,
} from "@/lib/invoice-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceStatusActions } from "./invoice-status-actions";
import { InvoiceDeleteButton } from "./invoice-delete-button";
import { InvoiceDocument } from "./invoice-document";
import { useToast } from "@/components/ui/toast";

interface InvoicePreviewProps {
  invoice: InvoiceWithItems;
  logoUrl: string | null;
}

export function InvoicePreview({ invoice, logoUrl }: InvoicePreviewProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const currency = invoice.businesses.currency || "NGN";
  const effectiveStatus = getEffectiveStatus(invoice.status, invoice.due_date);
  const isEditable = effectiveStatus !== "paid" && effectiveStatus !== "cancelled";

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Please log in again to download the PDF.",
          });
          return;
        }
        throw new Error("PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        variant: "success",
        title: "PDF downloaded",
        description: `Invoice #${invoice.invoice_number} has been downloaded.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to generate PDF. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [invoice.id, invoice.invoice_number, toast]);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, []);

  const buildShareText = useCallback(() => {
    const lines = [
      `Invoice #${invoice.invoice_number} from ${invoice.businesses.name}`,
      `Total: ${formatCurrency(invoice.total, currency)}`,
      `Due: ${formatDate(invoice.due_date)}`,
      "",
      invoice.payment_information
        ? `Payment: ${invoice.payment_information.split("\n")[0]}`
        : "",
      "",
      `View: ${window.location.origin}/invoices/${invoice.id}`,
    ].filter(Boolean);

    return lines.join("\n");
  }, [invoice, currency]);

  const handleShareSummary = useCallback(async () => {
    const text = buildShareText();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast({
          variant: "success",
          title: "Summary copied",
          description: "Invoice summary copied to clipboard.",
        });
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy. Please try manually.",
      });
    }
  }, [buildShareText, toast]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/invoices/${invoice.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        variant: "success",
        title: "Link copied",
        description: "Invoice link copied to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy link. Please try manually.",
      });
    }
  }, [invoice.id, toast]);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Invoices
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            {isPrinting ? "Printing..." : "Print Invoice"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShareSummary}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Summary</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <LinkIcon className="mr-2 h-4 w-4" />
                <span>Copy Link</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isEditable && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <InvoiceStatusActions
            invoiceId={invoice.id}
            status={invoice.status}
            dueDate={invoice.due_date}
          />
          <InvoiceDeleteButton
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
          />
        </div>
      </div>

      <InvoiceDocument invoice={invoice} logoUrl={logoUrl} />
    </div>
  );
}
