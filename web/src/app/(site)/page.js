import Link from "next/link";
import {
  Eye, Glasses, CircleDot, Sun, Baby, Wrench, CalendarCheck, MapPin, Star, ShieldCheck,
  Timer, BadgeCheck, MessageCircle, ArrowRight, Sparkles, Clock,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";
import { getPublicStores } from "@/lib/public-data";
import { StoreCard } from "./store-card";
import { SITE, SERVICES, BRANDS, STEPS, TESTIMONIALS, STATS } from "@/lib/site";

const SERVICE_ICONS = { eye: Eye, glasses: Glasses, contact: CircleDot, sun: Sun, baby: Baby, wrench: Wrench };

export default async function HomePage() {
  const stores = await getPublicStores();

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent),radial-gradient(40%_50%_at_10%_90%,color-mix(in_oklch,var(--chart-2)_14%,transparent),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Free eye test with every frame
            </span>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight md:text-5xl">
              See the world <span className="text-primary">clearly</span>, look great doing it.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Computerised eye tests, 1,000+ frames from Ray-Ban, Titan, Vogue and more, and lenses ready in as little as 48 hours, at 3 stores across the city.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact#book" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                <CalendarCheck className="size-4" /> Book a free eye test
              </Link>
              <a href="#stores" className="inline-flex h-11 items-center gap-2 rounded-full border bg-background px-6 text-sm font-medium transition hover:bg-muted">
                <MapPin className="size-4" /> Find a store
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}
              </div>
              Loved by 10,000+ families
            </div>
          </div>

          {/* visual */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/3.4] overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/30">
              <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white/5" />
              <svg viewBox="0 0 240 110" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="relative mx-auto mt-6 w-4/5 drop-shadow-xl" aria-hidden="true">
                <path d="M8 40 L24 32" />
                <path d="M232 40 L216 32" />
                <rect x="24" y="30" width="84" height="62" rx="28" fill="rgb(255 255 255 / 0.12)" />
                <rect x="132" y="30" width="84" height="62" rx="28" fill="rgb(255 255 255 / 0.12)" />
                <path d="M108 50 Q120 38 132 50" />
                <path d="M44 48 Q56 40 68 46" strokeWidth="3.5" opacity="0.7" />
                <path d="M152 48 Q164 40 176 46" strokeWidth="3.5" opacity="0.7" />
              </svg>
              {/* mini prescription card */}
              <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white p-3 text-foreground shadow-xl">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold">Your prescription</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">Ready in 48 hrs</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
                  <span className="text-left font-sans text-muted-foreground">Eye</span><span className="text-muted-foreground">SPH</span><span className="text-muted-foreground">CYL</span><span className="text-muted-foreground">AXIS</span>
                  <span className="text-left font-sans font-semibold text-primary">R</span><span>-1.25</span><span>-0.50</span><span>90</span>
                  <span className="text-left font-sans font-semibold text-amber-700">L</span><span>-1.00</span><span>-0.25</span><span>85</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 flex items-center gap-2 rounded-2xl bg-background px-3 py-2 text-sm shadow-lg ring-1 ring-foreground/5 md:-left-8">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Timer className="size-4" /></span>
              <span><b className="block leading-tight">15 min</b><span className="text-xs text-muted-foreground">eye test</span></span>
            </div>
            <div className="absolute top-1/3 -right-3 flex items-center gap-2 rounded-2xl bg-background px-3 py-2 text-sm shadow-lg ring-1 ring-foreground/5 md:-right-8">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E]"><WhatsAppIcon className="size-4" /></span>
              <span><b className="block leading-tight">Ready alert</b><span className="text-xs text-muted-foreground">on WhatsApp</span></span>
            </div>
          </div>
        </div>

        {/* stats strip */}
        <div className="relative mx-auto max-w-6xl px-4 pb-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-background px-4 py-5 text-center">
                <p className="text-2xl font-semibold tracking-tight md:text-3xl">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="What we do" title="Complete eye care under one roof" text="From your first eye test to the perfect pair, our optometrists and stylists take care of everything." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = SERVICE_ICONS[s.icon];
              return (
                <div key={s.title} className="group rounded-3xl bg-card p-6 ring-1 ring-foreground/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= BRANDS ================= */}
      <section id="brands" className="scroll-mt-20 border-y bg-muted/40 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">Genuine brands, official warranty</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {BRANDS.map((b) => (
              <span key={b} className="text-lg font-semibold tracking-tight text-foreground/50 transition-colors hover:text-foreground md:text-xl">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="How it works" title="New glasses in 4 easy steps" />
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl bg-card p-6 ring-1 ring-foreground/5">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                {i < STEPS.length - 1 && <ArrowRight className="absolute top-8 -right-3 hidden size-5 text-muted-foreground/40 md:block" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= WHY US ================= */}
      <section className="py-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground md:grid-cols-2 md:px-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold tracking-tight">Why families choose {SITE.name}</h2>
              <p className="text-primary-foreground/75">We combine clinical accuracy with honest pricing, so you get glasses that fit your eyes, your face and your budget.</p>
              <Link href="/contact#book" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-primary transition hover:bg-white/90">
                <CalendarCheck className="size-4" /> Book your visit
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                [ShieldCheck, "Trained optometrists", "Every test done by qualified eye-care staff."],
                [BadgeCheck, "100% genuine brands", "Authorised dealer with brand warranty."],
                [Clock, "Fast delivery", "Most lenses ready in 2–3 days."],
                [MessageCircle, "Care after you buy", "Free adjustments and WhatsApp support."],
              ].map(([Icon, t, d]) => (
                <li key={t} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <Icon className="size-5" />
                  <p className="mt-2 font-medium">{t}</p>
                  <p className="text-sm text-primary-foreground/70">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= STORES ================= */}
      <section id="stores" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Visit us" title={`${stores.length} stores across the city`} text={SITE.hours} />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stores.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle kicker="Reviews" title="What our customers say" />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl bg-background p-6 ring-1 ring-foreground/5">
                <div className="flex">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}</div>
                <blockquote className="mt-3 text-sm leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="mt-4 text-sm font-medium">
                  {t.name} <span className="font-normal text-muted-foreground">· {t.place}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Time for an eye check-up?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Experts recommend an eye test every year. Book a free slot at your nearest store. It takes just 15 minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact#book" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">
              <CalendarCheck className="size-4" /> Book a free eye test
            </Link>
            <a href={`https://wa.me/91${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-medium text-white transition hover:bg-[#1ebe5b]">
              <WhatsAppIcon className="size-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{kicker}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-muted-foreground">{text}</p>}
    </div>
  );
}
