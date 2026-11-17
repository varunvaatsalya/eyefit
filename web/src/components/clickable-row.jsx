"use client";

import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ClickableRow({ href, className, children }) {
  const router = useRouter();
  return (
    <TableRow
      onClick={(e) => {
        if (e.target.closest("a,button")) return;
        router.push(href);
      }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </TableRow>
  );
}
