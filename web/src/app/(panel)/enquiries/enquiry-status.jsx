"use client";

import { useTransition } from "react";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { setEnquiryStatus } from "@/actions/enquiry";
import { Button } from "@/components/ui/button";

/** One-click status change: New → Contacted → Closed (and reopen). */
export function EnquiryStatus({ id, status }) {
  const [pending, startTransition] = useTransition();
  const set = (s, msg) =>
    startTransition(async () => {
      const r = await setEnquiryStatus(id, s);
      if (r.error) toast.error(r.error);
      else toast.success(msg);
    });

  if (pending) return <Button size="sm" variant="ghost" disabled><Loader2 className="animate-spin" /></Button>;
  if (status === "new")
    return <Button size="sm" onClick={() => set("contacted", "Marked as contacted")}><Check /> Contacted</Button>;
  if (status === "contacted")
    return <Button size="sm" variant="secondary" onClick={() => set("closed", "Enquiry closed")}><X /> Close</Button>;
  return <Button size="sm" variant="ghost" onClick={() => set("new", "Reopened")}><RotateCcw /> Reopen</Button>;
}
