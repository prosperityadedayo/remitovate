"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface InvoiceReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  texts: { email: string; whatsapp: string } | null;
  error: string | null;
  onCopy: (type: "email" | "whatsapp") => Promise<void>;
}

export function InvoiceReminderDialog({
  open,
  onOpenChange,
  invoiceId,
  customerEmail,
  customerPhone,
  texts,
  error,
  onCopy,
}: InvoiceReminderDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<"email" | "whatsapp" | null>(null);
  const [isCopying, setIsCopying] = useState<"email" | "whatsapp" | null>(null);
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab("email");
      setCopied(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleCopy = async (type: "email" | "whatsapp") => {
    setIsCopying(type);
    try {
      await onCopy(type);
      setCopied(type);
      toast({
        variant: "success",
        title: "Copied to clipboard",
        description: "Reminder text copied. Paste it into your email or WhatsApp.",
      });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy. Please select and copy the text manually.",
      });
    } finally {
      setIsCopying(null);
    }
  };

  const mailtoHref = texts
    ? `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(`Reminder: Invoice ${invoiceId}`)}&body=${encodeURIComponent(texts.email)}`
    : "#";

  const whatsappHref = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(texts?.whatsapp || "")}`
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={dialogRef}
        className="relative z-50 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Send a reminder</h2>
            <p className="text-sm text-muted-foreground">
              Copy or open the reminder text below. The customer has not been notified automatically — you need to send it manually.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="py-8 text-center text-sm text-destructive">{error}</div>
        ) : !texts ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading reminder text...
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("email")}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                variant={activeTab === "whatsapp" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("whatsapp")}
                className="flex-1"
                disabled={!customerPhone}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            {activeTab === "email" && (
              <div className="space-y-3">
                <textarea
                  readOnly
                  value={texts.email}
                  className="min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground shadow-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy("email")}
                    disabled={isCopying === "email"}
                  >
                    {copied === "email" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied === "email" ? "Copied" : "Copy"}
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <a href={mailtoHref} target="_blank" rel="noopener noreferrer">
                      <Mail className="mr-2 h-4 w-4" />
                      Open Email
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "whatsapp" && (
              <div className="space-y-3">
                {!customerPhone ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No phone number available for this customer.
                  </div>
                ) : (
                  <>
                    <textarea
                      readOnly
                      value={texts?.whatsapp || ""}
                      className="min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground shadow-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopy("whatsapp")}
                        disabled={isCopying === "whatsapp"}
                      >
                        {copied === "whatsapp" ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied === "whatsapp" ? "Copied" : "Copy"}
                      </Button>
                      {whatsappHref && (
                        <Button asChild size="sm" className="flex-1">
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Open WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
