import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceById } from "@/app/actions/invoices";
import { getSignedLogoUrl } from "@/app/actions/upload";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/components/invoices/invoice-pdf-document";

async function fetchLogoBase64(signedUrl: string): Promise<string | null> {
  try {
    const response = await fetch(signedUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 403 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(id);

    if (!invoice || invoice.business_id !== business.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let logoDataUrl: string | null = null;
    if (invoice.businesses.logo_url) {
      const signedUrl = await getSignedLogoUrl(invoice.businesses.logo_url);
      if (signedUrl) {
        logoDataUrl = await fetchLogoBase64(signedUrl);
      }
    }

    const brandColour = invoice.businesses.brand_colour || "#4F46E5";

    const pdfBuffer = await renderToBuffer(
      <InvoicePdfDocument
        invoice={invoice}
        logoDataUrl={logoDataUrl}
        brandColour={brandColour}
      />,
    );

    const filename = `${invoice.invoice_number}.pdf`;

    return new NextResponse(Uint8Array.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
