import { Suspense } from "react";
import Link from "next/link";
import { Glasses, Phone, Clock, MapPin } from "lucide-react";
import { SiteHeader } from "./site-header";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { getPublicStores } from "@/lib/public-data";
import { SITE } from "@/lib/site";

export const metadata = {
  title: { default: `${SITE.name}: Eye tests, glasses & contact lenses`, template: `%s · ${SITE.name}` },
  description: "Computerised eye tests, prescription glasses, contact lenses and sunglasses from top brands. 3 stores in the city.",
};

export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Suspense fallback={<div className="h-16" />}>
        <SiteHeader name={SITE.name} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <a
        href={`https://wa.me/91${SITE.whatsapp}?text=${encodeURIComponent("Hi, I'd like to know more about EyeFit Opticals.")}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-4 bottom-4 z-40 flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <WhatsAppIcon className="size-7" />
      </a>
    </div>
  );
}

async function SiteFooter() {
  const stores = await getPublicStores();
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_2fr]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Glasses className="size-5" /></span>
            <span className="text-lg">{SITE.name}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{SITE.tagline} Trusted eye care for the whole family.</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" /> {SITE.hours}</p>
          <div className="flex gap-3 pt-1 text-sm">
            <Link href="/contact" className="font-medium text-primary hover:underline">Contact us</Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">Staff login</Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {stores.map((s) => (
            <div key={s.id} className="space-y-1.5 text-sm">
              <p className="font-semibold">{s.name}</p>
              <p className="flex gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" /> {s.address}</p>
              <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="size-4" /> {s.phone}</a>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {SITE.name}. All rights reserved.</div>
    </footer>
  );
}
