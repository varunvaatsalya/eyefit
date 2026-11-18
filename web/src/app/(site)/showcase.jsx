import { Monitor, Sun, Sparkles, Layers } from "lucide-react";

/* ---------------- Frame shapes ---------------- */

const SHAPES = [
  {
    name: "Rectangle",
    best: "Round & oval faces",
    svg: (
      <>
        <rect x="14" y="22" width="78" height="44" rx="10" />
        <rect x="128" y="22" width="78" height="44" rx="10" />
      </>
    ),
  },
  {
    name: "Round",
    best: "Square & heart faces",
    svg: (
      <>
        <circle cx="53" cy="44" r="28" />
        <circle cx="167" cy="44" r="28" />
      </>
    ),
  },
  {
    name: "Cat-eye",
    best: "Oval & diamond faces",
    svg: (
      <>
        <path d="M10 26 Q50 12 92 30 Q90 66 52 66 Q16 64 10 26Z" />
        <path d="M210 26 Q170 12 128 30 Q130 66 168 66 Q204 64 210 26Z" />
      </>
    ),
  },
  {
    name: "Aviator",
    best: "Square & oval faces",
    svg: (
      <>
        <path d="M14 24 H90 Q94 62 56 70 Q16 66 14 24Z" />
        <path d="M206 24 H130 Q126 62 164 70 Q204 66 206 24Z" />
        <path d="M90 24 Q110 16 130 24" />
      </>
    ),
  },
  {
    name: "Wayfarer",
    best: "Most face shapes",
    svg: (
      <>
        <path d="M10 22 H94 L88 62 Q52 70 18 62Z" />
        <path d="M210 22 H126 L132 62 Q168 70 202 62Z" />
      </>
    ),
  },
  {
    name: "Clubmaster",
    best: "Round & long faces",
    svg: (
      <>
        <path d="M12 22 H94" strokeWidth="9" />
        <path d="M126 22 H208" strokeWidth="9" />
        <path d="M14 26 Q16 64 54 66 Q90 64 92 26" />
        <path d="M128 26 Q130 64 166 66 Q206 64 206 26" />
      </>
    ),
  },
];

export function FrameShapes() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {SHAPES.map((s, i) => (
        <div
          key={s.name}
          className="group flex flex-col items-center rounded-3xl bg-card p-5 text-center ring-1 ring-foreground/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/30"
        >
          <svg
            viewBox="0 0 220 84"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-14 w-full text-foreground/70 transition duration-300 group-hover:scale-110 group-hover:text-primary"
            style={{ transitionDelay: `${i * 15}ms` }}
            aria-hidden="true"
          >
            {s.svg}
            {s.name !== "Aviator" && <path d="M94 34 Q110 24 126 34" />}
          </svg>
          <p className="mt-3 text-sm font-semibold">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.best}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Lens technology (hover demos) ---------------- */

export function LensTech() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Blue cut */}
      <LensCard icon={Monitor} title="Blue-cut" text="Filters harmful blue light from phones & laptops. Less eye strain.">
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute left-0 h-[3px] w-full origin-left bg-gradient-to-r from-sky-400 to-sky-400/0 transition-[clip-path] duration-500 [clip-path:inset(0_0_0_0)] group-hover:[clip-path:inset(0_52%_0_0)]"
              style={{ top: `${22 + i * 14}%`, transitionDelay: `${i * 40}ms` }}
            />
          ))}
          <span className="absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/20 ring-4 ring-white/80 backdrop-blur-[1px]" />
        </div>
      </LensCard>

      {/* Photochromic */}
      <LensCard icon={Sun} title="Photochromic" text="Clear indoors, darkens automatically in sunlight. Two glasses in one.">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-300 to-amber-100">
          <Sun className="absolute top-3 right-4 size-7 text-amber-500 transition duration-500 group-hover:scale-125 group-hover:rotate-45" />
          <div className="flex gap-3">
            {[0, 1].map((i) => (
              <span key={i} className="size-14 rounded-full bg-white/10 ring-4 ring-slate-800 transition-colors duration-700 group-hover:bg-slate-800/80" />
            ))}
          </div>
        </div>
      </LensCard>

      {/* Anti-glare */}
      <LensCard icon={Sparkles} title="Anti-glare" text="Removes reflections for clear night driving and better photos.">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-800">
          <span className="relative size-20 overflow-hidden rounded-full bg-slate-700 ring-4 ring-white/80">
            <span className="absolute -inset-4 rotate-45 bg-gradient-to-r from-transparent via-white/80 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
          </span>
          <span className="absolute bottom-3 text-[10px] font-medium tracking-wide text-white/70 uppercase transition-opacity group-hover:opacity-0">Glare</span>
          <span className="absolute bottom-3 text-[10px] font-medium tracking-wide text-emerald-300 uppercase opacity-0 transition-opacity group-hover:opacity-100">Crystal clear</span>
        </div>
      </LensCard>

      {/* Progressive */}
      <LensCard icon={Layers} title="Progressive" text="Distance, computer and reading power in one lens. No visible line.">
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/70">
          <div className="relative h-24 w-28 overflow-hidden rounded-[45%] ring-4 ring-foreground/80">
            {[
              ["Distance", "bg-primary/15"],
              ["Computer", "bg-primary/30"],
              ["Reading", "bg-primary/50"],
            ].map(([label, bg]) => (
              <div key={label} className={`flex h-1/3 items-center justify-center text-[10px] font-medium text-foreground/80 transition-all duration-500 group-hover:tracking-wider ${bg}`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </LensCard>
    </div>
  );
}

function LensCard({ icon: Icon, title, text, children }) {
  return (
    <div className="group rounded-3xl bg-card p-4 ring-1 ring-foreground/5 transition hover:shadow-xl hover:shadow-primary/5">
      <div className="h-36">{children}</div>
      <div className="mt-4 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <p className="mt-2 text-[11px] font-medium text-primary/80">Hover to see it work →</p>
    </div>
  );
}
