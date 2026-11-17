import { Suspense } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  IndianRupee, ReceiptText, Wallet, AlertTriangle, ArrowRight, Plus, TrendingUp, TrendingDown, Users, Boxes,
  Receipt, UserPlus, Eye, Glasses, PackageCheck, FlaskConical, Clock, Search, Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardsSkeleton } from "@/components/page-skeleton";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { SalesChart } from "./sales-chart";
import { HBarChart } from "./hbar-chart";
import { getContext, storeScope } from "@/lib/auth";
import { formatINR, formatDate, initials } from "@/lib/format";
import { waLink, readyMessage } from "@/lib/whatsapp";
import { CATEGORY_LABEL, PAYMENT_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Invoice, Inventory, Product, Customer, Prescription } from "@/models";

export const metadata = { title: "Home" };

const TZ = "Asia/Kolkata";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const ctx = await getContext();
  const scope = { ...storeScope(ctx), status: "confirmed" };

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = subDays(todayStart, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const chartStart = subDays(todayStart, 13);

  const [
    today, yesterday, month, collectedToday, due, daily, byStore, recent, lowStock, byCategory, byMode, newCustomers,
    eyeTestsToday, recentRx, topFrames, workshop, overdueCount,
  ] = await Promise.all([
    sumSales({ ...scope, date: { $gte: todayStart } }),
    sumSales({ ...scope, date: { $gte: yesterdayStart, $lt: todayStart } }),
    sumSales({ ...scope, date: { $gte: monthStart } }),
    Invoice.aggregate([
      { $match: { ...scope, "payments.date": { $gte: todayStart } } },
      { $unwind: "$payments" },
      { $match: { "payments.date": { $gte: todayStart } } },
      { $group: { _id: null, amount: { $sum: "$payments.amount" } } },
    ]),
    Invoice.aggregate([
      { $match: { ...scope, balance: { $gt: 0 } } },
      { $group: { _id: null, amount: { $sum: "$balance" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { ...scope, date: { $gte: chartStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: TZ } }, sales: { $sum: "$grandTotal" }, bills: { $sum: 1 } } },
    ]),
    ctx.activeStoreId
      ? []
      : Invoice.aggregate([
          { $match: { ...scope, date: { $gte: monthStart } } },
          { $group: { _id: "$storeId", sales: { $sum: "$grandTotal" }, bills: { $sum: 1 } } },
        ]),
    Invoice.find(storeScope(ctx)).sort({ date: -1 }).limit(5).lean(),
    countLowStock(ctx),
    Invoice.aggregate([
      { $match: { ...scope, date: { $gte: monthStart } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.category", value: { $sum: "$items.total" }, count: { $sum: "$items.qty" } } },
      { $sort: { value: -1 } },
    ]),
    Invoice.aggregate([
      { $match: { ...scope, "payments.date": { $gte: monthStart } } },
      { $unwind: "$payments" },
      { $match: { "payments.date": { $gte: monthStart } } },
      { $group: { _id: "$payments.mode", value: { $sum: "$payments.amount" }, count: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    Customer.countDocuments({ ...storeScope(ctx, "createdAtStoreId"), createdAt: { $gte: monthStart } }),
    Prescription.countDocuments({ ...storeScope(ctx), visitDate: { $gte: todayStart } }),
    Prescription.aggregate([
      { $match: storeScope(ctx) },
      { $sort: { visitDate: -1, createdAt: -1 } },
      { $limit: 5 },
      { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "c" } },
      { $set: { customer: { $first: "$c" } } },
      { $project: { c: 0 } },
    ]),
    Invoice.aggregate([
      { $match: { ...scope, date: { $gte: monthStart } } },
      { $unwind: "$items" },
      { $match: { "items.category": { $in: ["frame", "sunglass"] } } },
      { $group: { _id: "$items.name", brand: { $first: "$items.brand" }, category: { $first: "$items.category" }, qty: { $sum: "$items.qty" }, value: { $sum: "$items.total" } } },
      { $sort: { qty: -1, value: -1 } },
      { $limit: 5 },
    ]),
    // workshop board: lens/fitting orders by stage, soonest due first
    Invoice.aggregate([
      { $match: { ...scope, deliveryStatus: { $in: ["pending", "in_lab", "ready"] } } },
      { $sort: { deliveryDate: 1 } },
      {
        $group: {
          _id: "$deliveryStatus",
          count: { $sum: 1 },
          items: { $push: { _id: "$_id", name: "$customerSnapshot.name", mobile: "$customerSnapshot.mobile", invoiceNo: "$invoiceNo", deliveryDate: "$deliveryDate", balance: "$balance", storeId: "$storeId" } },
        },
      },
      { $project: { count: 1, items: { $slice: ["$items", 4] } } },
    ]),
    Invoice.countDocuments({ ...scope, deliveryStatus: { $in: ["pending", "in_lab"] }, deliveryDate: { $lt: todayStart } }),
  ]);

  const board = Object.fromEntries(workshop.map((w) => [w._id, w]));
  const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d]));
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(todayStart, 13 - i);
    const key = format(d, "yyyy-MM-dd");
    return { label: format(d, "dd MMM"), full: format(d, "EEEE, dd MMM"), sales: dailyMap[key]?.sales ?? 0, bills: dailyMap[key]?.bills ?? 0 };
  });
  const avgBill = month.bills ? month.sales / month.bills : 0;
  const categoryData = byCategory.map((c) => ({ label: CATEGORY_LABEL[c._id] ?? c._id, value: Math.round(c.value), count: c.count }));
  const modeData = byMode.map((m) => ({ label: PAYMENT_LABEL[m._id] ?? m._id, value: Math.round(m.value), count: m.count }));
  const modeTotal = modeData.reduce((s, m) => s + m.value, 0);
  const twoWeekTotal = chartData.reduce((s, d) => s + d.sales, 0);
  const storeName = Object.fromEntries(ctx.stores.map((s) => [s.id, s.name]));
  const change = yesterday.sales ? Math.round(((today.sales - yesterday.sales) / yesterday.sales) * 100) : null;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const readyCount = board.ready?.count ?? 0;
  const maxFrame = Math.max(1, ...topFrames.map((f) => f.qty));

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-5 py-5 text-primary-foreground md:px-7 md:py-6">
        <GlassesArt className="pointer-events-none absolute -top-6 -right-10 h-52 w-auto text-white/10 md:right-4 md:h-64" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <Store className="size-3.5" /> {ctx.activeStore ? ctx.activeStore.name : "All stores"} · {format(now, "EEEE, dd MMM")}
            </p>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              {greeting}, {ctx.user.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-primary-foreground/75">Here’s how the store is doing today.</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            <HeroStat icon={Eye} label="Eye tests today" value={eyeTestsToday} />
            <HeroStat icon={ReceiptText} label="Bills today" value={today.bills} />
            <HeroStat icon={PackageCheck} label="Ready for pickup" value={readyCount} />
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Link href="/sales/new" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-primary shadow-sm transition hover:bg-white/90">
            <Plus className="size-4" /> New Sale <span className="rounded bg-primary/10 px-1 text-[10px]">F2</span>
          </Link>
          <Link href="/customers?new=1" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/25">
            <UserPlus className="size-4" /> Add customer
          </Link>
          <span className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-xs text-primary-foreground/70 sm:inline-flex">
            <Search className="size-3.5" /> Press <kbd className="rounded bg-white/15 px-1 font-mono">Ctrl K</kbd> to find any customer or bill
          </span>
        </div>
      </section>

      {/* ============ QUICK TILES ============ */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <Tile href="/sales/new" icon={Glasses} title="Sell frames & lenses" hint="Bill + eye test in one screen" tone="primary" />
        <Tile href="/customers" icon={Users} title="Customers" hint="History, Rx, dues" />
        <Tile href="/sales?delivery=ready" icon={PackageCheck} title="Hand over orders" hint={`${readyCount} ready for pickup`} />
        <Tile href="/inventory" icon={Boxes} title="Frames & stock" hint={lowStock ? `${lowStock} running low` : "All stocked up"} tone={lowStock ? "warn" : undefined} />
      </div>

      {/* ============ KPIs ============ */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 xl:grid-cols-6">
        <Kpi
          icon={IndianRupee}
          label="Today's sales"
          value={formatINR(today.sales, { decimals: false })}
          hint={
            change !== null ? (
              <span className={cn("inline-flex items-center gap-0.5", change >= 0 ? "text-emerald-700" : "text-red-600")}>
                {change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(change)}% vs yesterday
              </span>
            ) : `${today.bills} bills`
          }
          href="/sales?range=today"
        />
        <Kpi icon={Wallet} label="Collected today" value={formatINR(collectedToday[0]?.amount ?? 0, { decimals: false })} hint="Cash + UPI + card" />
        <Kpi icon={ReceiptText} label="This month" value={formatINR(month.sales, { decimals: false })} hint={`${month.bills} bills`} href="/sales?range=30d" />
        <Kpi icon={Receipt} label="Avg bill" value={formatINR(avgBill, { decimals: false })} hint="This month" />
        <Kpi icon={UserPlus} label="New customers" value={newCustomers} hint="This month" href="/customers" />
        <Kpi icon={AlertTriangle} label="To collect" value={formatINR(due[0]?.amount ?? 0, { decimals: false })} hint={`${due[0]?.count ?? 0} bills due`} href="/sales?due=1" tone="red" />
      </div>

      {/* ============ SALES + WORKSHOP ============ */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily sales</CardTitle>
            <CardDescription>Last 14 days · {formatINR(twoWeekTotal, { decimals: false })}</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} className="h-56 lg:h-[22rem]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="size-4 text-primary" /> Workshop board</CardTitle>
            <CardDescription>Lens & fitting orders by stage</CardDescription>
            {overdueCount > 0 && (
              <CardAction>
                <Link href="/sales?delivery=open" className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  <Clock className="size-3" /> {overdueCount} late
                </Link>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ["pending", "Lens to order", "bg-amber-500"],
              ["in_lab", "In lab / fitting", "bg-sky-500"],
              ["ready", "Ready for pickup", "bg-emerald-500"],
            ].map(([key, label, dot]) => {
              const col = board[key];
              return (
                <div key={key} className="rounded-2xl bg-muted/50 p-2.5">
                  <Link href={`/sales?delivery=${key}`} className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={cn("size-2 rounded-full", dot)} /> {label}
                    </span>
                    <span className="text-sm font-semibold tabular">{col?.count ?? 0}</span>
                  </Link>
                  {col?.items?.length ? (
                    <ul className="space-y-0.5">
                      {col.items.slice(0, 3).map((o) => {
                        const late = key !== "ready" && o.deliveryDate && new Date(o.deliveryDate) < todayStart;
                        return (
                          <li key={String(o._id)} className="flex items-center gap-2 text-xs">
                            <Link href={`/sales/${o._id}`} className="min-w-0 flex-1 truncate hover:underline">{o.name}</Link>
                            {key === "ready" ? (
                              <a href={waLink(o.mobile, readyMessage({ ...o, customerSnapshot: { name: o.name } }, storeName[String(o.storeId)] ?? "EyeFit"))} target="_blank" rel="noreferrer" title="Tell them it's ready" className="text-[#128C7E]">
                                <WhatsAppIcon className="size-3.5" />
                              </a>
                            ) : (
                              <span className={cn("shrink-0 tabular", late ? "font-medium text-red-600" : "text-muted-foreground")}>{formatDate(o.deliveryDate, "dd MMM")}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nothing here</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ============ WHAT'S SELLING ============ */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length ? <HBarChart data={categoryData} unitLabel="pcs" /> : <Empty>No sales yet this month</Empty>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Glasses className="size-4 text-primary" /> Top frames</CardTitle>
            <CardDescription>Best sellers this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topFrames.length === 0 && <Empty>No frames sold yet</Empty>}
            {topFrames.map((f, i) => (
              <div key={f._id} className="flex items-center gap-3">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold", i === 0 ? "bg-chart-3 text-white" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">{f._id.replace(/ Frame$/, "")}</p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular">{f.qty} sold</p>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-chart-3" style={{ width: `${(f.qty / maxFrame) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Payment modes</CardTitle>
            <CardDescription>This month · {formatINR(modeTotal, { decimals: false })} received</CardDescription>
          </CardHeader>
          <CardContent>
            {modeData.length ? <HBarChart data={modeData} unitLabel="payments" /> : <Empty>No payments yet this month</Empty>}
          </CardContent>
        </Card>
      </div>

      {/* ============ STORES (owner, all-stores view) ============ */}
      {byStore.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Store performance</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(() => {
              const max = Math.max(...byStore.map((s) => s.sales), 1);
              return ctx.stores.map((s) => {
                const row = byStore.find((b) => String(b._id) === s.id) ?? { sales: 0, bills: 0 };
                return (
                  <div key={s.id} className="space-y-2 rounded-2xl bg-muted/50 p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><Store className="size-3.5 text-muted-foreground" /> {s.name}</p>
                      <p className="text-xs text-muted-foreground">{row.bills} bills</p>
                    </div>
                    <p className="text-xl font-semibold tabular">{formatINR(row.sales, { decimals: false })}</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-chart-3" style={{ width: `${(row.sales / max) * 100}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      )}

      {/* ============ ACTIVITY ============ */}
      <div className="grid gap-3 lg:grid-cols-2">
        <ListCard title="Recent eye tests" icon={Eye} href="/customers" empty="No eye tests yet">
          {recentRx.map((rx) => (
            <Link key={String(rx._id)} href={`/customers/${rx.customerId}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials(rx.customer?.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{rx.customer?.name ?? "Customer"}</span>
                <span className="block text-xs text-muted-foreground">{formatDate(rx.visitDate, "dd MMM, hh:mm a")}{rx.lens && ` · ${rx.lens}`}</span>
              </span>
              <span className="grid shrink-0 grid-cols-[auto_auto] gap-x-1.5 font-mono text-[11px] tabular">
                <span className="font-sans font-semibold text-primary">R</span><span>{rx.right?.dp?.sph || "—"}{rx.right?.dp?.cyl ? ` / ${rx.right.dp.cyl}` : ""}</span>
                <span className="font-sans font-semibold text-amber-700">L</span><span>{rx.left?.dp?.sph || "—"}{rx.left?.dp?.cyl ? ` / ${rx.left.dp.cyl}` : ""}</span>
              </span>
            </Link>
          ))}
        </ListCard>

        <ListCard title="Recent bills" icon={ReceiptText} href="/sales" empty="No bills yet">
          {recent.map((inv) => (
            <Link key={String(inv._id)} href={`/sales/${inv._id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{inv.customerSnapshot?.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  <span className="font-mono">{inv.invoiceNo}</span> · {inv.items.map((i) => i.name).join(", ")}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold tabular">{formatINR(inv.grandTotal, { decimals: false })}</span>
                {inv.balance > 0 ? <span className="block text-[11px] text-red-600">Due {formatINR(inv.balance, { decimals: false })}</span> : <span className="block text-[11px] text-emerald-700">Paid</span>}
              </span>
            </Link>
          ))}
        </ListCard>
      </div>
    </>
  );
}

/* ------------------------------ helpers ------------------------------ */

async function sumSales(match) {
  const [r] = await Invoice.aggregate([{ $match: match }, { $group: { _id: null, sales: { $sum: "$grandTotal" }, bills: { $sum: 1 } } }]);
  return r ?? { sales: 0, bills: 0 };
}

async function countLowStock(ctx) {
  const tracked = await Product.find({ isActive: true, trackStock: true }).select("_id").lean();
  const [r] = await Inventory.aggregate([
    { $match: { ...storeScope(ctx), productId: { $in: tracked.map((p) => p._id) } } },
    { $group: { _id: "$productId", qty: { $sum: "$qty" }, minQty: { $sum: "$minQty" } } },
    { $match: { $expr: { $lte: ["$qty", "$minQty"] } } },
    { $count: "n" },
  ]);
  return r?.n ?? 0;
}

/* ------------------------------- pieces ------------------------------- */

/** Line-art spectacles used as a watermark in the hero. */
function GlassesArt({ className }) {
  return (
    <svg viewBox="0 0 240 110" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 40 L24 32" />
      <path d="M232 40 L216 32" />
      <rect x="24" y="30" width="84" height="62" rx="28" />
      <rect x="132" y="30" width="84" height="62" rx="28" />
      <path d="M108 50 Q120 38 132 50" />
      <path d="M44 48 Q56 40 68 46" strokeWidth="4" opacity="0.6" />
      <path d="M152 48 Q164 40 176 46" strokeWidth="4" opacity="0.6" />
    </svg>
  );
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur-sm sm:px-3">
      <Icon className="hidden size-4 text-primary-foreground/80 sm:block" />
      <div className="leading-tight">
        <p className="text-lg font-semibold tabular">{value}</p>
        <p className="text-[10px] leading-tight text-primary-foreground/70 sm:text-[11px]">{label}</p>
      </div>
    </div>
  );
}

function Tile({ href, icon: Icon, title, hint, tone }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-2xl bg-card p-3 ring-1 ring-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:gap-3 md:p-4"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          tone === "primary" ? "bg-primary text-primary-foreground" : tone === "warn" ? "bg-amber-500/15 text-amber-700" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold sm:truncate">{title}</span>
        <span className="line-clamp-2 block text-xs text-muted-foreground sm:truncate">{hint}</span>
      </span>
      <ArrowRight className="hidden size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
    </Link>
  );
}

function Kpi({ icon: Icon, label, value, hint, href, tone }) {
  const body = (
    <Card size="sm" className={cn("h-full", href && "transition-shadow hover:shadow-md")}>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={cn("size-4", tone === "red" ? "text-red-500" : "text-muted-foreground/70")} />
        </div>
        <p className={cn("text-lg font-semibold tracking-tight tabular md:text-xl", tone === "red" && "text-red-600")}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function ListCard({ title, icon: Icon, href, empty, children }) {
  const has = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="size-4 text-primary" /> {title}</CardTitle>
        <CardAction>
          <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all <ArrowRight className="size-3" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-0.5">{has ? children : <Empty>{empty}</Empty>}</CardContent>
    </Card>
  );
}

function Empty({ children }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-44 rounded-3xl" />
      <CardsSkeleton />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

