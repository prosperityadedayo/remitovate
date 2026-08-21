import { redirect } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerById } from "@/app/actions/customers";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    redirect("/customers?error=not-found");
  }

  return <CustomerForm customer={customer} mode="edit" />;
}
