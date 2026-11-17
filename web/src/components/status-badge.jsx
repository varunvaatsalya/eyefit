import { cn } from "@/lib/utils";
import { DELIVERY_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";

const DELIVERY_STYLE = {
  pending: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  in_lab: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
  ready: "bg-violet-500/10 text-violet-700 ring-violet-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
};

const pill = "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

export function DeliveryBadge({ status, className }) {
  return (
    <span className={cn(pill, DELIVERY_STYLE[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {DELIVERY_LABEL[status] ?? status}
    </span>
  );
}

export function PaymentBadge({ balance, status, className }) {
  if (status === "cancelled") return <span className={cn(pill, "bg-muted text-muted-foreground ring-border", className)}>Cancelled</span>;
  if (balance > 0) return <span className={cn(pill, "bg-red-500/10 text-red-700 ring-red-500/20", className)}>Due {formatINR(balance, { decimals: false })}</span>;
  return <span className={cn(pill, "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20", className)}>Paid</span>;
}

export function StockBadge({ qty, minQty = 2, trackStock = true }) {
  if (!trackStock) return <span className={cn(pill, "bg-muted text-muted-foreground ring-border")}>Made to order</span>;
  if (qty <= 0) return <span className={cn(pill, "bg-red-500/10 text-red-700 ring-red-500/20")}>Out of stock</span>;
  if (qty <= minQty) return <span className={cn(pill, "bg-amber-500/10 text-amber-700 ring-amber-500/20")}>Low · {qty}</span>;
  return <span className={cn(pill, "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20")}>{qty} in stock</span>;
}
