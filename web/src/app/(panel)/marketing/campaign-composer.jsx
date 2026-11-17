"use client";

import { useEffect, useState, useTransition } from "react";
import { Users, Cake, Eye, Wallet, Moon, Sparkles, Crown, Download, Send, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { getSegmentContacts } from "@/actions/marketing";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { CAMPAIGN_TEMPLATES, fillTemplate } from "@/lib/whatsapp";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = { all: Users, birthday: Cake, eyetest: Eye, due: Wallet, inactive: Moon, recent: Sparkles, vip: Crown };
const SUGGESTED = { birthday: "birthday", eyetest: "eyetest", inactive: "festival", recent: "collection" };

const pretty = (name = "") =>
  name.replace(/^(mr|mrs|ms|md|dr)\.?\s+/i, "").split(/\s+/)[0].toLowerCase().replace(/^./, (c) => c.toUpperCase());

export function CampaignComposer({ segments, storeName }) {
  const [segment, setSegment] = useState("eyetest");
  const [templateId, setTemplateId] = useState("eyetest");
  const [text, setText] = useState(CAMPAIGN_TEMPLATES.find((t) => t.id === "eyetest").text);
  const [contacts, setContacts] = useState([]);
  const [loading, startTransition] = useTransition();

  const current = segments.find((s) => s.id === segment);

  useEffect(() => {
    startTransition(async () => {
      const res = await getSegmentContacts(segment);
      setContacts(res.contacts ?? []);
    });
  }, [segment]);

  const pickSegment = (id) => {
    setSegment(id);
    const t = SUGGESTED[id];
    if (t) pickTemplate(t);
  };
  const pickTemplate = (id) => {
    setTemplateId(id);
    setText(CAMPAIGN_TEMPLATES.find((t) => t.id === id).text);
  };

  const sampleName = pretty(contacts[0]?.name) || "Anand";
  const preview = fillTemplate(text, { name: sampleName, store: storeName });

  const downloadCsv = () => {
    const rows = [["Customer No", "Name", "Mobile", "Message"], ...contacts.map((c) => [c.customerNo, c.name, c.mobile, fillTemplate(text, { name: pretty(c.name), store: storeName })])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `eyefit-${segment}-${contacts.length}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/5 md:p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Megaphone className="size-3.5" /></span>
          New WhatsApp campaign
        </h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800">Business API: coming soon</span>
      </header>

      {/* 1. Audience */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase">1 · Who should get it?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {segments.map((s) => {
            const Icon = ICONS[s.id];
            const active = s.id === segment;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSegment(s.id)}
                className={cn(
                  "flex items-start gap-2 rounded-xl p-2.5 text-left ring-1 transition-colors",
                  active ? "bg-primary/5 ring-2 ring-primary" : "ring-foreground/10 hover:bg-muted/60"
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{s.label}</span>
                  <span className="block text-base font-semibold tabular">{formatNumber(s.count)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Message + preview */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">2 · Message</p>
          <div className="flex flex-wrap gap-1">
            {CAMPAIGN_TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => pickTemplate(t.id)} className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", templateId === t.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-xl bg-input/50 p-2.5 text-sm outline-none focus:ring-3 focus:ring-ring/30"
          />
          <p className="flex justify-between text-[11px] text-muted-foreground">
            <span>Use <code className="rounded bg-muted px-1">{"{name}"}</code> and <code className="rounded bg-muted px-1">{"{store}"}</code>. *bold* works on WhatsApp.</span>
            <span>{text.length}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase">Preview</p>
          <div className="flex h-[calc(100%-1.25rem)] min-h-48 flex-col rounded-2xl bg-[#efeae2] p-3">
            <div className="mb-2 flex items-center gap-2 border-b border-black/5 pb-2 text-xs font-medium text-[#111b21]">
              <WhatsAppIcon className="size-4 text-[#25D366]" /> {storeName}
            </div>
            <div className="max-w-[92%] self-start rounded-xl rounded-tl-sm bg-white p-2.5 text-[13px] leading-snug whitespace-pre-wrap text-[#111b21] shadow-sm">
              <WaFormatted text={preview} />
              <span className="mt-1 block text-right text-[10px] text-[#667781]">10:30 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Send */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <p className="mr-auto text-sm">
          {loading ? <Loader2 className="inline size-4 animate-spin" /> : <b className="tabular">{formatNumber(current?.count ?? 0)}</b>} customers in “{current?.label}”
          {contacts.length > 0 && <span className="text-muted-foreground"> · e.g. {contacts.slice(0, 3).map((c) => pretty(c.name)).join(", ")}</span>}
        </p>
        <Button variant="outline" onClick={downloadCsv} disabled={!contacts.length}>
          <Download /> Download list
        </Button>
        <Button
          className="bg-[#25D366] text-white hover:bg-[#1ebe5b]"
          disabled={!current?.count}
          onClick={() =>
            toast.info(`Ready to send to ${current.count} customers`, {
              description: "Bulk sending starts once the WhatsApp Business API is connected. For now, download the list.",
            })
          }
        >
          <Send /> Send to {formatNumber(current?.count ?? 0)}
        </Button>
      </div>
    </section>
  );
}

/** Render WhatsApp-style *bold* in the preview. */
function WaFormatted({ text }) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <b key={i}>{part.slice(1, -1)}</b> : <span key={i}>{part}</span>
  );
}
