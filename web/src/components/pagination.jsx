import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageSize, total, searchParams = {}, basePath }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="px-2 text-xs text-muted-foreground">{total} records</p>;
  const href = (p) => {
    const sp = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => v != null && v !== ""));
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 px-2">
      <p className="text-xs text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Link aria-disabled={page <= 1} href={href(Math.max(1, page - 1))} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), page <= 1 && "pointer-events-none opacity-50")}>
          <ChevronLeft />
        </Link>
        <span className="px-2 text-xs tabular">{page} / {pages}</span>
        <Link aria-disabled={page >= pages} href={href(Math.min(pages, page + 1))} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), page >= pages && "pointer-events-none opacity-50")}>
          <ChevronRight />
        </Link>
      </div>
    </div>
  );
}
