"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  Search,
  Filter,
  SortAsc,
  X,
} from "lucide-react";
import Link from "next/link";
import { RecentInvoice } from "@/types";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { formatCurrency, formatDateShort } from "@/lib/invoice-utils";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS: { value: string; label: string; field: string; order: "asc" | "desc" }[] = [
  { value: "created_desc", label: "Newest First", field: "created_at", order: "desc" },
  { value: "created_asc", label: "Oldest First", field: "created_at", order: "asc" },
  { value: "due_asc", label: "Due Date (Earliest)", field: "due_date", order: "asc" },
  { value: "due_desc", label: "Due Date (Latest)", field: "due_date", order: "desc" },
  { value: "total_desc", label: "Total (Highest)", field: "total", order: "desc" },
  { value: "total_asc", label: "Total (Lowest)", field: "total", order: "asc" },
];

interface InvoiceListProps {
  invoices: RecentInvoice[];
  currency: string;
  searchQuery: string;
  statusFilter: string;
  sortValue: string;
}

export function InvoiceList({
  invoices,
  currency,
  searchQuery,
  statusFilter,
  sortValue,
}: InvoiceListProps) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const updateURL = useCallback(
    (q: string, status: string, sort: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      if (sort && sort !== "created_desc") {
        const sortOpt = SORT_OPTIONS.find((s) => s.value === sort);
        if (sortOpt) {
          params.set("sort", sortOpt.field);
          params.set("order", sortOpt.order);
        }
      }
      const query = params.toString();
      router.push(`/invoices${query ? `?${query}` : ""}`);
    },
    [router],
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        updateURL(value, statusFilter, sortValue);
      }, 300);
      return () => clearTimeout(timer);
    },
    [statusFilter, sortValue, updateURL],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleStatusFilter = (status: string) => {
    setLocalQuery(searchQuery);
    updateURL(searchQuery, status, sortValue);
  };

  const handleSort = (sort: string) => {
    updateURL(searchQuery, statusFilter, sort);
  };

  const clearFilters = () => {
    setLocalQuery("");
    router.push("/invoices");
  };

  const hasActiveFilters =
    (localQuery && localQuery.trim()) ||
    (statusFilter && statusFilter !== "all");

  const getStatusLabel = (value: string) =>
    STATUS_FILTERS.find((s) => s.value === value)?.label || "All Statuses";

  const getSortLabel = (value: string) =>
    SORT_OPTIONS.find((s) => s.value === value)?.label || "Newest First";

  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Invoices
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your invoices and track payments.
            </p>
          </div>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              value={localQuery}
              onChange={handleSearchChange}
              placeholder="Search by invoice number or customer name..."
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {getStatusLabel(statusFilter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {STATUS_FILTERS.map((filter) => (
                <DropdownMenuItem
                  key={filter.value}
                  onClick={() => handleStatusFilter(filter.value)}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                {getSortLabel(sortValue)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 text-lg font-medium">No invoices yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first invoice to start tracking payments.
            </p>
            <Button asChild className="mt-4">
              <Link href="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-muted-foreground">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} total
            {statusFilter && statusFilter !== "all" && (
              <span> · Filtered by {getStatusLabel(statusFilter)}</span>
            )}
            {localQuery && localQuery.trim() && (
              <span> · Matching &quot;{localQuery}&quot;</span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            value={localQuery}
            onChange={handleSearchChange}
            placeholder="Search by invoice number or customer name..."
            className="pl-9"
          />
          {localQuery && localQuery.trim() && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery("");
                updateURL("", statusFilter, sortValue);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {getStatusLabel(statusFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STATUS_FILTERS.map((filter) => (
              <DropdownMenuItem
                key={filter.value}
                onClick={() => handleStatusFilter(filter.value)}
              >
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              {getSortLabel(sortValue)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSort(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <Link
            key={invoice.id}
            href={`/invoices/${invoice.id}`}
            className="group block"
          >
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium group-hover:underline">
                      {invoice.invoice_number}
                    </p>
                    <InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {invoice.customer_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(invoice.total, currency, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDateShort(invoice.due_date)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
