"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/types";
import { createCustomer, updateCustomer } from "@/app/actions/customers";
import { useToast } from "@/components/ui/toast";

interface CustomerFormProps {
  customer?: Customer;
  mode: "create" | "edit";
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let result;
    if (mode === "edit" && customer) {
      result = await updateCustomer(customer.id, formData);
    } else {
      result = await createCustomer(formData);
    }

    if (result && "error" in result) {
      setError(result.error!);
      setIsLoading(false);
      return;
    }

    if (mode === "edit" && customer) {
      toast({
        variant: "success",
        title: "Customer updated",
        description: `${customer.name}'s details have been saved.`,
      });
      await router.push(`/customers/${customer.id}`);
    } else {
      toast({
        variant: "success",
        title: "Customer created",
        description: "Your new customer has been added.",
      });
      await router.push("/customers");
    }
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {mode === "create" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/customers">
                ← Back
              </Link>
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {mode === "edit" ? "Edit Customer" : "Add Customer"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "edit"
            ? "Update your customer's contact details."
            : "Add a new customer to speed up invoicing."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            {mode === "edit"
              ? "Update the details below."
              : "Fill in the details below to add a new customer."}
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
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={customer?.name}
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer?.email}
                  placeholder="hello@acme.com"
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
                  defaultValue={customer?.phone}
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={customer?.country}
                  placeholder="Nigeria"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={customer?.address}
                placeholder="15 Broad Street, Lagos Island, Lagos"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={mode === "edit" && customer ? `/customers/${customer.id}` : "/customers"}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading
                  ? mode === "edit"
                    ? "Saving..."
                    : "Adding..."
                  : mode === "edit"
                  ? "Save Changes"
                  : "Add Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
