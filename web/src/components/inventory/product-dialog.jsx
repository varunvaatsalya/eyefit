"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DEFAULT_GST = { frame: 5, lens: 5, contact_lens: 5, solution: 18, sunglass: 18, misc: 18 };
const HSN = { frame: "9003", lens: "9001", contact_lens: "9001", solution: "3307", sunglass: "9004", misc: "9003" };

const blank = (category = "frame") => ({
  category, name: "", brand: "", modelNo: "", barcode: "", sellingPrice: "", costPrice: "",
  gstPercent: DEFAULT_GST[category], hsn: HSN[category], trackStock: category !== "lens",
  attributes: { material: "", colour: "", shape: "", size: "", index: "", coating: "" },
  openingQty: "", minQty: "2",
});

function F({ label, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProductDialog({ open, onOpenChange, product, activeStoreName }) {
  const [form, setForm] = useState(() => toForm(product));
  const [errors, setErrors] = useState({});
  const [pending, startTransition] = useTransition();
  const [lastKey, setLastKey] = useState(product?._id ?? "new");
  const key = product?._id ?? "new";
  if (key !== lastKey) {
    setLastKey(key);
    setForm(toForm(product));
    setErrors({});
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setAttr = (k) => (e) => setForm((f) => ({ ...f, attributes: { ...f.attributes, [k]: e.target.value } }));
  const setCategory = (c) =>
    setForm((f) => ({ ...f, category: c, gstPercent: DEFAULT_GST[c], hsn: HSN[c], trackStock: product ? f.trackStock : c !== "lens" }));

  const isFrameLike = ["frame", "sunglass"].includes(form.category);
  const isLens = form.category === "lens";

  const submit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveProduct(product?._id ?? null, form);
      if (res.error) return toast.error(res.error);
      if (res.errors) return setErrors(res.errors);
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
      if (!product) setForm(blank(form.category));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>Products are shared by all stores. Stock is counted separately for each store.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-6">
          <div className="flex flex-wrap gap-1.5 sm:col-span-6">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  form.category === c.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <F label="Product name *" error={errors.name} className="sm:col-span-4">
            <Input value={form.name} onChange={set("name")} autoFocus placeholder="e.g. Ray-Ban RB5154 Frame" />
          </F>
          <F label="Barcode" className="sm:col-span-2">
            <Input value={form.barcode} onChange={set("barcode")} placeholder="Auto if empty" />
          </F>
          <F label="Brand" className="sm:col-span-3">
            <Input value={form.brand} onChange={set("brand")} />
          </F>
          <F label="Model no." className="sm:col-span-3">
            <Input value={form.modelNo} onChange={set("modelNo")} />
          </F>

          {isFrameLike && (
            <>
              <F label="Material" className="sm:col-span-2"><Input value={form.attributes.material} onChange={setAttr("material")} list="mat" /></F>
              <F label="Colour" className="sm:col-span-2"><Input value={form.attributes.colour} onChange={setAttr("colour")} /></F>
              <F label="Shape" className="sm:col-span-1"><Input value={form.attributes.shape} onChange={setAttr("shape")} /></F>
              <F label="Size" className="sm:col-span-1"><Input value={form.attributes.size} onChange={setAttr("size")} placeholder="52-18-140" /></F>
              <datalist id="mat">{["Acetate", "Metal", "TR90", "Titanium", "Ultem"].map((m) => <option key={m} value={m} />)}</datalist>
            </>
          )}
          {isLens && (
            <>
              <F label="Index" className="sm:col-span-3"><Input value={form.attributes.index} onChange={setAttr("index")} placeholder="1.56 / 1.60 / 1.67" /></F>
              <F label="Coating" className="sm:col-span-3"><Input value={form.attributes.coating} onChange={setAttr("coating")} placeholder="Blue cut, ARC…" /></F>
            </>
          )}

          <F label="Selling price (₹) *" error={errors.sellingPrice} className="sm:col-span-2">
            <Input value={form.sellingPrice} onChange={set("sellingPrice")} inputMode="decimal" />
          </F>
          <F label="Cost price (₹)" className="sm:col-span-2">
            <Input value={form.costPrice} onChange={set("costPrice")} inputMode="decimal" />
          </F>
          <F label="GST %" className="sm:col-span-1">
            <Input value={form.gstPercent} onChange={set("gstPercent")} inputMode="decimal" />
          </F>
          <F label="HSN" className="sm:col-span-1">
            <Input value={form.hsn} onChange={set("hsn")} />
          </F>

          <label className="flex items-center gap-2 text-sm sm:col-span-6">
            <Checkbox checked={form.trackStock} onCheckedChange={(v) => setForm((f) => ({ ...f, trackStock: !!v }))} />
            Track stock for this product <span className="text-muted-foreground">(turn off for made-to-order lenses and services)</span>
          </label>

          {!product && form.trackStock && (
            <>
              <F label={`Opening stock${activeStoreName ? ` at ${activeStoreName}` : ""}`} className="sm:col-span-3">
                <Input value={form.openingQty} onChange={set("openingQty")} inputMode="numeric" disabled={!activeStoreName} placeholder={activeStoreName ? "0" : "Select a store first"} />
              </F>
              <F label="Low stock alert at" className="sm:col-span-3">
                <Input value={form.minQty} onChange={set("minQty")} inputMode="numeric" />
              </F>
            </>
          )}

          <DialogFooter className="sm:col-span-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toForm(p) {
  if (!p) return blank();
  return {
    ...blank(p.category),
    ...p,
    costPrice: p.costPrice ?? "",
    attributes: { ...blank().attributes, ...(p.attributes || {}) },
    openingQty: "",
    minQty: "2",
  };
}
