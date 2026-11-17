"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, Users, Boxes, Plus, Megaphone, Settings, BarChart3, ChevronDown, LayoutGrid, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/kbd";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Stock", icon: Boxes },
];

/** Secondary sections live under "More" so the bar stays short as the app grows. */
function moreItems({ isOwner, canManage }) {
  return [
    { href: "/enquiries", label: "Enquiries", icon: Inbox, hint: "Website bookings" },
    canManage && { href: "/marketing", label: "Marketing", icon: Megaphone, hint: "WhatsApp campaigns" },
    { href: "#", label: "Reports", icon: BarChart3, hint: "Coming soon", disabled: true },
    isOwner && { href: "/settings", label: "Settings", icon: Settings, hint: "Stores & staff" },
  ].filter(Boolean);
}

export function useIsActive() {
  const pathname = usePathname();
  return (href) => {
    if (href === "/sales") return pathname === "/sales" || /^\/sales\/(?!new)/.test(pathname);
    if (href === "/sales/new") return pathname === "/sales/new";
    return pathname.startsWith(href);
  };
}

function MoreMenuItems({ items, isActive }) {
  return items.map((m) => (
    <DropdownMenuItem
      key={m.label}
      disabled={m.disabled}
      render={m.disabled ? undefined : <Link href={m.href} />}
      className={cn(isActive(m.href) && "bg-primary/10 text-primary")}
    >
      <m.icon />
      <span className="flex-1">
        <span className="block">{m.label}</span>
        <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
      </span>
    </DropdownMenuItem>
  ));
}

/** Desktop: horizontal tabs in the header. "More" opens on hover. */
export function TopNav({ isOwner, canManage }) {
  const isActive = useIsActive();
  const more = moreItems({ isOwner, canManage });
  const moreActive = more.some((m) => !m.disabled && isActive(m.href));

  const tab = (active) =>
    cn(
      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors outline-none",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className={tab(isActive(item.href))}>
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger openOnHover delay={60} closeDelay={150} className={cn(tab(moreActive), "data-popup-open:bg-muted data-popup-open:text-foreground")}>
          <LayoutGrid className="size-4" /> More <ChevronDown className="size-3.5 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>More</DropdownMenuLabel>
            <MoreMenuItems items={more} isActive={isActive} />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link
        href="/sales/new"
        className={cn(
          "ml-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          isActive("/sales/new") && "ring-3 ring-primary/25"
        )}
      >
        <Plus className="size-4" /> New Sale
        <Kbd className="h-4 bg-white/20 text-primary-foreground">F2</Kbd>
      </Link>
    </nav>
  );
}

/** Mobile: app-style bottom tab bar with a centre "New Sale" button and a "More" menu. */
export function BottomNav({ isOwner, canManage }) {
  const isActive = useIsActive();
  const [home, sales, customers, stock] = NAV;
  const more = [stock, ...moreItems({ isOwner, canManage })];
  const moreActive = more.some((m) => !m.disabled && isActive(m.href));

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex items-end border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Tab item={home} active={isActive(home.href)} />
      <Tab item={sales} active={isActive(sales.href)} />
      <Link href="/sales/new" className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 text-[11px] font-medium text-primary">
        <span className="-mt-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
          <Plus className="size-6" />
        </span>
        New Sale
      </Link>
      <Tab item={customers} active={isActive(customers.href)} />
      <DropdownMenu>
        <DropdownMenuTrigger className={cn("flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium outline-none", moreActive ? "text-primary" : "text-muted-foreground")}>
          <LayoutGrid className="size-5" />
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuGroup>
            <MoreMenuItems items={more.map((m) => ({ hint: m === stock ? "Products & stock" : m.hint, ...m }))} isActive={isActive} />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

function Tab({ item, active }) {
  return (
    <Link href={item.href} className={cn("flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}
