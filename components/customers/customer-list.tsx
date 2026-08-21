"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Mail, Phone, MapPin, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Customer } from "@/types";
import { deleteCustomer } from "@/app/actions/customers";
import { useToast } from "@/components/ui/toast";

interface CustomerListProps {
  customers: Customer[];
  searchQuery: string;
}

export function CustomerList({ customers, searchQuery }: CustomerListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        router.push(`/customers${value ? `?q=${encodeURIComponent(value)}` : ""}`);
      }, 300);
      return () => clearTimeout(timer);
    },
    [router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleDelete = async (id: string, customerName: string) => {
    setDeletingId(id);

    const result = await deleteCustomer(id);

    if (result && "error" in result) {
      toast({
        variant: "destructive",
        title: "Cannot delete customer",
        description: result.error,
      });
      setDeletingId(null);
      return;
    }

    toast({
      variant: "success",
      title: "Customer deleted",
      description: `${customerName} has been removed.`,
    });

    setConfirmDeleteId(null);
    setDeletingId(null);
    router.refresh();
  };

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Customers
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your customers and their contact details.
            </p>
          </div>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first customer to make invoicing faster.
          </p>
          <Button asChild className="mt-4">
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="mt-1 text-muted-foreground">
            {customers.length} {customers.length === 1 ? "customer" : "customers"} total
            {searchQuery ? ` matching "${searchQuery}"` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            value={localQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or phone..."
            className="pl-9"
          />
        </div>
        {localQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setLocalQuery("");
              router.push("/customers");
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/customers/${customer.id}`}
                  className="font-medium hover:underline"
                >
                  {customer.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.country && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {customer.country}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={`/customers/${customer.id}/edit`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Edit ${customer.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>

              {confirmDeleteId === customer.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Delete?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id, customer.name)}
                    disabled={deletingId === customer.id}
                  >
                    {deletingId === customer.id ? "Deleting..." : "Yes"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConfirmDeleteId(null);
                    }}
                  >
                    No
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDeleteId(customer.id)}
                  aria-label={`Delete ${customer.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomerListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
