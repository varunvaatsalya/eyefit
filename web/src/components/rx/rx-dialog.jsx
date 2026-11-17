"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { savePrescription } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RxForm, EMPTY_RX, rxFromSaved, rxIsEmpty } from "./rx-form";

export function RxDialog({ open, onOpenChange, customerId, lastRx }) {
  const [rx, setRx] = useState(EMPTY_RX);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (rxIsEmpty(rx)) {
      toast.error("Enter at least one power value");
      return;
    }
    startTransition(async () => {
      const res = await savePrescription(customerId, rx);
      if (res.error) return toast.error(res.error);
      toast.success("Eye test saved");
      setRx(EMPTY_RX);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New eye test</DialogTitle>
          <DialogDescription>Type values directly, e.g. -1.25. They are formatted when you leave the box. Enter ADD and the near row fills itself.</DialogDescription>
        </DialogHeader>
        <RxForm value={rx} onChange={setRx} />
        <DialogFooter>
          {lastRx && (
            <Button type="button" variant="outline" className="mr-auto" onClick={() => setRx(rxFromSaved(lastRx))}>
              <Copy /> Copy last prescription
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save eye test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
