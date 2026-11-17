import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { TableSkeleton } from "@/components/page-skeleton";
import { ClickableRow } from "@/components/clickable-row";
import { Pagination } from "@/components/pagination";
import { DeliveryBadge, PaymentBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContext, storeScope } from "@/lib/auth";
import { escapeRegex, cn } from "@/lib/utils";
import { formatDate, formatINR } from "@/lib/format";
import { DELIVERY_STATUSES } from "@/lib/constants";
import { Invoice } from "@/models";

export const metadata = { title: "Sales & Orders" };
const PAGE_SIZE = 25;

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export default function SalesPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <PageHeader title="Sales & Orders" description="Every bill with its delivery and payment status.">
        <Link href="/sales/new" className={buttonVariants()}>
          <Plus /> New sale
        </Link>
      </PageHeader>
      <Suspense fallback={<TableSkeleton />}>
        <SalesBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SalesBody({ searchParams }) {
  const ctx = await getContext();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const range = sp.range ?? (sp.delivery || sp.due ? "all" : "30d");
  const delivery = sp.delivery ?? "";
  const due = sp.due === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const filter = { ...storeScope(ctx) };
  if (range !== "all") {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    if (range === "7d") from.setDate(from.getDate() - 6);
    if (range === "30d") from.setDate(from.getDate() - 29);
    filter.date = { $gte: from };
  }
  if (delivery) filter.deliveryStatus = delivery === "open" ? { $ne: "delivered" } : delivery;
  if (delivery) filter.status = "confirmed";
  if (due) {
    filter.balance = { $gt: 0 };
    filter.status = "confirmed";
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ invoiceNo: rx }, { "customerSnapshot.name": rx }, { "customerSnapshot.mobile": rx }];
  }

  const [rows, total, summary] = await Promise.all([
    Invoice.find(filter).sort({ date: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Invoice.countDocuments(filter),
    Invoice.aggregate([
      { $match: { ...filter, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$grandTotal" }, paid: { $sum: "$paidTotal" }, due: { $sum: "$balance" }, count: { $sum: 1 } } },
    ]),
  ]);
  const s = summary[0] ?? { total: 0, paid: 0, due: 0, count: 0 };
  const storeCode = Object.fromEntries(ctx.stores.map((st) => [st.id, st.code]));
  const showStore = !ctx.activeStoreId;

  const link = (patch) => {
    const params = new URLSearchParams(Object.entries({ q, range, delivery, due: due ? "1" : "", ...patch }).filter(([, v]) => v));
    return `/sales?${params.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={<div className="h-9 w-80" />}>
          <SearchInput placeholder="Bill no, customer name or mobile…" />
        </Suspense>
        <div className="inline-flex rounded-full bg-muted p-1">
          {RANGES.map((r) => (
            <Link key={r.value} href={link({ range: r.value })} scroll={false} className={cn("rounded-full px-3 py-1 text-xs font-medium", range === r.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {r.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DELIVERY_STATUSES.map((d) => (
            <Link key={d.value} href={link({ delivery: delivery === d.value ? "" : d.value })} scroll={false} className={cn("rounded-full border px-3 py-1 text-xs font-medium", delivery === d.value ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
              {d.label}
            </Link>
          ))}
          <Link href={link({ due: due ? "" : "1" })} scroll={false} className={cn("rounded-full border px-3 py-1 text-xs font-medium", due ? "border-red-600 bg-red-600 text-white" : "bg-background text-muted-foreground hover:text-foreground")}>
            Balance due
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="Bills" value={s.count} />
        <Mini label="Sales" value={formatINR(s.total, { decimals: false })} />
        <Mini label="Collected" value={formatINR(s.paid, { decimals: false })} />
        <Mini label="Balance due" value={formatINR(s.due, { decimals: false })} danger={s.due > 0} />
      </div>

      <Card className="gap-0 py-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Bill</TableHead>
              <TableHead className="hidden sm:table-cell">Customer</TableHead>
              {showStore && <TableHead className="hidden md:table-cell">Store</TableHead>}
              <TableHead className="hidden lg:table-cell">Items</TableHead>
              <TableHead className="hidden sm:table-cell">Delivery</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-4 text-right">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">No bills found</TableCell>
              </TableRow>
            )}
            {rows.map((inv) => (
              <ClickableRow key={String(inv._id)} href={`/sales/${inv._id}`} className={cn(inv.status === "cancelled" && "opacity-50")}>
                <TableCell className="pl-4">
                  <div className="font-mono font-medium">{inv.invoiceNo}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(inv.date, "dd MMM, hh:mm a")}</div>
                  <div className="max-w-40 truncate text-xs font-medium sm:hidden">{inv.customerSnapshot?.name}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="font-medium">{inv.customerSnapshot?.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{inv.customerSnapshot?.mobile}</div>
                </TableCell>
                {showStore && <TableCell className="hidden md:table-cell"><Badge variant="outline">{storeCode[String(inv.storeId)]}</Badge></TableCell>}
                <TableCell className="hidden max-w-60 truncate text-sm text-muted-foreground lg:table-cell">{inv.items.map((i) => i.name).join(", ")}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <DeliveryBadge status={inv.deliveryStatus} />
                  {inv.deliveryStatus !== "delivered" && inv.deliveryDate && (
                    <div className="mt-0.5 text-xs text-muted-foreground">by {formatDate(inv.deliveryDate, "dd MMM")}</div>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium tabular">{formatINR(inv.grandTotal, { decimals: false })}</TableCell>
                <TableCell className="pr-4 text-right"><PaymentBadge balance={inv.balance} status={inv.status} /></TableCell>
              </ClickableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t pt-2 pb-1">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={{ q, range, delivery, due: due ? "1" : "" }} basePath="/sales" />
        </div>
      </Card>
    </>
  );
}

function Mini({ label, value, danger }) {
  return (
    <div className="rounded-3xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tabular", danger && "text-red-600")}>{value}</p>
    </div>
  );
}
