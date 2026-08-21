"use client";

import { useState } from "react";
import Image from "next/image";
import { createBusiness } from "@/app/actions/business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandColour, setBrandColour] = useState("#4F46E5");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (logoFile) {
      formData.set("logo", logoFile);
    }
    formData.set("brand_colour", brandColour);

    const result = await createBusiness(formData);
    if (result && "error" in result) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    } else {
      setLogoPreview(null);
      setLogoFile(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Set up your business
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure your business details to get started with Remitovate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Tell us about your business so we can personalize your experience
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
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Remitovate Business"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
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
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Nigeria"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="15 Broad Street, Lagos Island, Lagos"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_payment_terms">Default Payment Terms *</Label>
                <select
                  id="default_payment_terms"
                  name="default_payment_terms"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix *</Label>
                <Input
                  id="invoice_prefix"
                  name="invoice_prefix"
                  placeholder="INV"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_start_number">Starting Invoice Number *</Label>
                <Input
                  id="invoice_start_number"
                  name="invoice_start_number"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_template">Invoice Template *</Label>
              <select
                id="invoice_template"
                name="invoice_template"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
                    const custom = prompt("Enter custom hex colour (e.g. #FF5733):");
                    if (custom && /^#[0-9A-Fa-f]{6}$/.test(custom)) {
                      setBrandColour(custom);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  +
                </button>
              </div>
              <input
                type="hidden"
                name="brand_colour"
                value={brandColour}
              />
            </div>

            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <span className="text-xs">Logo</span>
                    </div>
                  )}
                </div>
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full max-w-xs"
                />
              </div>
            </div>

            <input type="hidden" name="full_name" value="" />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
