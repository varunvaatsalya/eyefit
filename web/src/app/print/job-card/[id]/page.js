import { Suspense } from "react";
import { RxView } from "@/components/rx/rx-view";
import { loadInvoiceForPrint } from "../../load";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/constants";

export const metadata = { title: "Job Card" };

export default function JobCardPage({ params }) {
  return (
    <Suspense fallback={<p className="text-center text-sm text-gray-500">Preparing job card…</p>}>
      <JobCard params={params} />
    </Suspense>
  );
}

async function JobCard({ params }) {
  const { inv, store, rx } = await loadInvoiceForPrint(params);
  const frames = inv.items.filter((i) => i.category === "frame" || i.category === "sunglass");
  const lenses = inv.items.filter((i) => i.category === "lens" || i.category === "contact_lens");

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between border-b-2 border-dashed border-black pb-3">
        <div>
          <p className="text-xs uppercase text-gray-500">Workshop job card · {store.name}</p>
          <p className="font-mono text-3xl font-bold">{inv.invoiceNo}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-gray-500">Deliver by</p>
          <p className="text-xl font-bold">{formatDate(inv.deliveryDate, "EEE, dd MMM")}</p>
          <p className="text-xs">Ordered {formatDate(inv.date)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500">Customer</p>
          <p className="text-lg font-semibold">{inv.customerSnapshot.name}</p>
          <p className="font-mono">{inv.customerSnapshot.mobile}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-gray-500">Balance to collect</p>
          <p className="text-lg font-semibold">₹{inv.balance}</p>
        </div>
      </section>

      <section className="rounded-lg border-2 border-black p-4">
        <p className="mb-2 text-xs font-semibold uppercase">Prescription</p>
        {rx ? <RxView rx={rx} /> : <p className="text-gray-500">No prescription attached to this bill.</p>}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-400 p-3">
          <p className="mb-1 text-xs font-semibold uppercase">Frame</p>
          {frames.length ? frames.map((f, i) => (
            <div key={i}>
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-gray-600">{f.details || f.modelNo}</p>
            </div>
          )) : <p className="text-gray-500">Customer&apos;s own frame</p>}
        </div>
        <div className="rounded-lg border border-gray-400 p-3">
          <p className="mb-1 text-xs font-semibold uppercase">Lens</p>
          {lenses.length ? lenses.map((l, i) => (
            <div key={i}>
              <p className="font-medium">{l.name} × {l.qty}</p>
              <p className="text-xs text-gray-600">{CATEGORY_LABEL[l.category]}{l.details && ` · ${l.details}`}</p>
            </div>
          )) : <p className="text-gray-500">No lens</p>}
        </div>
      </section>

      {inv.notes && (
        <section className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs font-semibold uppercase">Note</p>
          <p>{inv.notes}</p>
        </section>
      )}

      <section className="grid grid-cols-4 gap-3 pt-2 text-center text-xs">
        {["Lens ordered", "Fitting done", "Quality check", "Ready / informed"].map((s) => (
          <div key={s} className="space-y-6 rounded-lg border border-gray-400 p-2">
            <p className="font-medium">{s}</p>
            <p className="border-t border-dotted border-gray-400 pt-1 text-gray-500">Sign / Date</p>
          </div>
        ))}
      </section>
    </div>
  );
}
