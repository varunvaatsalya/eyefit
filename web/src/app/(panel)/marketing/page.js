import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignComposer } from "./campaign-composer";
import { Automations } from "./automations";
import { getContext } from "@/lib/auth";
import { SEGMENTS, segmentCounts } from "@/lib/segments";

export const metadata = { title: "Marketing" };

export default function MarketingPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-3">
      <PageHeader title="Marketing" description="Reach customers on WhatsApp: offers, eye-test reminders, birthday wishes." />
      <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
        <MarketingBody />
      </Suspense>
    </div>
  );
}

async function MarketingBody() {
  const ctx = await getContext();
  if (!ctx.canManage) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
          <ShieldCheck className="size-5" /> Only the owner and store managers can run campaigns.
        </CardContent>
      </Card>
    );
  }
  const counts = await segmentCounts(ctx);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <CampaignComposer segments={SEGMENTS.map((s) => ({ ...s, count: counts[s.id] }))} storeName={ctx.activeStore?.name ?? "EyeFit Opticals"} />
      <Automations />
    </div>
  );
}
