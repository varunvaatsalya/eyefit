import { Phone, Clock, CalendarCheck, Eye, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { getPublicStores } from "@/lib/public-data";
import { SITE } from "@/lib/site";
import { ContactForm } from "./contact-form";
import { StoreCard } from "../store-card";

export const metadata = {
  title: "Contact & book an eye test",
  description: "Book a free eye test or ask about frames, lenses and contact lenses at EyeFit Opticals.",
};

export default async function ContactPage() {
  const stores = await getPublicStores();
  const main = stores[0];

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_90%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Contact us</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">We’d love to see you. Literally.</h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">Book a free eye test, ask about a frame, or just say hello. Reach any of our stores by phone, WhatsApp or the form below.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {main && (
              <a href={`tel:${main.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full border bg-background px-5 text-sm font-medium transition hover:bg-muted">
                <Phone className="size-4" /> {main.phone}
              </a>
            )}
            <a href={`https://wa.me/91${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-medium text-white transition hover:bg-[#1ebe5b]">
              <WhatsAppIcon className="size-4" /> WhatsApp us
            </a>
            <span className="inline-flex h-11 items-center gap-2 px-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> {SITE.hours}
            </span>
          </div>
        </div>
      </section>

      <section id="book" className="scroll-mt-20 py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[2rem] bg-card p-6 ring-1 ring-foreground/5 md:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <CalendarCheck className="size-6 text-primary" /> Book an eye test / send an enquiry
            </h2>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Fill in a few details and we’ll confirm your slot on call or WhatsApp.</p>
            <ContactForm stores={stores} />
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
              <Eye className="size-7" />
              <h3 className="mt-3 text-lg font-semibold">Free computerised eye test</h3>
              <p className="mt-1 text-sm text-primary-foreground/75">Takes about 15 minutes. Bring your current glasses or old prescription if you have one.</p>
            </div>
            <div className="rounded-[2rem] bg-card p-6 ring-1 ring-foreground/5">
              <MessageCircle className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">Common questions</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="font-medium">How long do lenses take?</dt>
                  <dd className="text-muted-foreground">Most single-vision lenses are ready in 1–2 days, progressives in 3–5 days.</dd>
                </div>
                <div>
                  <dt className="font-medium">Do you fit lenses in my own frame?</dt>
                  <dd className="text-muted-foreground">Yes, bring your frame and we’ll check if it can take new lenses.</dd>
                </div>
                <div>
                  <dt className="font-medium">How do I know my glasses are ready?</dt>
                  <dd className="text-muted-foreground">You’ll get a WhatsApp message as soon as your order is ready for pickup.</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-muted/40 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Our stores</h2>
          <p className="mt-2 text-center text-muted-foreground">Walk in any day, or call ahead to book.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stores.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
