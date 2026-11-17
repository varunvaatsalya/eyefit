"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, UserPlus, X, Phone, AlertTriangle, UserCheck, History } from "lucide-react";
import { findCustomers } from "@/actions/customers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GenderPicker } from "@/components/customers/customer-dialog";
import { cn } from "@/lib/utils";
import { formatDate, formatINR, initials } from "@/lib/format";

const genderAge = (c) =>
  [c.gender && c.gender[0].toUpperCase() + c.gender.slice(1), c.age && `${c.age} yrs`].filter(Boolean).join(" · ");

const field =
  "h-9 w-full min-w-0 rounded-xl border border-transparent bg-background px-3 text-sm outline-none ring-1 ring-foreground/10 transition-colors focus:border-ring focus:ring-3 focus:ring-ring/30";

/** Two cases: existing customer (pick from matches) or new customer (fill inline, with duplicate check). */
export function CustomerPicker({ selected, onSelect, onClear, newCustomer, onNewCustomer, loading, inputRef }) {
  if (selected) return <ExistingCustomer data={selected} onClear={onClear} />;
  if (newCustomer) return <NewCustomer value={newCustomer} onChange={onNewCustomer} onClear={onClear} onSelect={onSelect} />;
  return <CustomerSearch inputRef={inputRef} loading={loading} onSelect={onSelect} onNewCustomer={onNewCustomer} />;
}

