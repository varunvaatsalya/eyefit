import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { ArrowLeft, Printer, Wrench, Phone, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeliveryBadge, PaymentBadge } from "@/components/status-badge";
import { RxView } from "@/components/rx/rx-view";
import { DeliveryStepper, CollectPayment, CancelInvoiceButton } from "./invoice-controls";
import { WhatsAppMenu } from "@/components/whatsapp/whatsapp-menu";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { getContext, storeScope } from "@/lib/auth";
import { formatDate, formatDateTime, formatINR, toPlain } from "@/lib/format";
import { CATEGORY_LABEL, PAYMENT_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Invoice, Prescription, Store, User } from "@/models";

export default function InvoicePage({ params }) {
  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Sales & Orders
      </Link>
      <Suspense fallback={<Skeleton className="h-[600px] rounded-4xl" />}>
        <InvoiceDetail params={params} />
      </Suspense>
    </div>
  );
}

async function InvoiceDetail({ params }) {
  const ctx = await getContext();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const inv = await Invoice.findOne({ _id: id, ...storeScope(ctx) }).lean();
  if (!inv) notFound();
  const [store, rx, createdBy] = await Promise.all([
    Store.findById(inv.storeId).lean(),
    inv.prescriptionId ? Prescription.findById(inv.prescriptionId).lean() : null,
    User.findById(inv.createdBy).select("name").lean(),
  ]);

  const cancelled = inv.status === "cancelled";
  const invId = String(inv._id);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-lg font-semibold tracking-tight md:text-xl">{inv.invoiceNo}</h1>
            <DeliveryBadge status={inv.deliveryStatus} />
            <PaymentBadge balance={inv.balance} status={inv.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(inv.date)} · {store?.name}
            {createdBy && ` · by ${createdBy.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WhatsAppMenu invoice={toPlain(inv)} storeName={store?.name} />
          <a href={`/print/job-card/${invId}`} target="_blank" className={buttonVariants({ variant: "outline" })}>
            <Wrench /> Job card
          </a>
          <a href={`/print/invoice/${invId}?auto=1`} target="_blank" className={buttonVariants()}>
            <Printer /> Print bill
          </a>
          {ctx.canManage && !cancelled && <CancelInvoiceButton invoiceId={invId} invoiceNo={inv.invoiceNo} />}
        </div>
      </div>

      {cancelled && (
        <div className="rounded-3xl bg-destructive/10 px-5 py-3 text-sm font-medium text-destructive">This bill was cancelled. Items were returned to stock.</div>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" /> Promised delivery: {formatDate(inv.deliveryDate, "EEE, dd MMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryStepper invoiceId={invId} status={inv.deliveryStatus} balance={inv.balance} disabled={cancelled} />
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Item</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Disc</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">GST</TableHead>
                  <TableHead className="pr-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inv.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{CATEGORY_LABEL[it.category]}{it.details && ` · ${it.details}`}</div>
                    </TableCell>
                    <TableCell className="text-right tabular">{formatINR(it.rate)}</TableCell>
                    <TableCell className="text-right tabular">{it.qty}</TableCell>
                    <TableCell className="hidden text-right text-muted-foreground tabular sm:table-cell">{it.discountPct ? `${it.discountPct}%` : "—"}</TableCell>
                    <TableCell className="hidden text-right text-muted-foreground tabular sm:table-cell">{it.gstPct}%</TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular">{formatINR(it.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="ml-auto w-full max-w-xs space-y-1.5 px-6 pt-2 pb-4 text-sm">
              <Line label="Sub total" value={formatINR(inv.subTotal)} />
              {inv.itemDiscount > 0 && <Line label="Discount" value={`− ${formatINR(inv.itemDiscount)}`} />}
              <Line label="GST" value={formatINR(inv.gstTotal)} />
              {inv.extraDiscount > 0 && <Line label="Extra discount" value={`− ${formatINR(inv.extraDiscount)}`} />}
              {inv.roundOff !== 0 && <Line label="Round off" value={formatINR(inv.roundOff)} />}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular">{formatINR(inv.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {rx && (
            <Card>
              <CardHeader>
                <CardTitle>Prescription</CardTitle>
                <CardDescription>Visit {rx.visitNo} · {formatDate(rx.visitDate)}</CardDescription>
              </CardHeader>
              <CardContent>
                <RxView rx={rx} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardAction>
                <Link href={`/customers/${inv.customerId}`} className="text-xs font-medium text-primary hover:underline">View profile</Link>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{inv.customerSnapshot?.name}</p>
              <a href={`tel:${inv.customerSnapshot?.mobile}`} className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground">
                <Phone className="size-3.5" /> {inv.customerSnapshot?.mobile}
              </a>
              <p className="text-xs text-muted-foreground">Customer #{inv.customerSnapshot?.customerNo}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inv.payments.length === 0 && <p className="text-sm text-muted-foreground">No payment yet</p>}
              {inv.payments.map((p) => (
                <div key={String(p._id)} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{PAYMENT_LABEL[p.mode]}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(p.date)}</p>
                  </div>
                  <span className="font-medium tabular">{formatINR(p.amount)}</span>
                </div>
              ))}
              <div className="space-y-1 border-t pt-3 text-sm">
                <Line label="Paid" value={formatINR(inv.paidTotal)} />
                <div className={cn("flex justify-between font-semibold", inv.balance > 0 ? "text-red-600" : "text-emerald-700")}>
                  <span>Balance</span>
                  <span className="tabular">{formatINR(inv.balance)}</span>
                </div>
              </div>
              {!cancelled && <CollectPayment invoiceId={invId} balance={inv.balance} />}
            </CardContent>
          </Card>

          {(inv.whatsapp?.sendBill || inv.whatsapp?.dueReminder) && (
            <Card size="sm">
              <CardContent className="space-y-1.5 text-xs">
                <p className="flex items-center gap-1.5 text-sm font-medium"><WhatsAppIcon className="size-4 text-[#25D366]" /> WhatsApp</p>
                {inv.whatsapp.sendBill && <p className="text-muted-foreground">✓ Customer wants the bill on WhatsApp</p>}
                {inv.whatsapp.dueReminder && inv.balance > 0 && (
                  <p className="text-muted-foreground">⏰ Auto payment reminder on {formatDate(inv.deliveryDate, "dd MMM")} <span className="rounded bg-amber-500/15 px-1 text-amber-800">coming soon</span></p>
                )}
              </CardContent>
            </Card>
          )}
          {inv.notes && (
            <Card size="sm">
              <CardContent>
                <p className="text-xs text-muted-foreground">Note</p>
                <p className="text-sm">{inv.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
