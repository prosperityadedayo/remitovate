"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Business } from "@/types";
import { updateBusiness } from "@/app/actions/business";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { LogoUpload } from "@/components/dashboard/logo-upload";

const CURRENCIES = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "INR", label: "INR — Indian Rupee" },
];

const TEMPLATES = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "minimal", label: "Minimal" },
];

const PAYMENT_TERMS = [
  { value: "Net 7", label: "Net 7" },
  { value: "Net 14", label: "Net 14" },
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
  { value: "Due on Receipt", label: "Due on Receipt" },
];

const BRAND_COLOURS = [
  "#4F46E5",
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
];

interface BusinessFormProps {
  business: Business;
  logoUrl: string | null;
}

export function BusinessForm({ business, logoUrl }: BusinessFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandColour, setBrandColour] = useState(business.brand_colour || "#4F46E5");

  const [currency, setCurrency] = useState(business.currency || "NGN");
  const [paymentTerms, setPaymentTerms] = useState(
    business.default_payment_terms || "Net 30",
  );
  const [invoiceTemplate, setInvoiceTemplate] = useState(
    business.invoice_template || "modern",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("brand_colour", brandColour);
    formData.set("currency", currency);
    formData.set("default_payment_terms", paymentTerms);
    formData.set("invoice_template", invoiceTemplate);

    if (logoFile) {
      formData.set("logo", logoFile);
    }

    const result = await updateBusiness(formData);

    if (result && "error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    toast({
      variant: "success",
      title: "Business updated",
      description: "Your business details have been saved.",
    });

    setIsLoading(false);
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              &larr; Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Business Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Update your business details, branding, and invoice preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            These details appear on all your invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={business.name}
                  placeholder="Remitovate Business"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={business.email}
                  placeholder="hello@yourbusiness.com.ng"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={business.phone ?? ""}
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={business.country ?? ""}
                  placeholder="Nigeria"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={business.address ?? ""}
                placeholder="15 Broad Street, Lagos Island, Lagos"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  placeholder="Select a currency"
                  aria-label="Select a currency"
                  options={CURRENCIES}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_payment_terms">
                  Default Payment Terms *
                </Label>
                <Select
                  value={paymentTerms}
                  onValueChange={setPaymentTerms}
                  placeholder="Select payment terms"
                  aria-label="Select default payment terms"
                  options={PAYMENT_TERMS}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix *</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  defaultValue={business.invoice_prefix || "INV"}
                  placeholder="INV"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_start_number">
                  Starting Invoice Number *
                </Label>
                <Input
                  id="invoice_start_number"
                  name="invoice_start_number"
                  type="number"
                  min="1"
                  defaultValue={business.invoice_start_number || 1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_template">Invoice Template *</Label>
              <Select
                value={invoiceTemplate}
                onValueChange={setInvoiceTemplate}
                placeholder="Select a template"
                aria-label="Select invoice template"
                options={TEMPLATES}
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Colour</Label>
              <div className="flex flex-wrap items-center gap-3">
                {BRAND_COLOURS.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => setBrandColour(colour)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 shadow-sm transition-all",
                      brandColour === colour
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50",
                    )}
                    style={{ backgroundColor: colour }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const custom = prompt(
                      "Enter custom hex colour (e.g. #FF5733):",
                    );
                    if (custom && /^#[0-9A-Fa-f]{6}$/.test(custom)) {
                      setBrandColour(custom);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  +
                </button>
              </div>
              <input type="hidden" name="brand_colour" value={brandColour} />
            </div>

            <div className="space-y-2">
              <Label>Business Logo</Label>
              <LogoUpload
                onChange={(file) => setLogoFile(file)}
                value={logoUrl}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
