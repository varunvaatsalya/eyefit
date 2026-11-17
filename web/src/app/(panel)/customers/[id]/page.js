import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { ArrowLeft, Phone, MapPin, Stethoscope, Mail, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { DeliveryBadge, PaymentBadge } from "@/components/status-badge";
import { RxView } from "@/components/rx/rx-view";
import { CustomerActions } from "./customer-actions";
import { getContext } from "@/lib/auth";
import { formatDate, formatINR, initials, timeAgo, toPlain } from "@/lib/format";
import { Customer, Prescription, Invoice } from "@/models";

export default function CustomerPage({ params }) {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Customers
      </Link>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ params }) {
  const ctx = await getContext();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const [customer, prescriptions, invoices] = await Promise.all([
    Customer.findById(id).lean(),
    Prescription.find({ customerId: id }).sort({ visitDate: -1, createdAt: -1 }).lean(),
    Invoice.find({ customerId: id, storeId: { $in: ctx.allowedStoreIds } }).sort({ date: -1 }).lean(),
  ]);
  if (!customer) notFound();

  const storeName = Object.fromEntries(ctx.stores.map((s) => [s.id, s.name]));
  const confirmed = invoices.filter((i) => i.status === "confirmed");
  const totalSpent = confirmed.reduce((s, i) => s + i.grandTotal, 0);
  const due = confirmed.reduce((s, i) => s + (i.balance || 0), 0);
  const [latestRx, ...olderRx] = prescriptions;
  const plainCustomer = toPlain(customer);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-11 md:size-14">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">{initials(customer.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">{customer.name}</h1>
              {customer.category && <Badge variant="secondary">{customer.category}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>#{customer.customerNo}</span>
              <a href={`tel:${customer.mobile}`} className="inline-flex items-center gap-1 font-mono hover:text-foreground">
                <Phone className="size-3.5" /> {customer.mobile}
              </a>
              {(customer.gender || customer.age) && (
                <span>{[customer.gender && customer.gender[0].toUpperCase() + customer.gender.slice(1), customer.age && `${customer.age} yrs`].filter(Boolean).join(" · ")}</span>
              )}
              <span>Customer since {formatDate(customer.createdAt, "MMM yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CustomerActions customer={plainCustomer} lastRx={latestRx ? toPlain(latestRx) : null} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Total spent" value={formatINR(totalSpent, { decimals: false })} />
        <Stat label="Bills" value={confirmed.length} />
        <Stat label="Eye tests" value={prescriptions.length} />
        <Stat label="Balance due" value={formatINR(due, { decimals: false })} tone={due > 0 ? "danger" : undefined} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Latest prescription</CardTitle>
            <CardDescription>
              {latestRx
                ? `Visit ${latestRx.visitNo} · ${formatDate(latestRx.visitDate)} · ${storeName[String(latestRx.storeId)] ?? ""}`
                : "No eye test recorded yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestRx ? <RxView rx={latestRx} /> : <p className="text-sm text-muted-foreground">Use “New eye test” to add one.</p>}
            {olderRx.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Previous visits</p>
                {olderRx.map((rx) => (
                  <details key={String(rx._id)} className="group rounded-2xl bg-muted/50 px-4 py-2">
                    <summary className="cursor-pointer list-none text-sm font-medium">
                      Visit {rx.visitNo} · {formatDate(rx.visitDate)}{" "}
                      <span className="font-normal text-muted-foreground">
                        R {rx.right?.dp?.sph || "—"} / L {rx.left?.dp?.sph || "—"}
                      </span>
                    </summary>
                    <div className="pt-3 pb-1">
                      <RxView rx={rx} dense />
                    </div>
                  </details>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail icon={Phone} label="Alternate mobile" value={customer.mobile2} />
            <Detail icon={Mail} label="Email" value={customer.email} />
            <Detail icon={CalendarDays} label="Date of birth" value={customer.dob && formatDate(customer.dob)} />
            <Detail icon={Stethoscope} label="Referred by" value={customer.referDoctor} />
            <Detail icon={MapPin} label="Address" value={customer.address} />
            {customer.remark && <p className="rounded-2xl bg-amber-500/10 p-3 text-amber-900">{customer.remark}</p>}
            <p className="pt-2 text-xs text-muted-foreground">Last visit {timeAgo(customer.lastVisitAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Bill no</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">Store</TableHead>
              <TableHead className="hidden lg:table-cell">Items</TableHead>
              <TableHead className="hidden sm:table-cell">Delivery</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="pr-4 text-right">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No bills yet</TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <ClickableRow key={String(inv._id)} href={`/sales/${inv._id}`}>
                <TableCell className="pl-4 font-mono">{inv.invoiceNo}</TableCell>
                <TableCell>{formatDate(inv.date)}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{storeName[String(inv.storeId)]}</TableCell>
                <TableCell className="hidden max-w-64 truncate text-muted-foreground lg:table-cell">{inv.items.map((i) => i.name).join(", ")}</TableCell>
                <TableCell className="hidden sm:table-cell"><DeliveryBadge status={inv.deliveryStatus} /></TableCell>
                <TableCell className="text-right font-medium tabular">{formatINR(inv.grandTotal)}</TableCell>
                <TableCell className="pr-4 text-right"><PaymentBadge balance={inv.balance} status={inv.status} /></TableCell>
              </ClickableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Stat({ label, value, tone }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular ${tone === "danger" ? "text-red-600" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p>{value || "—"}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-4xl" />)}
      </div>
      <Skeleton className="h-72 rounded-4xl" />
    </div>
  );
}
