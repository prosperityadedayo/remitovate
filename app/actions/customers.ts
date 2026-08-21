"use server";

import { createClient } from "@/lib/supabase/server";
import { Customer } from "@/types";

function getSupabase() {
  return createClient();
}

async function getBusinessId() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return null;
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !business) {
    return null;
  }

  return business.id;
}

export async function getCustomers(searchQuery?: string): Promise<Customer[]> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return [];
    }

    const supabase = await getSupabase();
    let query = supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (searchQuery && searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},phone.ilike.${term}`,
      );
    }

    const { data: customers, error } = await query;

    if (error || !customers) {
      return [];
    }

    return customers;
  } catch {
    return [];
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return null;
    }

    const supabase = await getSupabase();
    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error || !customer) {
      return null;
    }

    return customer;
  } catch {
    return null;
  }
}

export async function createCustomer(formData: FormData) {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return { error: "You must have a business to create customers." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const address = (formData.get("address") as string)?.trim() || null;
    const country = (formData.get("country") as string)?.trim() || null;

    if (!name) {
      return { error: "Customer name is required." };
    }

    if (!email) {
      return { error: "Customer email is required." };
    }

    const supabase = await getSupabase();
    const { error } = await supabase.from("customers").insert({
      business_id: businessId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      name,
      email,
      phone,
      address,
      country,
    });

    if (error) {
      return { error: "Something went wrong while creating the customer. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Something went wrong while creating the customer. Please try again." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return { error: "You must have a business to update customers." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const address = (formData.get("address") as string)?.trim() || null;
    const country = (formData.get("country") as string)?.trim() || null;

    if (!name) {
      return { error: "Customer name is required." };
    }

    if (!email) {
      return { error: "Customer email is required." };
    }

    const supabase = await getSupabase();
    const { error } = await supabase
      .from("customers")
      .update({
        name,
        email,
        phone,
        address,
        country,
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { error: "Something went wrong while updating the customer. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Something went wrong while updating the customer. Please try again." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const businessId = await getBusinessId();

    if (!businessId) {
      return { error: "You must have a business to delete customers." };
    }

    const supabase = await getSupabase();

    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", id)
      .eq("business_id", businessId);

    if ((invoiceCount || 0) > 0) {
      return {
        error:
          "This customer has invoices attached. To protect your financial records, you cannot delete a customer with existing invoices.",
      };
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      return { error: "Something went wrong while deleting the customer. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Something went wrong while deleting the customer. Please try again." };
  }
}
