"use client";

import { useState } from "react";
import { ChevronDown, Send, BellRing, PackageCheck, FileText, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WhatsAppIcon } from "./whatsapp-icon";
import { billMessage, reminderMessage, readyMessage, waLink } from "@/lib/whatsapp";

const KINDS = {
  bill: { title: "Send bill on WhatsApp", icon: FileText, build: billMessage },
  reminder: { title: "Payment reminder", icon: BellRing, build: reminderMessage },
  ready: { title: "Order ready message", icon: PackageCheck, build: readyMessage },
};

/** WhatsApp actions for a bill: send bill, payment reminder, order-ready message. */
export function WhatsAppMenu({ invoice, storeName, size = "default" }) {
  const [kind, setKind] = useState(null);
  const due = invoice.balance > 0 && invoice.status !== "cancelled";
  const ready = invoice.deliveryStatus === "ready";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size={size} className="text-[#128C7E]" />}>
          <WhatsAppIcon className="size-4" /> WhatsApp <ChevronDown className="opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Send to {invoice.customerSnapshot?.mobile}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setKind("bill")}>
              <FileText /> Send bill
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!due} onClick={() => setKind("reminder")}>
              <BellRing /> Payment reminder {!due && <span className="ml-auto text-[10px] text-muted-foreground">no due</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setKind("ready")}>
              <PackageCheck /> Order ready {ready && <span className="ml-auto text-[10px] text-emerald-600">now</span>}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <WhatsAppPreview
        open={!!kind}
        onOpenChange={(o) => !o && setKind(null)}
        title={kind ? KINDS[kind].title : ""}
        mobile={invoice.customerSnapshot?.mobile}
        initialText={kind ? KINDS[kind].build(invoice, storeName) : ""}
        key={kind ?? "none"}
      />
    </>
  );
}

/** Preview + edit the message, then open WhatsApp with it pre-filled. */
export function WhatsAppPreview({ open, onOpenChange, title, mobile, initialText }) {
  const [text, setText] = useState(initialText);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><WhatsAppIcon className="size-5 text-[#25D366]" /> {title}</DialogTitle>
          <DialogDescription>To +91 {mobile}. You can edit the message before sending.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-[#efeae2] p-3">
          <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-2.5 shadow-sm">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={Math.min(12, text.split("\n").length + 1)}
              className="w-full resize-none bg-transparent text-[13px] leading-snug text-[#111b21] outline-none"
            />
          </div>
        </div>
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" />
          Opens WhatsApp with this message ready. Automatic sending with the PDF bill (WhatsApp Business API) is coming soon.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <a
            href={waLink(mobile, text)}
            target="_blank"
            rel="noreferrer"
            onClick={() => onOpenChange(false)}
            className={cn(buttonVariants(), "bg-[#25D366] text-white hover:bg-[#1ebe5b]")}
          >
            <Send /> Open WhatsApp
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