/* -------------------------------- search -------------------------------- */
function CustomerSearch({ inputRef, loading, onSelect, onNewCustomer }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();

  const digits = q.replace(/\D/g, "");
  const isMobile = /^[6-9]\d{9}$/.test(digits) && digits.length === q.replace(/\s/g, "").length;

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => startTransition(async () => {
      setResults(await findCustomers(q));
      setActive(0);
    }), 180);
    return () => clearTimeout(t);
  }, [q]);

  const shown = q.trim().length < 2 ? [] : results;
  const startNew = () => {
    const numeric = /^[\d\s+]+$/.test(q.trim());
    onNewCustomer({ name: numeric ? "" : q.trim(), mobile: numeric ? digits.slice(-10) : "", gender: "", age: "" });
    setOpen(false);
    setQ("");
  };
  const pick = (c) => {
    onSelect(c);
    setQ("");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    const total = shown.length + (q.trim().length >= 2 ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(total - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (pending) return;
      if (shown[active]) pick(shown[active]);
      else if (q.trim().length >= 2) startNew();
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {pending || loading ? (
          <Loader2 className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Mobile number or customer name…"
          className="h-10 w-full rounded-full border border-transparent bg-input/50 pr-4 pl-10 text-sm outline-none transition-colors focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30"
        />
        {open && q.trim().length >= 2 && (
          <div className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-2xl bg-popover p-1 shadow-xl ring-1 ring-foreground/10">
            {shown.length > 0 && (
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Matching customers ({shown.length})
              </p>
            )}
            {shown.map((c, i) => (
              <button
                key={c._id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                onMouseEnter={() => setActive(i)}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left", active === i && "bg-muted")}
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium"><Highlight text={c.name} q={q} /></p>
                  <p className="truncate text-xs text-muted-foreground">
                    #{c.customerNo}{genderAge(c) && ` · ${genderAge(c)}`} · visited {formatDate(c.lastVisitAt, "dd MMM yy")}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground"><Highlight text={c.mobile} q={digits} /></span>
              </button>
            ))}
            {!pending && shown.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">No existing customer matches.</p>}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={startNew}
              onMouseEnter={() => setActive(shown.length)}
              className={cn("mt-1 flex w-full items-center gap-2.5 rounded-xl border-t px-2.5 py-2 text-left text-sm font-medium text-emerald-700", active === shown.length && "bg-emerald-500/10")}
            >
              <UserPlus className="size-4" />
              {isMobile ? `New customer with ${digits}` : `New customer “${q.trim()}”`}
              <span className="ml-auto text-[11px] font-normal text-muted-foreground">Enter ↵</span>
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Existing customers show up as you type. Not found? Press <b>Enter</b> to add a new one.
      </p>
    </div>
  );
}

function Highlight({ text = "", q = "" }) {
  const needle = q.trim();
  if (!needle) return text;
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-inherit">{text.slice(i, i + needle.length)}</mark>
      {text.slice(i + needle.length)}
    </>
  );
}

/* ---------------------------- existing customer ---------------------------- */
function ExistingCustomer({ data, onClear }) {
  const c = data.customer;
  const last = data.lastInvoice;
  return (
    <div className="space-y-2.5 rounded-2xl bg-primary/5 p-3 ring-1 ring-primary/15">
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">{initials(c.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <UserCheck className="size-3" /> Existing
            </span>
            <span className="text-xs text-muted-foreground">#{c.customerNo}</span>
          </div>
          <p className="truncate font-semibold">{c.name}</p>
          <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono"><Phone className="size-3" />{c.mobile}</span>
            {genderAge(c) && <span>{genderAge(c)}</span>}
            {c.referDoctor && <span>Ref: {c.referDoctor}</span>}
          </p>
        </div>
        <Button variant="ghost" size="xs" onClick={onClear}>
          <X /> Change
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <Stat label="Visits" value={data.stats?.visits ?? 0} />
        <Stat label="Bills" value={data.stats?.bills ?? 0} />
        <Stat label="Spent" value={formatINR(data.stats?.spent ?? 0, { decimals: false })} />
        <Stat label="Old due" value={formatINR(data.due?.balance ?? 0, { decimals: false })} danger={data.due?.balance > 0} />
      </div>

      {last && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <History className="mt-0.5 size-3 shrink-0" />
          <span className="min-w-0">
            Last bill <span className="font-mono text-foreground">{last.invoiceNo}</span> · {formatDate(last.date, "dd MMM yy")} ·{" "}
            <span className="text-foreground">{last.items.map((i) => i.name).join(", ")}</span>
          </span>
        </p>
      )}
      {c.remark && <p className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-900">{c.remark}</p>}
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div className={cn("rounded-lg bg-background px-1 py-1 ring-1 ring-foreground/5", danger && "bg-red-500/10 ring-red-500/20")}>
      <p className={cn("truncate text-sm font-semibold tabular", danger && "text-red-700")}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

/* ------------------------------ new customer ------------------------------ */
function NewCustomer({ value, onChange, onClear, onSelect }) {
  const [matches, setMatches] = useState([]);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef(null);
  const mobileRef = useRef(null);
  const set = (k) => (v) => onChange({ ...value, [k]: v });

  useEffect(() => {
    (value.mobile ? nameRef : mobileRef).current?.focus();
    // focus only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duplicate check: look up by mobile (5+ digits) and by name (3+ letters) while typing.
  const mobileQ = value.mobile.length >= 5 ? value.mobile : "";
  const nameQ = value.name.trim().length >= 3 ? value.name.trim() : "";
  useEffect(() => {
    if (!mobileQ && !nameQ) return;
    const t = setTimeout(() => startTransition(async () => {
      const [a, b] = await Promise.all([mobileQ ? findCustomers(mobileQ) : [], nameQ ? findCustomers(nameQ) : []]);
      const seen = new Set();
      setMatches([...a, ...b].filter((c) => !seen.has(c._id) && seen.add(c._id)).slice(0, 5));
    }), 250);
    return () => clearTimeout(t);
  }, [mobileQ, nameQ]);

  const shownMatches = mobileQ || nameQ ? matches : [];
  const exactMobile = value.mobile.length === 10 && shownMatches.some((m) => m.mobile === value.mobile);

  return (
    <div className="space-y-2.5 rounded-2xl bg-emerald-500/5 p-3 ring-1 ring-emerald-500/20">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          <UserPlus className="size-3" /> New customer · saved with this bill
        </span>
        <Button variant="ghost" size="xs" onClick={onClear}>
          <X /> Cancel
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input ref={mobileRef} value={value.mobile} onChange={(e) => set("mobile")(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile *" inputMode="numeric" className={cn(field, "font-mono")} />
        <input ref={nameRef} value={value.name} onChange={(e) => set("name")(e.target.value)} placeholder="Customer name *" className={cn(field, "uppercase placeholder:normal-case")} />
        <div className="min-w-0 overflow-x-auto"><GenderPicker value={value.gender} onChange={set("gender")} /></div>
        <input value={value.age} onChange={(e) => set("age")(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Age" inputMode="numeric" className={field} />
      </div>

      {(shownMatches.length > 0 || pending) && (
        <div className={cn("rounded-xl p-2", exactMobile ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "bg-background ring-1 ring-foreground/5")}>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium">
            {pending ? <Loader2 className="size-3 animate-spin" /> : exactMobile ? <AlertTriangle className="size-3.5 text-amber-600" /> : <UserCheck className="size-3.5 text-primary" />}
            {exactMobile ? "This mobile is already registered. Use the existing customer?" : "Similar existing customers"}
          </p>
          {shownMatches.map((m) => (
            <div key={m._id} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-muted/60">
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{m.name}</span> <span className="text-muted-foreground">#{m.customerNo}</span>
              </span>
              <span className={cn("font-mono", m.mobile === value.mobile ? "font-semibold text-amber-700" : "text-muted-foreground")}>{m.mobile}</span>
              <Button size="xs" variant="outline" onClick={() => onSelect(m)}>Use</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
