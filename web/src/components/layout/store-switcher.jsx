"use client";

import { useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, Store, Building2 } from "lucide-react";
import { toast } from "sonner";
import { switchStore } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreSwitcher({ stores, activeStoreId, isOwner }) {
  const [pending, startTransition] = useTransition();
  const active = stores.find((s) => s.id === activeStoreId);

  // Staff with a single store: show a static badge, nothing to switch.
  if (!isOwner && stores.length <= 1) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-full bg-muted px-3 text-sm font-medium">
        <Store className="size-4 text-primary" />
        <span className="hidden md:inline">{active?.name ?? "No store"}</span>
        <span className="md:hidden">{active?.code ?? "—"}</span>
      </div>
    );
  }

  const choose = (id) =>
    startTransition(async () => {
      const res = await switchStore(id);
      if (res?.error) toast.error(res.error);
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="justify-between gap-2 md:min-w-44" />}>
        <span className="flex items-center gap-2">
          {pending ? (
            <Loader2 className="animate-spin" />
          ) : active ? (
            <Store className="text-primary" />
          ) : (
            <Building2 className="text-primary" />
          )}
          <span className="hidden md:inline">{active ? active.name : "All Stores"}</span>
          <span className="md:hidden">{active ? active.code : "All"}</span>
        </span>
        <ChevronsUpDown className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch store</DropdownMenuLabel>
          {isOwner && (
            <DropdownMenuItem onClick={() => choose("all")}>
              <Building2 />
              <span className="flex-1">All Stores</span>
              {!active && <Check />}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {stores.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => choose(s.id)}>
              <Store />
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.code}</span>
              {s.id === activeStoreId && <Check />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
