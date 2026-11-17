import { Suspense } from "react";
import { RxView } from "@/components/rx/rx-view";
import { loadInvoiceForPrint } from "../../load";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { CATEGORY_LABEL, PAYMENT_LABEL, DELIVERY_LABEL } from "@/lib/constants";

export const metadata = { title: "Invoice" };

export default function PrintInvoicePage({ params }) {
  return (
    <Suspense fallback={<p className="text-center text-sm text-gray-500">Preparing bill…</p>}>
      <InvoicePrint params={params} />
    </Suspense>
  );
}

async function InvoicePrint({ params }) {
  const { inv, store, rx, customer } = await loadInvoiceForPrint(params);

  // GST summary by rate
  const gstByRate = {};
  for (const it of inv.items) {
    const g = (gstByRate[it.gstPct] ??= { taxable: 0, gst: 0 });
    g.taxable += it.taxable;
    g.gst += it.gstAmt;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{store.name}</h1>
          <p>{store.address}</p>
          <p>Phone: {store.phone}</p>
          {store.gstin && <p>GSTIN: {store.gstin}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold uppercase">{inv.status === "cancelled" ? "Cancelled Invoice" : "Tax Invoice"}</p>
          <p className="font-mono text-base font-semibold">{inv.invoiceNo}</p>
          <p>{formatDateTime(inv.date)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Bill to</p>
          <p className="font-semibold">{inv.customerSnapshot.name}</p>
          <p>Mobile: {inv.customerSnapshot.mobile}</p>
          {customer?.address && <p>{customer.address}</p>}
          <p className="text-xs text-gray-500">Customer #{inv.customerSnapshot.customerNo}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-gray-500">Delivery</p>
          <p className="font-semibold">{formatDate(inv.deliveryDate, "EEE, dd MMM yyyy")}</p>
          <p>Status: {DELIVERY_LABEL[inv.deliveryStatus]}</p>
        </div>
      </section>

      {rx && (
        <section className="rounded border border-gray-300 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Prescription · {formatDate(rx.visitDate)}</p>
          <RxView rx={rx} dense />
        </section>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left text-xs uppercase">
            <th className="py-1.5">#</th>
            <th className="py-1.5">Item</th>
            <th className="py-1.5 text-right">Rate</th>
            <th className="py-1.5 text-right">Qty</th>
            <th className="py-1.5 text-right">Disc</th>
            <th className="py-1.5 text-right">GST</th>
            <th className="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i} className="border-b border-gray-200 align-top">
              <td className="py-1.5 pr-2">{i + 1}</td>
              <td className="py-1.5">
                <p className="font-medium">{it.name}</p>
                <p className="text-xs text-gray-500">{CATEGORY_LABEL[it.category]}{it.details && ` · ${it.details}`}</p>
              </td>
              <td className="py-1.5 text-right tabular">{formatINR(it.rate)}</td>
              <td className="py-1.5 text-right tabular">{it.qty}</td>
              <td className="py-1.5 text-right tabular">{it.discountAmt ? formatINR(it.discountAmt) : "—"}</td>
              <td className="py-1.5 text-right tabular">{it.gstPct}%</td>
              <td className="py-1.5 text-right font-medium tabular">{formatINR(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-between gap-6">
        <div className="space-y-2 text-xs">
          <table className="border-collapse">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pr-4 font-medium">GST %</th>
                <th className="pr-4 text-right font-medium">Taxable</th>
                <th className="pr-4 text-right font-medium">CGST</th>
                <th className="text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(gstByRate).map(([rate, g]) => (
                <tr key={rate}>
                  <td className="pr-4">{rate}%</td>
                  <td className="pr-4 text-right tabular">{formatINR(g.taxable)}</td>
                  <td className="pr-4 text-right tabular">{formatINR(g.gst / 2)}</td>
                  <td className="text-right tabular">{formatINR(g.gst / 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <p className="font-medium text-gray-500">Payments</p>
            {inv.payments.map((p) => (
              <p key={String(p._id)}>
                {PAYMENT_LABEL[p.mode]} · {formatDate(p.date)} · {formatINR(p.amount)}
              </p>
            ))}
          </div>
        </div>
        <div className="w-64 space-y-1">
          <Row label="Sub total" value={formatINR(inv.subTotal)} />
          {inv.itemDiscount > 0 && <Row label="Discount" value={`− ${formatINR(inv.itemDiscount)}`} />}
          <Row label="GST" value={formatINR(inv.gstTotal)} />
          {inv.extraDiscount > 0 && <Row label="Extra discount" value={`− ${formatINR(inv.extraDiscount)}`} />}
          {inv.roundOff !== 0 && <Row label="Round off" value={formatINR(inv.roundOff)} />}
          <div className="flex justify-between border-y border-black py-1.5 text-base font-bold">
            <span>Total</span>
            <span className="tabular">{formatINR(inv.grandTotal)}</span>
          </div>
          <Row label="Paid" value={formatINR(inv.paidTotal)} />
          <div className="flex justify-between font-semibold">
            <span>Balance</span>
            <span className="tabular">{formatINR(inv.balance)}</span>
          </div>
        </div>
      </section>

      <footer className="flex items-end justify-between border-t pt-4 text-xs text-gray-600">
        <div className="space-y-0.5">
          <p>• Please bring this bill at the time of delivery.</p>
          <p>• Spectacles not collected within 60 days will not be our responsibility.</p>
          <p>• Thank you for choosing {store.name}!</p>
        </div>
        <div className="text-center">
          <div className="mb-1 h-10 w-40 border-b border-gray-400" />
          Authorised signatory
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
