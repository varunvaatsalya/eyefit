"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Copy, Eye, EyeOff, Loader2, Minus, Plus, Printer, Save, X, ShoppingCart, User, Glasses, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createSale } from "@/actions/sales";
import { getCustomerForSale } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/kbd";
import { RxForm, EMPTY_RX, rxFromSaved, rxIsEmpty } from "@/components/rx/rx-form";
import { RxView } from "@/components/rx/rx-view";
import { CustomerPicker } from "./customer-picker";
import { ProductPicker } from "./product-picker";
import { calcTotals, sumPayments } from "@/lib/billing";
import { CATEGORY_LABEL, PAYMENT_MODES } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { billMessage, waLink } from "@/lib/whatsapp";

let uid = 0;
const key = () => `l${++uid}`;
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return format(d, "yyyy-MM-dd");
};

export function SaleForm({ storeName, initialCustomer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const customerInputRef = useRef(null);
  const productInputRef = useRef(null);

  const [selected, setSelected] = useState(initialCustomer ?? null);
  const [newCustomer, setNewCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [rxMode, setRxMode] = useState(initialCustomer?.lastRx ? "last" : "none"); // none | last | new
  const [rx, setRx] = useState(EMPTY_RX);

  const [items, setItems] = useState([]);
  const [extraDiscount, setExtraDiscount] = useState("");
  const [payments, setPayments] = useState([{ mode: "cash", amount: "" }]);
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliverNow, setDeliverNow] = useState(null);
  const [notes, setNotes] = useState("");
  const [waBill, setWaBill] = useState(true);
  const [waReminder, setWaReminder] = useState(true);

  const totals = useMemo(() => calcTotals(items, extraDiscount), [items, extraDiscount]);
  const needsWorkshop = items.some((i) => i.category === "lens");
  const days = deliveryDays ?? (needsWorkshop ? 3 : 0);
  const delivered = deliverNow ?? !needsWorkshop;

  const effectivePayments = paymentTouched ? payments : [{ ...payments[0], amount: totals.grandTotal }];
  const paid = sumPayments(effectivePayments);
  const balance = Math.max(0, Math.round((totals.grandTotal - paid) * 100) / 100);

  /* ------------------------------ customer ------------------------------ */
  const pickCustomer = async (c) => {
    setLoadingCustomer(true);
    const data = await getCustomerForSale(c._id);
    setLoadingCustomer(false);
    if (!data) return toast.error("Customer not found");
    setSelected(data);
    setNewCustomer(null);
    setRxMode(data.lastRx ? "last" : "none");
    setRx(EMPTY_RX);
  };
  const startNewCustomer = (nc) => {
    setNewCustomer(nc);
    if (rxMode === "last") setRxMode("none");
  };
  const clearCustomer = () => {
    setSelected(null);
    setNewCustomer(null);
    setRxMode("none");
    setTimeout(() => customerInputRef.current?.focus(), 0);
  };

  /* -------------------------------- items ------------------------------- */
  const addProduct = (p) => {
    if (p.trackStock && p.stock <= 0) toast.warning(`${p.name} is out of stock in this store`);
    setItems((list) => {
      const existing = list.find((l) => l.productId === p._id);
      if (existing && p.category !== "lens") return list.map((l) => (l.productId === p._id ? { ...l, qty: l.qty + 1 } : l));
      return [
        ...list,
        {
          key: key(),
          productId: p._id,
          category: p.category,
          name: p.name,
          brand: p.brand,
          modelNo: p.modelNo,
          details: [p.attributes?.colour, p.attributes?.size, p.attributes?.index && `Index ${p.attributes.index}`].filter(Boolean).join(" · "),
          rate: p.sellingPrice,
          qty: p.category === "lens" ? 2 : 1,
          discountPct: 0,
          gstPct: p.gstPercent,
          stock: p.trackStock ? p.stock : null,
        },
      ];
    });
  };
  const addCustom = (category) =>
    setItems((list) => [
      ...list,
      { key: key(), productId: null, category, name: "", brand: "", modelNo: "", details: "", rate: 0, qty: 1, discountPct: 0, gstPct: category === "lens" || category === "frame" ? 5 : 18, custom: true },
    ]);
  const updateItem = (k, patch) => setItems((list) => list.map((l) => (l.key === k ? { ...l, ...patch } : l)));
  const removeItem = (k) => setItems((list) => list.filter((l) => l.key !== k));
  const applyDiscountAll = (pct) => setItems((list) => list.map((l) => ({ ...l, discountPct: pct })));

  /* ------------------------------- payments ----------------------------- */
  const setPayment = (i, patch) => {
    const base = paymentTouched ? payments : effectivePayments;
    setPaymentTouched(true);
    setPayments(base.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const addSplit = () => {
    const base = paymentTouched ? payments : effectivePayments;
    setPaymentTouched(true);
    setPayments([...base, { mode: "upi", amount: balance || "" }]);
  };
  const removeSplit = (i) => setPayments((p) => p.filter((_, idx) => idx !== i));

  /* --------------------------------- save -------------------------------- */
  const reset = () => {
    setSelected(null);
    setNewCustomer(null);
    setRxMode("none");
    setRx(EMPTY_RX);
    setItems([]);
    setExtraDiscount("");
    setPayments([{ mode: "cash", amount: "" }]);
    setPaymentTouched(false);
    setDeliveryDays(null);
    setDeliverNow(null);
    setNotes("");
    setWaBill(true);
    setWaReminder(true);
  };

  const save = useCallback(
    (print) => {
      if (!selected && !newCustomer) {
        toast.error("Select or add a customer first");
        customerInputRef.current?.focus();
        return;
      }
      if (newCustomer && (!newCustomer.name.trim() || !/^[6-9]\d{9}$/.test(newCustomer.mobile))) {
        toast.error("Enter new customer's name and a valid 10-digit mobile");
        return;
      }
      if (!items.length) {
        toast.error("Add at least one item");
        productInputRef.current?.focus();
        return;
      }
      if (items.some((i) => !i.name.trim())) return toast.error("Custom item needs a name");
      if (rxMode === "new" && rxIsEmpty(rx)) return toast.error("Eye test is empty. Fill it or choose “None”.");

      const printWin = print ? window.open("about:blank", "_blank") : null;
      startTransition(async () => {
        const res = await createSale({
          customerId: selected?.customer._id ?? null,
          newCustomer: selected ? null : newCustomer,
          rx: rxMode === "new" ? rx : null,
          prescriptionId: rxMode === "last" ? selected?.lastRx?._id : null,
          items: items.map(({ key: _k, stock: _s, custom: _c, ...i }) => i),
          extraDiscount: Number(extraDiscount) || 0,
          payments: effectivePayments.map((p) => ({ mode: p.mode, amount: Number(p.amount) || 0 })),
          deliveryDate: addDays(days),
          deliveryStatus: delivered ? "delivered" : "pending",
          notes,
          whatsapp: { sendBill: waBill, dueReminder: waReminder && balance > 0 },
        });
        if (res.error) {
          printWin?.close();
          toast.error(res.error);
          return;
        }
        const mobile = selected?.customer.mobile ?? newCustomer?.mobile;
        if (waBill && mobile) {
          // Business API is not wired yet: offer a one-click wa.me link with the bill text.
          const msg = billMessage(
            {
              invoiceNo: res.invoiceNo,
              date: new Date(),
              customerSnapshot: { name: selected?.customer.name ?? newCustomer?.name ?? "" },
              items: totals.lines,
              grandTotal: totals.grandTotal,
              paidTotal: paid,
              balance,
              deliveryStatus: delivered ? "delivered" : "pending",
              deliveryDate: addDays(days),
            },
            storeName
          );
          toast.success(`Bill ${res.invoiceNo} saved`, {
            duration: 12000,
            action: { label: "Send on WhatsApp", onClick: () => window.open(waLink(mobile, msg), "_blank") },
          });
        } else {
          toast.success(`Bill ${res.invoiceNo} saved`);
        }
        if (printWin) printWin.location.href = `/print/invoice/${res.id}?auto=1`;
        reset();
        router.push(`/sales/${res.id}`);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, newCustomer, items, rxMode, rx, extraDiscount, effectivePayments, days, delivered, notes, waBill, waReminder, totals, paid, balance, storeName]
  );

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        save(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const lastRx = selected?.lastRx;
  const hasCustomer = !!(selected || newCustomer);

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_310px]">
        {/* ============ CUSTOMER DETAILS ============ */}
        <Panel icon={User} title="Customer details" className="lg:col-start-1 lg:row-start-1">
          <CustomerPicker
            inputRef={customerInputRef}
            selected={selected}
            onSelect={pickCustomer}
            onClear={clearCustomer}
            newCustomer={newCustomer}
            onNewCustomer={startNewCustomer}
            loading={loadingCustomer}
          />

          <div className="mt-3 border-t pt-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium"><Eye className="size-4 text-primary" /> Eye test / Rx</p>
              <div className="inline-flex rounded-full bg-muted p-0.5">
                <Seg active={rxMode === "none"} onClick={() => setRxMode("none")}><EyeOff className="size-3" /> None</Seg>
                {lastRx && <Seg active={rxMode === "last"} onClick={() => setRxMode("last")}>Last · {formatDate(lastRx.visitDate, "dd MMM yy")}</Seg>}
                <Seg active={rxMode === "new"} onClick={() => setRxMode("new")} disabled={!hasCustomer}><Plus className="size-3" /> New</Seg>
              </div>
            </div>
            {rxMode === "none" && (
              <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {hasCustomer ? "No prescription on this bill (e.g. solution, sunglasses, repair)." : "Pick a customer first. Their last prescription appears here."}
              </p>
            )}
            {rxMode === "last" && lastRx && (
              <div className="space-y-2">
                <RxView rx={lastRx} dense />
                <Button variant="outline" size="xs" onClick={() => { setRx(rxFromSaved(lastRx)); setRxMode("new"); }}>
                  <Copy /> Edit as new eye test
                </Button>
              </div>
            )}
            {rxMode === "new" && <RxForm value={rx} onChange={setRx} compact />}
          </div>
        </Panel>

        {/* ============ BILLING DETAILS ============ */}
        <Panel
          icon={ShoppingCart}
          title="Billing details"
          className="lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:row-start-1"
          action={
            items.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">Disc all</span>
                {[0, 5, 10, 15].map((p) => (
                  <button key={p} type="button" onClick={() => applyDiscountAll(p)} className="rounded-full border px-1.5 py-px hover:bg-muted hover:text-foreground">{p}%</button>
                ))}
              </div>
            )
          }
        >
          <ProductPicker inputRef={productInputRef} onAdd={addProduct} onCustom={addCustom} />
          <div className="mt-3 space-y-1.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
                <Glasses className="size-6 text-muted-foreground/50" />
                Scan or search to add frames, lenses and accessories.
              </div>
            ) : (
              items.map((it, idx) => (
                <ItemRow key={it.key} item={it} line={totals.lines[idx]} onChange={(p) => updateItem(it.key, p)} onRemove={() => removeItem(it.key)} />
              ))
            )}
          </div>
        </Panel>

        {/* ============ PAYMENT ============ */}
        <Panel
          icon={Wallet}
          title="Payment"
          action={<span className="truncate text-[11px] text-muted-foreground">{storeName}</span>}
          className="lg:sticky lg:top-16 lg:col-start-2 lg:row-span-2 lg:row-start-1 xl:col-start-3 xl:row-span-1"
        >
          <div className="space-y-1 text-sm">
            <Row label={`Items (${totals.qty})`} value={formatINR(totals.subTotal)} />
            {totals.itemDiscount > 0 && <Row label="Discount" value={`− ${formatINR(totals.itemDiscount)}`} className="text-emerald-700" />}
            <Row label="GST" value={formatINR(totals.gstTotal)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Extra discount ₹</span>
              <input value={extraDiscount} onChange={(e) => setExtraDiscount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className="h-7 w-20 rounded-lg bg-input/50 px-2 text-right tabular outline-none focus:ring-3 focus:ring-ring/30" />
            </div>
            {totals.roundOff !== 0 && <Row label="Round off" value={formatINR(totals.roundOff)} />}
          </div>
          <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
            <span className="text-sm opacity-80">Total</span>
            <span className="text-2xl font-semibold tracking-tight tabular">{formatINR(totals.grandTotal, { decimals: false })}</span>
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Received</p>
            {effectivePayments.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="inline-flex shrink-0 rounded-full bg-muted p-0.5">
                  {PAYMENT_MODES.map((m) => (
                    <button key={m.value} type="button" onClick={() => setPayment(i, { mode: m.value })} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", p.mode === m.value ? "bg-background shadow-sm" : "text-muted-foreground")}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <input value={p.amount} onChange={(e) => setPayment(i, { amount: e.target.value.replace(/[^\d.]/g, "") })} className="h-7 w-full min-w-0 rounded-lg bg-input/50 px-2 text-right text-sm font-medium tabular outline-none focus:ring-3 focus:ring-ring/30" />
                {i > 0 && (
                  <button type="button" onClick={() => removeSplit(i)} className="text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-1">
              <Chip onClick={addSplit}>+ Split</Chip>
              <Chip onClick={() => setPayment(0, { amount: String(Math.round(totals.grandTotal / 2)) })}>50% advance</Chip>
              <Chip onClick={() => setPayment(0, { amount: "0" })}>Pay later</Chip>
            </div>
            <div className={cn("flex justify-between rounded-xl px-3 py-1.5 text-sm font-medium", balance > 0 ? "bg-red-500/10 text-red-700" : "bg-emerald-500/10 text-emerald-700")}>
              <span>{balance > 0 ? "Balance due" : "Fully paid"}</span>
              <span className="tabular">{formatINR(balance)}</span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Delivery</p>
            <div className="inline-flex w-full rounded-full bg-muted p-0.5">
              <Seg className="flex-1" active={delivered} onClick={() => setDeliverNow(true)}>Handed over</Seg>
              <Seg className="flex-1" active={!delivered} onClick={() => setDeliverNow(false)}>Deliver later</Seg>
            </div>
            {!delivered && (
              <div className="flex flex-wrap items-center gap-1">
                {[["Today", 0], ["+1 day", 1], ["+3 days", 3], ["+1 week", 7]].map(([l, n]) => (
                  <Chip key={l} active={days === n} onClick={() => setDeliveryDays(n)}>{l}</Chip>
                ))}
                <span className="ml-auto text-[11px] text-muted-foreground">{formatDate(addDays(days), "EEE dd MMM")}</span>
              </div>
            )}
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note for workshop / bill" className="h-8 w-full rounded-lg bg-input/50 px-2.5 text-xs outline-none focus:ring-3 focus:ring-ring/30" />
          </div>

          <div className="mt-3 space-y-1 rounded-xl bg-[#25D366]/8 p-2 ring-1 ring-[#25D366]/25">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#128C7E] uppercase">
              <WhatsAppIcon className="size-3.5" /> WhatsApp
            </p>
            <Toggle checked={waBill} onChange={setWaBill}>Send bill to customer</Toggle>
            <Toggle checked={waReminder && balance > 0} onChange={setWaReminder} disabled={balance <= 0}>
              Remind for balance{balance > 0 ? ` (${formatINR(balance, { decimals: false })})` : ""} on delivery
            </Toggle>
          </div>

          <div className="mt-3 hidden grid-cols-2 gap-2 lg:grid">
            <Button variant="outline" onClick={() => save(false)} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />} Save <Kbd className="h-4">Ctrl S</Kbd>
            </Button>
            <Button onClick={() => save(true)} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Printer />} Save & Print
            </Button>
          </div>
        </Panel>
      </div>

      {/* Mobile / tablet sticky checkout bar */}
      <div className="no-print fixed inset-x-0 bottom-15 z-20 flex items-center gap-2 border-t bg-background/95 px-3 py-2 backdrop-blur md:bottom-0 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{totals.qty} items · {balance > 0 ? `due ${formatINR(balance, { decimals: false })}` : "paid"}</p>
          <p className="text-lg font-semibold tabular">{formatINR(totals.grandTotal, { decimals: false })}</p>
        </div>
        <Button variant="outline" onClick={() => save(false)} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
        <Button onClick={() => save(true)} disabled={pending}>
          <Printer /> Print
        </Button>
      </div>
      <div className="h-16 lg:hidden" />
    </>
  );
}

/* ------------------------------- pieces ------------------------------- */

function Panel({ icon: Icon, title, action, className, children }) {
  return (
    <section className={cn("rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/5 md:p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-3.5" /></span>
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function ItemRow({ item: it, line, onChange, onRemove }) {
  const overStock = it.stock !== null && it.stock !== undefined && it.qty > it.stock;
  return (
    <div className="rounded-xl bg-muted/40 p-2 ring-1 ring-foreground/5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {it.custom ? (
            <input autoFocus value={it.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={`${CATEGORY_LABEL[it.category]} description`} className="h-7 w-full rounded-lg bg-background px-2 text-sm outline-none ring-1 ring-foreground/10 focus:ring-3 focus:ring-ring/30" />
          ) : (
            <p className="truncate text-sm font-medium">{it.name}</p>
          )}
          <p className="truncate text-[11px] text-muted-foreground">
            {CATEGORY_LABEL[it.category]}
            {it.details && ` · ${it.details}`}
            {overStock && <span className="text-red-600"> · only {it.stock} in stock</span>}
          </p>
        </div>
        <p className="pt-0.5 text-sm font-semibold tabular">{formatINR(line?.total)}</p>
        <button type="button" onClick={onRemove} className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <div className="flex items-center rounded-full bg-background ring-1 ring-foreground/10">
          <button type="button" className="flex size-6 items-center justify-center rounded-full hover:bg-muted" onClick={() => it.qty > 1 && onChange({ qty: it.qty - 1 })}><Minus className="size-3" /></button>
          <span className="w-6 text-center text-xs font-medium tabular">{it.qty}</span>
          <button type="button" className="flex size-6 items-center justify-center rounded-full hover:bg-muted" onClick={() => onChange({ qty: it.qty + 1 })}><Plus className="size-3" /></button>
        </div>
        <NumField label="₹" value={it.rate} onChange={(v) => onChange({ rate: v })} className="w-24" />
        <NumField label="Disc %" value={it.discountPct} onChange={(v) => onChange({ discountPct: v })} className="w-20" />
        <NumField label="GST %" value={it.gstPct} onChange={(v) => onChange({ gstPct: v })} className="w-20" />
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, className }) {
  return (
    <label className={cn("flex h-6 items-center gap-1 rounded-full bg-background pr-1 pl-2 ring-1 ring-foreground/10 focus-within:ring-3 focus-within:ring-ring/30", className)}>
      <span className="shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} onFocus={(e) => e.target.select()} inputMode="decimal" className="w-full min-w-0 bg-transparent text-right text-xs tabular outline-none" />
    </label>
  );
}

function Seg({ active, onClick, children, className, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-40",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-full border px-2 py-px text-[11px]", active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, disabled, children }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 text-xs", disabled && "opacity-50")}>
      <span>{children}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative h-4 w-7 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed", checked ? "bg-[#25D366]" : "bg-muted-foreground/30")}
      >
        <span className={cn("absolute top-0.5 size-3 rounded-full bg-white shadow transition-all", checked ? "left-3.5" : "left-0.5")} />
      </button>
    </div>
  );
}

function Row({ label, value, className }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
