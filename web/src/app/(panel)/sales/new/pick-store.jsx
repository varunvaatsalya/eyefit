"use client";

import { useTransition } from "react";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { switchStore } from "@/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PickStore({ stores }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Which store is this sale for?</CardTitle>
        <CardDescription>You are viewing All Stores. Bills and stock belong to one store, so pick it first.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {stores.map((s) => (
          <button
            key={s.id}
            disabled={pending}
            onClick={() => startTransition(async () => {
              const r = await switchStore(s.id);
              if (r?.error) toast.error(r.error);
            })}
            className="flex items-center gap-3 rounded-3xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {pending ? <Loader2 className="size-5 animate-spin" /> : <Store className="size-5" />}
            </span>
            <span className="flex-1 font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.code}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
