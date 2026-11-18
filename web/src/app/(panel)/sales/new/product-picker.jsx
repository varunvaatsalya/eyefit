"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, ScanBarcode, PenLine } from "lucide-react";
import { searchProducts } from "@/actions/inventory";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Scan a barcode or type to search. Enter adds the highlighted product. */
export function ProductPicker({ onAdd, onCustom, inputRef }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      () =>
        startTransition(async () => {
          setResults(await searchProducts(q, cat));
          setActive(0);
        }),
      q ? 150 : 0
    );
    return () => clearTimeout(t);
  }, [q, cat, open]);

  const add = (p) => {
    onAdd(p);
    setQ("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = async (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      // empty box + Enter = "done adding items" → let the form jump to payment
      if (!q.trim()) {
        setOpen(false);
        return;
      }
      e.preventDefault();
      // barcode scanners type fast and press Enter: do an exact lookup if results are stale
      if (pending || !results.length) {
        const r = await searchProducts(q, cat);
        if (r[0]) add(r[0]);
        return;
      }
      if (results[active]) add(results[active]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              setCat(c.value);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              cat === c.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          {pending ? (
            <Loader2 className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <ScanBarcode className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            placeholder={`Scan barcode or search ${cat === "all" ? "products" : CATEGORY_LABEL[cat].toLowerCase()}…`}
            className="h-9 w-full rounded-full border border-transparent bg-input/50 pr-3 pl-9 text-sm outline-none transition-colors focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30"
          />
          {open && (
            <div className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl bg-popover p-1 shadow-xl ring-1 ring-foreground/10">
              {results.length === 0 && !pending && <p className="px-3 py-2 text-sm text-muted-foreground">No product found. Use “Custom item”.</p>}
              {results.map((p, i) => {
                const out = p.trackStock && p.stock <= 0;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(p)}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left", active === i && "bg-muted", out && "opacity-60")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {CATEGORY_LABEL[p.category]} · {[p.attributes?.colour, p.attributes?.size, p.attributes?.index && `Index ${p.attributes.index}`].filter(Boolean).join(" · ") || p.brand}
                      </p>
                    </div>
                    <span className={cn("text-xs", out ? "text-red-600" : "text-muted-foreground")}>
                      {p.trackStock ? (out ? "Out of stock" : `${p.stock} in stock`) : "Order"}
                    </span>
                    <span className="w-16 text-right text-sm font-medium tabular">{formatINR(p.sellingPrice, { decimals: false })}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onCustom(cat === "all" ? "misc" : cat)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PenLine className="size-3.5" /> <span className="hidden sm:inline">Custom item</span><span className="sm:hidden">Custom</span>
        </button>
      </div>
    </div>
  );
}
