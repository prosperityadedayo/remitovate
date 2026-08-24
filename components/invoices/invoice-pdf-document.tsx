import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { InvoiceWithItems } from "@/types";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    borderBottomWidth: 3,
    paddingBottom: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    objectFit: "cover",
    borderRadius: 4,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 1,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 20,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#94a3b8",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 2,
  },
  infoName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 4,
    backgroundColor: "#f8fafc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    minHeight: 28,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colDiscount: { flex: 2, textAlign: "right" },
  colTax: { flex: 1, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  th: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#64748b",
    paddingHorizontal: 6,
  },
  td: {
    fontSize: 9,
    color: "#334155",
    paddingHorizontal: 6,
  },
  tdTotal: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
    paddingHorizontal: 6,
  },
  totals: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    paddingVertical: 2,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#64748b",
    minWidth: 60,
    textAlign: "right",
  },
  totalsValue: {
    fontSize: 9,
    color: "#334155",
    minWidth: 70,
    textAlign: "right",
  },
  totalsTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    paddingVertical: 4,
    marginTop: 4,
    borderTopWidth: 2,
  },
  totalsTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    minWidth: 60,
    textAlign: "right",
  },
  totalsTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    minWidth: 70,
    textAlign: "right",
  },
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#94a3b8",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },
  accentLine: {
    marginTop: 20,
    height: 3,
    width: "100%",
  },
});

interface InvoicePdfDocumentProps {
  invoice: InvoiceWithItems;
  logoDataUrl: string | null;
  brandColour: string;
}

export function InvoicePdfDocument({
  invoice,
  logoDataUrl,
  brandColour,
}: InvoicePdfDocumentProps) {
  const currency = invoice.businesses.currency || "NGN";

  return (
    <Document title={`Invoice ${invoice.invoice_number}`} author={invoice.businesses.name}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: brandColour }]}>
          <View style={styles.logoSection}>
            {logoDataUrl ? (
              <Image
                source={logoDataUrl}
                style={styles.logo}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 8, color: "#94a3b8" }}>Logo</Text>
              </View>
            )}
            <View>
              <Text style={styles.businessName}>{invoice.businesses.name}</Text>
              {invoice.businesses.email && (
                <Text style={styles.businessDetail}>{invoice.businesses.email}</Text>
              )}
              {invoice.businesses.phone && (
                <Text style={styles.businessDetail}>{invoice.businesses.phone}</Text>
              )}
              {invoice.businesses.address && (
                <Text style={styles.businessDetail}>{invoice.businesses.address}</Text>
              )}
              {invoice.businesses.country && (
                <Text style={styles.businessDetail}>{invoice.businesses.country}</Text>
              )}
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>
              Invoice #{invoice.invoice_number}
            </Text>
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ fontSize: 9, color: "#64748b" }}>Date:</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  {formatDate(invoice.invoice_date)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ fontSize: 9, color: "#64748b" }}>Due:</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  {formatDate(invoice.due_date)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoName}>{invoice.customers.name}</Text>
            {invoice.customers.email && (
              <Text style={styles.infoValue}>{invoice.customers.email}</Text>
            )}
            {invoice.customers.phone && (
              <Text style={styles.infoValue}>{invoice.customers.phone}</Text>
            )}
            {invoice.customers.address && (
              <Text style={styles.infoValue}>{invoice.customers.address}</Text>
            )}
            {invoice.customers.country && (
              <Text style={styles.infoValue}>{invoice.customers.country}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.infoValue}>Invoice Number:</Text>
              <Text style={[styles.infoValue, { fontWeight: "bold" }]}>
                {invoice.invoice_number}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.infoValue}>Invoice Date:</Text>
              <Text style={[styles.infoValue, { fontWeight: "bold" }]}>
                {formatDate(invoice.invoice_date)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.infoValue}>Due Date:</Text>
              <Text style={[styles.infoValue, { fontWeight: "bold" }]}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
            <Text style={[styles.th, styles.colDiscount]}>Discount</Text>
            <Text style={[styles.th, styles.colTax]}>Tax</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>
                {item.quantity.toLocaleString()}
              </Text>
              <Text style={[styles.td, styles.colPrice]}>
                {formatCurrency(item.unit_price, currency)}
              </Text>
              <Text style={[styles.td, styles.colDiscount]}>
                {formatCurrency(item.discount_amount, currency)}
              </Text>
              <Text style={[styles.td, styles.colTax]}>
                {item.tax_rate.toLocaleString()}%
              </Text>
              <Text style={[styles.tdTotal, styles.colTotal]}>
                {formatCurrency(item.total, currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotal, currency)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Discount</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.discount_amount, currency)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.tax_amount, currency)}
            </Text>
          </View>
          <View style={[styles.totalsTotalRow, { borderTopColor: brandColour }]}>
            <Text style={styles.totalsTotalLabel}>Total</Text>
            <Text style={styles.totalsTotalValue}>
              {formatCurrency(invoice.total, currency)}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionText}>{invoice.notes}</Text>
          </View>
        )}

        {invoice.payment_information && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <Text style={styles.sectionText}>{invoice.payment_information}</Text>
          </View>
        )}

        <View style={[styles.accentLine, { backgroundColor: brandColour }]} />
      </Page>
    </Document>
  );
}
