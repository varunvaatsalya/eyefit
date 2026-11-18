"use client";

import { useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";

const ROWS = [
  { t: "E", size: 68, va: "6/60" },
  { t: "F P", size: 50, va: "6/36" },
  { t: "T O Z", size: 38, va: "6/24" },
  { t: "L P E D", size: 29, va: "6/18" },
  { t: "P E C F D", size: 22, va: "6/12" },
  { t: "E D F C Z P", size: 17, va: "6/9" },
  { t: "F E L O P Z D", size: 13, va: "6/6" },
];
const LENS = 76; // lens radius in px

function Chart({ sharp }) {
  return (
    <div className="flex flex-col items-center gap-[0.55em] py-6 select-none">
      {ROWS.map((r, i) => (
        <div key={r.t} className="relative flex w-full items-center justify-center">
          <span
            className="font-bold tracking-[0.35em] text-foreground"
            style={{ fontSize: r.size, lineHeight: 1, filter: sharp ? "none" : `blur(${1.4 + i * 0.55}px)`, opacity: sharp ? 1 : 0.8 }}
          >
            {r.t}
          </span>
          <span className="absolute right-3 font-mono text-[10px] text-muted-foreground/70">{r.va}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Snellen eye chart: blurry by default, a lens makes it sharp.
 * The lens follows the mouse; when idle it drifts around on its own.
 */
export function EyeChart() {
  const boxRef = useRef(null);
  const hovering = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const set = (x, y) => {
      box.style.setProperty("--x", `${x}px`);
      box.style.setProperty("--y", `${y}px`);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (!hovering.current) {
        const { width: w, height: h } = box.getBoundingClientRect();
        const t = (now - start) / 1000;
        // gentle figure-of-eight drift over the chart
        set(w / 2 + Math.sin(t * 0.7) * w * 0.28, h * 0.52 + Math.sin(t * 1.4) * h * 0.26);
      }
      raf = requestAnimationFrame(tick);
    };
    if (reduce) {
      const { width: w, height: h } = box.getBoundingClientRect();
      set(w / 2, h / 2);
    } else raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const p = e.touches?.[0] ?? e;
    hovering.current = true;
    boxRef.current.style.setProperty("--x", `${p.clientX - r.left}px`);
    boxRef.current.style.setProperty("--y", `${p.clientY - r.top}px`);
  };

  const mask = `radial-gradient(circle ${LENS}px at var(--x, 50%) var(--y, 50%), #000 97%, transparent 100%)`;

  return (
    <div className="relative">
      <div
        ref={boxRef}
        onMouseMove={onMove}
        onTouchMove={onMove}
        onMouseLeave={() => (hovering.current = false)}
        onTouchEnd={() => (hovering.current = false)}
        className="relative cursor-none overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 shadow-primary/15 ring-foreground/5"
        aria-label="Eye test chart: move over it to see clearly"
      >
        {/* blurry chart */}
        <Chart />
        {/* sharp chart, only visible inside the lens */}
        <div className="pointer-events-none absolute inset-0 bg-white" style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <Chart sharp />
        </div>
        {/* lens rim + glare */}
        <div
          className="pointer-events-none absolute rounded-full ring-[6px] ring-foreground/85 shadow-[0_10px_30px_-5px_rgb(0_0_0/0.35),inset_0_0_0_2px_rgb(255_255_255/0.6)]"
          style={{ width: LENS * 2, height: LENS * 2, left: `calc(var(--x, 50%) - ${LENS}px)`, top: `calc(var(--y, 50%) - ${LENS}px)` }}
        >
          <span className="absolute top-4 left-6 h-8 w-3 -rotate-[35deg] rounded-full bg-white/60 blur-[2px]" />
          {/* temple arm, so it reads as spectacles */}
          <span className="absolute top-1/2 -right-16 h-[6px] w-16 -translate-y-6 rounded-full bg-foreground/85" />
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <MousePointer2 className="size-3.5" /> Move over the chart: that’s the EyeFit difference
      </p>
    </div>
  );
}
