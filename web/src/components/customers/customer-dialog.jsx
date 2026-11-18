"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuggestInput, INPUT_CLASS } from "@/components/ui/suggest-input";
import { handleEnterNav } from "@/lib/enter-nav";

const DOCTORS = ["EYE FIT (Self)", "Dr. S. K. Mishra", "Dr. Neha Agarwal", "Dr. R. P. Gupta"];
const CATEGORIES = ["Regular", "VIP", "Corporate"];
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const EMPTY = { name: "", mobile: "", mobile2: "", email: "", gender: "", age: "", dob: "", category: "", referDoctor: "", address: "", remark: "" };

export function GenderPicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-muted p-1">
      {[["male", "Male"], ["female", "Female"], ["other", "Other"]].map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(value === v ? "" : v)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Field({ label, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CustomerDialog({ open, onOpenChange, customer, onSaved, redirectOnCreate = true }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => toForm(customer));
  const [errors, setErrors] = useState({});
  const [lastKey, setLastKey] = useState(customer?._id ?? "new");

  // reset form when switching between customers
  const key = customer?._id ?? "new";
  if (key !== lastKey) {
    setLastKey(key);
    setForm(toForm(customer));
    setErrors({});
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = (e) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCustomer(customer?._id ?? null, form);
      if (res.errors) {
        setErrors(res.errors);
        return;
      }
      toast.success(customer ? "Customer updated" : `Customer #${res.customer.customerNo} added`);
      onOpenChange(false);
      setErrors({});
      if (!customer) setForm(EMPTY);
      onSaved?.(res.customer);
      if (!customer && redirectOnCreate) router.push(`/customers/${res.customer._id}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>Name and mobile number are required. Everything else is optional.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} onKeyDown={handleEnterNav} className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number *" error={errors.mobile}>
            <Input value={form.mobile} onChange={set("mobile")} inputMode="numeric" maxLength={14} autoFocus placeholder="10-digit mobile" />
          </Field>
          <Field label="Customer name *" error={errors.name}>
            <Input value={form.name} onChange={set("name")} placeholder="e.g. Mr Anand Pandey" className="uppercase" />
          </Field>
          <Field label="Gender">
            <GenderPicker value={form.gender} onChange={set("gender")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" error={errors.age}>
              <Input value={form.age} onChange={set("age")} inputMode="numeric" maxLength={3} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dob} onChange={set("dob")} />
            </Field>
          </div>
          <Field label="Alternate mobile">
            <Input value={form.mobile2} onChange={set("mobile2")} inputMode="numeric" />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Referred by (doctor)">
            <SuggestInput value={form.referDoctor} onChange={set("referDoctor")} options={DOCTORS} openOnFocus placeholder="EYE FIT (Self)" className={INPUT_CLASS} />
          </Field>
          <Field label="Category">
            <SuggestInput value={form.category} onChange={set("category")} options={CATEGORIES} openOnFocus placeholder="Regular / VIP" className={INPUT_CLASS} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={set("address")} />
          </Field>
          <Field label="Remark" className="sm:col-span-2">
            <Textarea data-enter-skip value={form.remark} onChange={set("remark")} rows={2} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button data-enter-final type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {customer ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toForm(c) {
  if (!c) return EMPTY;
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? ""])),
    age: c.age ?? "",
    dob: c.dob ? String(c.dob).slice(0, 10) : "",
  };
}
