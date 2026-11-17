import { Suspense } from "react";
import Link from "next/link";
import { Boxes, AlertTriangle, PackageX, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { CardsSkeleton, TableSkeleton } from "@/components/page-skeleton";
import { StockBadge } from "@/components/status-badge";
import { AddProductButton, RowActions } from "@/components/inventory/inventory-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContext } from "@/lib/auth";
import { escapeRegex, cn } from "@/lib/utils";
import { formatINR, formatNumber, toPlain } from "@/lib/format";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/constants";
import { Product, Inventory } from "@/models";

export const metadata = { title: "Inventory" };

export default function InventoryPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <Suspense fallback={<PageHeader title="Inventory" description="Loading…" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<><CardsSkeleton /><TableSkeleton /></>}>
        <InventoryBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Header() {
  const ctx = await getContext();
  return (
    <PageHeader
      title="Inventory"
      description={ctx.activeStore ? `Stock at ${ctx.activeStore.name}` : "Stock across all stores. Pick a store from the top bar to add stock."}
    >
      <AddProductButton activeStoreName={ctx.activeStore?.name} canManage={ctx.canManage} />
    </PageHeader>
  );
}

async function InventoryBody({ searchParams }) {
  const ctx = await getContext();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const cat = sp.cat ?? "all";
  const stockFilter = sp.stock ?? "all";

  const filter = { isActive: true };
  if (cat !== "all") filter.category = cat;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { brand: rx }, { modelNo: rx }, { barcode: q }];
  }

  const scopeStores = ctx.activeStoreId ? [ctx.activeStoreId] : ctx.stores.map((s) => s.id);
  const [products, inventory] = await Promise.all([
    Product.find(filter).sort({ category: 1, brand: 1, name: 1 }).lean(),
    Inventory.find({ storeId: { $in: scopeStores } }).lean(),
  ]);

  // productId -> { storeId: {qty, minQty} }
  const inv = {};
  for (const row of inventory) {
    (inv[String(row.productId)] ??= {})[String(row.storeId)] = row;
  }

  let rows = products.map((p) => {
    const perStore = inv[String(p._id)] ?? {};
    const qty = scopeStores.reduce((s, id) => s + (perStore[id]?.qty ?? 0), 0);
    const minQty = scopeStores.reduce((s, id) => s + (perStore[id]?.minQty ?? 2), 0);
    return { ...p, perStore, qty, minQty };
  });

  const tracked = rows.filter((r) => r.trackStock);
  const stats = {
    skus: rows.length,
    units: tracked.reduce((s, r) => s + r.qty, 0),
    value: tracked.reduce((s, r) => s + r.qty * (r.costPrice ?? r.sellingPrice * 0.6), 0),
    low: tracked.filter((r) => r.qty > 0 && r.qty <= r.minQty).length,
    out: tracked.filter((r) => r.qty <= 0).length,
  };

  if (stockFilter === "low") rows = rows.filter((r) => r.trackStock && r.qty > 0 && r.qty <= r.minQty);
  if (stockFilter === "out") rows = rows.filter((r) => r.trackStock && r.qty <= 0);

  const showPerStore = !ctx.activeStoreId;
  const link = (patch) => {
    const params = new URLSearchParams(Object.entries({ q, cat, stock: stockFilter, ...patch }).filter(([, v]) => v && v !== "all"));
    return `/inventory?${params.toString()}`;
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Products" value={formatNumber(stats.skus)} hint={`${formatNumber(stats.units)} units in stock`} />
        <StatCard icon={IndianRupee} label="Stock value (cost)" value={formatINR(stats.value, { decimals: false })} />
        <StatCard icon={AlertTriangle} label="Low stock" value={stats.low} href={link({ stock: "low" })} tone="amber" />
        <StatCard icon={PackageX} label="Out of stock" value={stats.out} href={link({ stock: "out" })} tone="red" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={<div className="h-9 w-80" />}>
          <SearchInput placeholder="Search name, brand, model, barcode…" />
        </Suspense>
        <div className="flex flex-wrap gap-1.5">
          {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
            <Chip key={c.value} href={link({ cat: c.value })} active={cat === c.value}>{c.label}</Chip>
          ))}
        </div>
        {stockFilter !== "all" && (
          <Chip href={link({ stock: "all" })} active>
            {stockFilter === "low" ? "Low stock" : "Out of stock"} ✕
          </Chip>
        )}
      </div>

      <Card className="gap-0 py-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Product</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="hidden xl:table-cell">Details</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden text-right md:table-cell">GST</TableHead>
              {showPerStore
                ? ctx.stores.map((s) => <TableHead key={s.id} className="text-center">{s.code}</TableHead>)
                : <TableHead>Stock</TableHead>}
              <TableHead className="pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">No products match</TableCell>
              </TableRow>
            )}
            {rows.map((p) => {
              const details = [p.attributes?.material, p.attributes?.colour, p.attributes?.shape, p.attributes?.size, p.attributes?.index && `Index ${p.attributes.index}`, p.attributes?.coating]
                .filter(Boolean)
                .join(" · ");
              return (
                <TableRow key={String(p._id)}>
                  <TableCell className="min-w-44 pl-4 whitespace-normal">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p.brand, p.modelNo].filter(Boolean).join(" · ")} <span className="font-mono">{p.barcode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{CATEGORY_LABEL[p.category]}</TableCell>
                  <TableCell className="hidden max-w-56 truncate text-xs text-muted-foreground xl:table-cell">{details || "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular">{formatINR(p.sellingPrice, { decimals: false })}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular md:table-cell">{p.gstPercent}%</TableCell>
                  {showPerStore ? (
                    ctx.stores.map((s) => {
                      const r = p.perStore[s.id];
                      const q2 = r?.qty ?? 0;
                      return (
                        <TableCell key={s.id} className={cn("text-center tabular", !p.trackStock && "text-muted-foreground", p.trackStock && q2 <= 0 && "text-red-600", p.trackStock && q2 > 0 && q2 <= (r?.minQty ?? 2) && "text-amber-600")}>
                          {p.trackStock ? q2 : "—"}
                        </TableCell>
                      );
                    })
                  ) : (
                    <TableCell><StockBadge qty={p.qty} minQty={p.minQty} trackStock={p.trackStock} /></TableCell>
                  )}
                  <TableCell className="pr-4">
                    <RowActions
                      product={toPlain({ ...p, perStore: undefined })}
                      canStock={!!ctx.activeStoreId}
                      canManage={ctx.canManage}
                      activeStoreName={ctx.activeStore?.name}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Chip({ href, active, children }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, hint, href, tone }) {
  const body = (
    <Card size="sm" className={cn(href && "transition-shadow hover:shadow-lg")}>
      <CardContent className="flex items-center gap-4">
        <div className={cn("hidden size-10 shrink-0 items-center justify-center rounded-2xl sm:flex", tone === "amber" ? "bg-amber-500/10 text-amber-600" : tone === "red" ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary")}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular md:text-xl">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
