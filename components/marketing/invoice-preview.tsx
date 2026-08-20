export function InvoicePreview() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Invoice
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">INV-0001</p>
        </div>
        <span className="inline-flex items-center rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
          Draft
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              From
            </p>
            <p className="mt-1 font-medium text-foreground">Remitovate Demo</p>
            <p className="text-muted-foreground">demo@remitovate.com</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bill to
            </p>
            <p className="mt-1 font-medium text-foreground">Sarah Johnson</p>
            <p className="text-muted-foreground">sarah@example.com</p>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="mt-0.5 font-medium text-foreground">Aug 20, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Due date</p>
            <p className="mt-0.5 font-medium text-foreground">Sep 3, 2026</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Price</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr>
              <td className="py-3 font-medium text-foreground">Website Design</td>
              <td className="py-3 text-right text-muted-foreground">1</td>
              <td className="py-3 text-right text-muted-foreground">₦150,000</td>
              <td className="py-3 text-right font-medium text-foreground">₦150,000</td>
            </tr>
            <tr>
              <td className="py-3 font-medium text-foreground">Hosting Setup</td>
              <td className="py-3 text-right text-muted-foreground">1</td>
              <td className="py-3 text-right text-muted-foreground">₦20,000</td>
              <td className="py-3 text-right font-medium text-foreground">₦20,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">₦170,000</span>
        </div>
        <div className="flex justify-between text-foreground">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">₦170,000</span>
        </div>
      </div>
    </div>
  );
}
