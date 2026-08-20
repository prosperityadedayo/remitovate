export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  currency: string;
  logo_url?: string;
  brand_colour: string;
  invoice_prefix: string;
  invoice_start_number: number;
  default_payment_terms: string;
  invoice_template: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  discount_type: "percentage" | "fixed";
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  payment_information?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_type: "percentage" | "fixed";
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}
