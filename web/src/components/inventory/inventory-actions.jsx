"use client";

import { useState, useTransition } from "react";
import { Loader2, PackagePlus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { adjustStock } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductDialog } from "./product-dialog";

export function AddProductButton({ activeStoreName, canManage }) {
  const [open, setOpen] = useState(false);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add product
      </Button>
      <ProductDialog open={open} onOpenChange={setOpen} activeStoreName={activeStoreName} />
    </>
  );
}

export function RowActions({ product, canStock, canManage, activeStoreName }) {
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex items-center justify-end gap-1">
      {canStock && product.trackStock && <StockPopover productId={product._id} name={product.name} />}
      {canManage && (
        <>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => setEdit(true)} />}>
              <Pencil />
            </TooltipTrigger>
            <TooltipContent>Edit product</TooltipContent>
          </Tooltip>
          <ProductDialog open={edit} onOpenChange={setEdit} product={product} activeStoreName={activeStoreName} />
        </>
      )}
    </div>
  );
}

function StockPopover({ productId, name }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await adjustStock(productId, qty);
      if (res.error) return toast.error(res.error);
      toast.success(`Stock updated: now ${res.qty}`);
      setQty("");
      setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <PackagePlus /> Stock
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <p className="text-sm font-medium">Add stock</p>
            <p className="truncate text-xs text-muted-foreground">{name}</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 5, 10].map((n) => (
              <Button key={n} type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setQty(String(n))}>
                +{n}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d-]/g, ""))}
              placeholder="Qty (use - to reduce)"
              className="h-9 w-full rounded-full bg-input/50 px-3 text-sm outline-none focus:ring-3 focus:ring-ring/30"
            />
            <Button type="submit" disabled={pending || !qty}>
              {pending ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
