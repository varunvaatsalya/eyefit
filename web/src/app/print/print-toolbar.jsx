"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintToolbar() {
  const searchParams = useSearchParams();
  const auto = searchParams.get("auto") === "1";

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <div className="no-print sticky top-0 z-10 flex justify-center gap-2 border-b bg-background/90 p-3 backdrop-blur">
      <Button onClick={() => window.print()}>
        <Printer /> Print
      </Button>
      <Button variant="outline" onClick={() => window.close()}>
        <X /> Close
      </Button>
    </div>
  );
}
