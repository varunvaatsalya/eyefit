"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { Search, User, ReceiptText, Package, Plus, Loader2, X } from "lucide-react";
import { globalSearch } from "@/actions/search";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Kbd } from "@/components/kbd";
import { formatINR } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/constants";

const EMPTY = { customers: [], invoices: [], products: [] };
const MIN_WIDTH = 520;
const GAP = 8;

/**
 * Global search that expands in place from the header search box
 * (instead of a centred dialog), with the page blurred behind it.
 */
export function GlobalSearch() {
  const router = useRouter();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(EMPTY);
  const [pending, startTransition] = useTransition();

  // Anchor the panel exactly where the search box sits.
  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (vw < 640) {
      setRect({ top: GAP, left: GAP, width: vw - GAP * 2 });
      return;
    }
    const width = Math.min(Math.max(r.width, MIN_WIDTH), vw - GAP * 2);
    // grow from the box's left edge, but keep inside the viewport
    const left = Math.min(Math.max(r.left, GAP), vw - width - GAP);
    setRect({ top: r.top, left, width });
  }, []);

  const openSearch = useCallback(() => {
    measure();
    setOpen(true);
  }, [measure]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults(EMPTY);
  }, []);

  // Global keyboard shortcuts: Ctrl/Cmd+K = search, F2 = new sale, Esc = close
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else openSearch();
      }
      if (e.key === "Escape" && open) close();
      if (e.key === "F2") {
        e.preventDefault();
        router.push("/sales/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, open, openSearch, close]);

  // Keep anchored on resize; lock page scroll while open.
  useLayoutEffect(() => {
    if (!open) return;
    window.addEventListener("resize", measure);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", measure);
      document.body.style.overflow = prev;
    };
  }, [open, measure]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => {
      startTransition(async () => setResults(await globalSearch(q)));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (href) => {
    close();
    router.push(href);
  };

  const shown = q.trim().length < 2 ? EMPTY : results;
  const nothing = !shown.customers.length && !shown.invoices.length && !shown.products.length;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openSearch}
        aria-label="Search"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded-full bg-muted/70 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted lg:w-full lg:max-w-xs lg:px-3"
      >
        <Search className="size-4" />
        <span className="hidden flex-1 text-left lg:inline">Search customer, mobile, bill…</span>
        <Kbd className="hidden bg-background lg:inline-flex">Ctrl K</Kbd>
      </button>

      {open &&
        rect &&
        createPortal(
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
            {/* blurred page behind */}
            <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm animate-in fade-in-0 duration-150" onMouseDown={close} />

            {/* panel grows from the search box */}
            <div
              className="absolute origin-top overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150"
              style={{ top: rect.top - 4, left: rect.left, width: rect.width }}
            >
              <Command shouldFilter={false} className="rounded-none bg-transparent p-0">
                <div className="flex items-center gap-2 border-b px-3 py-1">
                  {pending ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : <Search className="size-4 shrink-0 text-muted-foreground" />}
                  <CommandPrimitive.Input
                    autoFocus
                    value={q}
                    onValueChange={setQ}
                    placeholder="Name, mobile number, bill no or product…"
                    className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button type="button" onClick={close} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted" aria-label="Close search">
                    <span className="hidden sm:inline">Esc</span>
                    <X className="size-3.5 sm:hidden" />
                  </button>
                </div>
                <CommandList className="max-h-[min(60svh,420px)] p-1">
                  {!pending && q.trim().length >= 2 && nothing && <CommandEmpty>No results for “{q}”</CommandEmpty>}

                  {q.trim().length < 2 && (
                    <CommandGroup heading="Quick actions">
                      <CommandItem onSelect={() => go("/sales/new")}>
                        <Plus /> New Sale <span className="ml-auto text-xs text-muted-foreground">F2</span>
                      </CommandItem>
                      <CommandItem onSelect={() => go("/customers?new=1")}>
                        <User /> Add Customer
                      </CommandItem>
                      <CommandItem onSelect={() => go("/sales?delivery=ready")}>
                        <ReceiptText /> Orders ready for pickup
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {shown.customers.length > 0 && (
                    <CommandGroup heading="Customers">
                      {shown.customers.map((c) => (
                        <CommandItem key={c._id} value={`c-${c._id}`} onSelect={() => go(`/customers/${c._id}`)}>
                          <User />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{c.mobile}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {shown.invoices.length > 0 && (
                    <CommandGroup heading="Bills">
                      {shown.invoices.map((i) => (
                        <CommandItem key={i._id} value={`i-${i._id}`} onSelect={() => go(`/sales/${i._id}`)}>
                          <ReceiptText />
                          <span className="font-mono">{i.invoiceNo}</span>
                          <span className="flex-1 truncate text-muted-foreground">{i.customerSnapshot?.name}</span>
                          <span className="text-xs">{formatINR(i.grandTotal, { decimals: false })}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {shown.products.length > 0 && (
                    <CommandGroup heading="Products">
                      {shown.products.map((p) => (
                        <CommandItem key={p._id} value={`p-${p._id}`} onSelect={() => go(`/inventory?q=${encodeURIComponent(p.name)}`)}>
                          <Package />
                          <span className="flex-1 truncate">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[p.category]}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
