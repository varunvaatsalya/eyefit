"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glasses, Menu, X, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#brands", label: "Brands" },
  { href: "/#stores", label: "Stores" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ name }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Glasses className="size-5" />
          </span>
          <span className="text-lg tracking-tight">{name}</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.href && "text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/contact#book" className="hidden h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 sm:inline-flex">
            <CalendarCheck className="size-4" /> Book eye test
          </Link>
          <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-full p-2 hover:bg-muted md:hidden" aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <Link href="/contact#book" onClick={() => setOpen(false)} className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-medium text-primary-foreground">
              <CalendarCheck className="size-4" /> Book a free eye test
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
