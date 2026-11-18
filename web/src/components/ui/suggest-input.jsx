"use client";

import { useMemo, useRef } from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { cn } from "cn";
import { focusNext } from "@/lib/enter-nav";

/** Same look as the shadcn <Input>, for use with SuggestInput in forms. */
export const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm";

/**
 * Free-text input with a shadcn-styled suggestion list (replaces native <datalist>).
 * - Type to filter; ↑/↓ to move; Enter picks the highlighted option AND jumps to the next field.
 * - `power` ranks optical power values by closeness to what was typed (e.g. "-1.5" → -1.50, -1.25, -1.75).
 */
export function SuggestInput({
  value,
  onChange,
  options = [],
  power = false,
  openOnFocus = false,
  limit = 8,
  className,
  popupClassName,
  ...inputProps
}) {
  const inputRef = useRef(null);
  const query = String(value ?? "").trim();

  const items = useMemo(() => {
    if (!query) return power ? [] : options.slice(0, limit);
    if (power) {
      const n = Number(query);
      if (Number.isNaN(n)) return [];
      // unsigned input means plus (same rule as normalizePower)
      return [...options]
        .map((o) => ({ o, d: Math.abs(Number(o) - n) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, Math.min(limit, 5)) // closest 5: exact match first, then ±0.25, ±0.50
        .map((x) => x.o);
    }
    const q = query.toLowerCase();
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, limit);
  }, [query, options, power, limit]);

  return (
    <Autocomplete.Root
      items={items}
      filter={null}
      value={value ?? ""}
      autoHighlight
      openOnInputClick={openOnFocus}
      onValueChange={(v, details) => {
        onChange(v);
        // keyboard pick → continue to the next field
        if (details.reason === "item-press" && details.event?.type === "keydown") {
          setTimeout(() => focusNext(inputRef.current), 0);
        }
      }}
    >
      <Autocomplete.Input
        ref={inputRef}
        autoComplete="off"
        onFocus={openOnFocus ? (e) => e.currentTarget.click?.() : undefined}
        className={className}
        {...inputProps}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="z-[60] outline-none" sideOffset={4} align="start">
          <Autocomplete.Popup
            className={cn(
              "max-h-[min(16rem,var(--available-height))] min-w-[max(var(--anchor-width),7rem)] overflow-hidden [&:has([data-empty])]:hidden rounded-2xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
              "origin-(--transform-origin) transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              popupClassName
            )}
          >
            <Autocomplete.List className="max-h-[inherit] overflow-y-auto overscroll-contain outline-none data-empty:hidden">
              {(item) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className="flex cursor-default items-center rounded-xl px-2.5 py-1.5 text-sm outline-none select-none data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                >
                  <span className={cn(power && "font-mono tabular")}>{item}</span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
