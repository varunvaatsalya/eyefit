import { PackageCheck, BellRing, Eye, Cake, Star, Zap } from "lucide-react";

const AUTOMATIONS = [
  { icon: PackageCheck, title: "Order ready alert", hint: "When a bill is marked Ready" },
  { icon: BellRing, title: "Payment due reminder", hint: "On delivery date, if balance is pending" },
  { icon: Eye, title: "Yearly eye test reminder", hint: "11 months after last eye test" },
  { icon: Cake, title: "Birthday wish + offer", hint: "On the customer's birthday" },
  { icon: Star, title: "Thank you + Google review", hint: "1 day after delivery" },
];

/** Planned automatic WhatsApp messages (shown for the demo, not active yet). */
export function Automations() {
  return (
    <section className="space-y-2 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/5 md:p-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Zap className="size-3.5" /></span>
          Automatic messages
        </h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800">Coming soon</span>
      </header>
      <p className="text-xs text-muted-foreground">Sent by the system on WhatsApp, no staff action needed.</p>
      <ul className="space-y-1.5">
        {AUTOMATIONS.map((a) => (
          <li key={a.title} className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-foreground/5">
              <a.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium">{a.title}</span>
              <span className="block text-[11px] text-muted-foreground">{a.hint}</span>
            </span>
            <span aria-hidden className="relative h-4 w-7 shrink-0 rounded-full bg-muted-foreground/25">
              <span className="absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
