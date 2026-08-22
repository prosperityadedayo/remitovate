"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Customer, Business } from "@/types";
import { createInvoice } from "@/app/actions/invoices";
import { Users, Plus, Trash2, ArrowLeft } from "lucide-react";

interface InvoiceBuilderProps {
  customers: Customer[];
  business: Business;
}

const DISCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "%" },
];

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

function getDefaultDueDate(paymentTerms: string): string {
  const match = paymentTerms.match(/\d+/);
  const days = match ? parseInt(match[0], 10) : 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function InvoiceBuilder({ customers, business }: InvoiceBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const defaultDueDate = getDefaultDueDate(business.default_payment_terms);

  const uniqueId = useId();

  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState("");
  const [paymentInformation, setPaymentInformation] = useState("");
  const [items, setItems] = useState([
    {
      id: `${uniqueId}-0`,
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      discount_type: "fixed" as "percentage" | "fixed",
      tax_rate: 0,
    },
  ]);

  const calculateItem = (item: typeof items[0]) => {
    const subtotal = item.quantity * item.unit_price;
    const discount =
      item.discount_type === "percentage"
        ? subtotal * (item.discount_amount / 100)
        : item.discount_amount;
    const taxable = subtotal - discount;
    const tax = taxable * (item.tax_rate / 100);
    const total = taxable + tax;
    return { subtotal, discount, tax, total };
  };

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        const { subtotal, discount, tax, total } = calculateItem(item);
        return {
          subtotal: acc.subtotal + subtotal,
          discount: acc.discount + discount,
          tax: acc.tax + tax,
          total: acc.total + total,
        };
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );
  };

  const totals = calculateTotals();

  const updateItem = (id: string, updates: Partial<typeof items[0]>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `${uniqueId}-${prev.length}`,
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_type: "fixed",
        tax_rate: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!customerId) {
      const msg = "Please select a customer.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Missing customer",
        description: msg,
      });
      setIsLoading(false);
      return;
    }

    const result = await createInvoice({
      customerId,
      invoiceDate,
      dueDate,
      notes: notes || undefined,
      paymentInformation: paymentInformation || undefined,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        discount_type: item.discount_type,
        tax_rate: item.tax_rate,
      })),
    });

    if (result && "error" in result) {
      setError(result.error);
      toast({
        variant: "destructive",
        title: "Invoice not saved",
        description: result.error,
      });
      setIsLoading(false);
      return;
    }

    toast({
      variant: "success",
      title: "Invoice saved",
      description: `Invoice created successfully.`,
    });

    setTimeout(() => {
      router.push(`/invoices/${result.invoiceId}`);
      router.refresh();
    }, 400);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          New Invoice
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create a new invoice for your customer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No customers yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first customer before creating an invoice.
              </p>
              <Button asChild className="mt-4">
                <Link href="/customers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
                <CardDescription>
                  Select an existing customer for this invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={customerId}
                    onValueChange={setCustomerId}
                    placeholder="Select a customer"
                    aria-label="Select a customer"
                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment instructions, thank you note, etc."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentInformation">Payment Information</Label>
                    <textarea
                      id="paymentInformation"
                      value={paymentInformation}
                      onChange={(e) => setPaymentInformation(e.target.value)}
                      placeholder="Bank details, payment methods, etc."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>
                  Add the items you are invoicing for.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Item {index + 1}
                        </span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove item ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${item.id}`}>
                          Description *
                        </Label>
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, { description: e.target.value })
                          }
                          placeholder="Website design, Consulting, etc."
                          required
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${item.id}`}>
                            Quantity *
                          </Label>
                          <Input
                            id={`quantity-${item.id}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, {
                                quantity: parseFloat(e.target.value) || 0,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`unitPrice-${item.id}`}>
                            Unit Price *
                          </Label>
                          <Input
                            id={`unitPrice-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(item.id, {
                                unit_price: parseFloat(e.target.value) || 0,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`discount-${item.id}`}>
                            Discount
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`discount-${item.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount_amount}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  discount_amount:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="flex-1"
                            />
                             <Select
                               value={item.discount_type}
                               onValueChange={(val) =>
                                 updateItem(item.id, {
                                   discount_type: val as "percentage" | "fixed",
                                 })
                               }
                               className="w-20"
                               options={DISCOUNT_TYPES}
                             />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`tax-${item.id}`}>Tax (%)</Label>
                          <Input
                            id={`tax-${item.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.tax_rate}
                            onChange={(e) =>
                              updateItem(item.id, {
                                tax_rate: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="text-right text-sm font-medium text-foreground">
                        Line Total:{" "}
                        {formatCurrency(
                          calculateItem(item).total,
                          business.currency,
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(totals.subtotal, business.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium">
                      {formatCurrency(totals.discount, business.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">
                      {formatCurrency(totals.tax, business.currency)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total, business.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" type="button">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
                {isLoading ? "Saving..." : "Save Draft"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
