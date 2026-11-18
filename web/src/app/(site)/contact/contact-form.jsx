"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitEnquiry } from "@/actions/enquiry";
import { ENQUIRY_REASONS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { handleEnterNav } from "@/lib/enter-nav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const input =
  "h-11 w-full rounded-xl border border-transparent bg-muted/60 px-4 text-sm outline-none transition focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30";

export function ContactForm({ stores }) {
  const [state, action, pending] = useActionState(submitEnquiry, null);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const storeItems = [{ value: "any", label: "Any store" }, ...stores.map((s) => ({ value: s.id, label: s.name }))];

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-emerald-500/5 p-10 text-center ring-1 ring-emerald-500/20">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h3 className="text-xl font-semibold">Thank you{state.name ? `, ${state.name}` : ""}!</h3>
        <p className="max-w-sm text-sm text-muted-foreground">We’ve received your request. Our team will call or WhatsApp you shortly to confirm your slot.</p>
      </div>
    );
  }

  return (
    <form action={action} onKeyDown={handleEnterNav} className="grid gap-4 sm:grid-cols-2">
      {/* honeypot for bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <Field label="Your name" error={e.name}>
        <input name="name" defaultValue={v.name} required className={input} placeholder="Full name" />
      </Field>
      <Field label="Mobile number" error={e.mobile}>
        <input name="mobile" defaultValue={v.mobile} required inputMode="numeric" maxLength={14} className={cn(input, "font-mono")} placeholder="10-digit mobile" />
      </Field>

      <Field label="I’m interested in" className="sm:col-span-2">
        <div className="flex flex-wrap gap-2">
          {ENQUIRY_REASONS.map((r, i) => (
            <label key={r.value} className="cursor-pointer">
              <input type="radio" name="reason" value={r.value} defaultChecked={v.reason ? v.reason === r.value : i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-full border px-3.5 py-1.5 text-sm transition peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:bg-muted peer-focus-visible:ring-3 peer-focus-visible:ring-ring/30">
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Preferred store">
        <Select name="storeId" items={storeItems} defaultValue={v.storeId || "any"}>
          <SelectTrigger className="h-11 w-full rounded-xl bg-muted/60 px-4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {storeItems.map((it) => (
              <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Preferred date (optional)">
        <input type="date" name="preferredDate" defaultValue={v.preferredDate} className={input} />
      </Field>

      <Field label="Message (optional)" className="sm:col-span-2">
        <textarea data-enter-skip name="message" defaultValue={v.message} rows={3} maxLength={500} className={cn(input, "h-auto py-3")} placeholder="e.g. Need progressive lenses for my father" />
      </Field>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button data-enter-final type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send request
        </button>
        <p className="text-xs text-muted-foreground">We reply within working hours. No spam, ever.</p>
      </div>
    </form>
  );
}

function Field({ label, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
