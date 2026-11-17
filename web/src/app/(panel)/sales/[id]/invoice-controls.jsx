"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, PackageCheck, Ban, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { addPayment, setDeliveryStatus, cancelInvoice } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DELIVERY_STATUSES, PAYMENT_MODES } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER = DELIVERY_STATUSES.map((d) => d.value);

export function DeliveryStepper({ invoiceId, status, balance, disabled }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState("cash");
  const idx = ORDER.indexOf(status);

  const go = (s, opts) =>
    startTransition(async () => {
      const r = await setDeliveryStatus(invoiceId, s, opts);
      if (r.error) toast.error(r.error);
      else toast.success(s === "delivered" ? "Marked as delivered" : `Status: ${DELIVERY_STATUSES.find((d) => d.value === s).label}`);
    });

  const next = ORDER[idx + 1];

  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-4 gap-2">
        {DELIVERY_STATUSES.map((d, i) => {
          const done = i <= idx;
          return (
            <li key={d.value}>
              <button
                type="button"
                disabled={disabled || pending}
                onClick={() => go(d.value)}
                className="group flex w-full flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span className="relative flex w-full items-center">
                  <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "bg-transparent" : done ? "bg-primary" : "bg-muted")} />
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                      done ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground group-hover:border-primary/50"
                    )}
                  >
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("h-1 flex-1 rounded-full", i === ORDER.length - 1 ? "bg-transparent" : i < idx ? "bg-primary" : "bg-muted")} />
                </span>
                <span className={cn("text-xs font-medium", done ? "text-foreground" : "text-muted-foreground")}>{d.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {!disabled && next && (
        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-muted/60 p-3">
          {next === "delivered" && balance > 0 ? (
            <>
              <span className="text-sm">Collect <b className="tabular">{formatINR(balance)}</b> via</span>
              <div className="inline-flex rounded-full bg-background p-0.5">
                {PAYMENT_MODES.slice(0, 3).map((m) => (
                  <button key={m.value} type="button" onClick={() => setMode(m.value)} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", mode === m.value ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    {m.label}
                  </button>
                ))}
              </div>
              <Button className="ml-auto" onClick={() => go("delivered", { collectBalance: mode })} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />} Collect & deliver
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Next step</span>
              <Button className="ml-auto" onClick={() => go(next)} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <Check />} Mark as {DELIVERY_STATUSES.find((d) => d.value === next).label}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CollectPayment({ invoiceId, balance }) {
  const [amount, setAmount] = useState(String(balance));
  const [mode, setMode] = useState("cash");
  const [pending, startTransition] = useTransition();
  if (balance <= 0) return null;

  const submit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await addPayment(invoiceId, { amount, mode });
      if (r.error) return toast.error(r.error);
      toast.success("Payment recorded");
      setAmount(String(r.balance));
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-3xl border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">Collect payment</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-muted p-0.5">
          {PAYMENT_MODES.map((m) => (
            <button key={m.value} type="button" onClick={() => setMode(m.value)} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", mode === m.value ? "bg-background shadow-sm" : "text-muted-foreground")}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-24 flex-1">
          <IndianRupee className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className="h-8 w-full rounded-xl bg-input/50 pr-2 pl-6 text-right tabular outline-none focus:ring-3 focus:ring-ring/30" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save
        </Button>
      </div>
    </form>
  );
}

export function CancelInvoiceButton({ invoiceId, invoiceNo }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Ban /> Cancel bill
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel bill {invoiceNo}?</AlertDialogTitle>
          <AlertDialogDescription>Items go back into stock. The bill stays in records, marked as cancelled. You cannot undo this.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep bill</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const r = await cancelInvoice(invoiceId);
                if (r.error) return toast.error(r.error);
                toast.success("Bill cancelled");
                setOpen(false);
              })
            }
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" />} Cancel bill
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
