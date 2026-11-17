import { Suspense } from "react";
import Link from "next/link";
import { Phone, CalendarDays, Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/page-skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { EnquiryStatus } from "./enquiry-status";
import { getContext, storeScope } from "@/lib/auth";
import { formatDate, timeAgo } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { ENQUIRY_REASONS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Enquiry } from "@/models";

export const metadata = { title: "Enquiries" };

const REASON = Object.fromEntries(ENQUIRY_REASONS.map((r) => [r.value, r.label]));
const TABS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

export default function EnquiriesPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <PageHeader title="Website enquiries" description="Eye-test bookings and questions sent from the public website's contact form.">
        <Link href="/contact" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          <Globe className="size-3.5" /> Open contact page
        </Link>
      </PageHeader>
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <EnquiryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EnquiryList({ searchParams }) {
  const ctx = await getContext();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.value === sp.status) ? sp.status : "new";
  const scope = { $or: [storeScope(ctx), { storeId: null }] };

  const [rows, counts] = await Promise.all([
    Enquiry.find({ ...scope, ...(tab !== "all" && { status: tab }) }).sort({ createdAt: -1 }).limit(100).lean(),
    Enquiry.aggregate([{ $match: scope }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  count.all = counts.reduce((s, c) => s + c.n, 0);
  const storeName = Object.fromEntries(ctx.stores.map((s) => [s.id, s.name]));

  return (
    <>
      <div className="inline-flex rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <Link key={t.value} href={`/enquiries?status=${t.value}`} scroll={false} className={cn("rounded-full px-3 py-1 text-xs font-medium", tab === t.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t.label} <span className="text-muted-foreground tabular">{count[t.value] ?? 0}</span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="items-center py-14 text-center text-sm text-muted-foreground">
          <Globe className="size-8 text-muted-foreground/50" />
          No {tab === "all" ? "" : tab} enquiries. Bookings from the website’s contact page show up here.
        </Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((e) => {
            const greet = `Hi ${e.name.split(" ")[0]}, thanks for contacting ${SITE.name}! ${e.reason === "eyetest" ? "We'd be happy to book your free eye test. " : ""}When would you like to visit?`;
            return (
              <Card key={String(e._id)} size="sm" className="gap-2">
                <div className="flex flex-wrap items-start gap-3 px-(--card-spacing)">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{e.name}</p>
                      <Badge variant="secondary">{REASON[e.reason] ?? e.reason}</Badge>
                      {e.status === "new" && <span className="size-2 rounded-full bg-primary" title="New" />}
                    </div>
                    <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="font-mono">{e.mobile}</span>
                      <span>{e.storeId ? storeName[String(e.storeId)] ?? "Other store" : "Any store"}</span>
                      {e.preferredDate && (
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" /> wants {formatDate(e.preferredDate, "EEE, dd MMM")}</span>
                      )}
                      <span>received {timeAgo(e.createdAt)}</span>
                    </p>
                    {e.message && <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">{e.message}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a href={`tel:${e.mobile}`} className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium hover:bg-muted"><Phone className="size-3.5" /> Call</a>
                    <a href={waLink(e.mobile, greet)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium text-[#128C7E] hover:bg-muted"><WhatsAppIcon className="size-3.5" /> WhatsApp</a>
                    <EnquiryStatus id={String(e._id)} status={e.status} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
