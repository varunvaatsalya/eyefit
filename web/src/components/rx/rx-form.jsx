"use client";

import { cn } from "@/lib/utils";
import { normalizePower } from "@/lib/format";
import { SPH_VALUES, CYL_VALUES, ADD_VALUES, VA_VALUES, RX_TYPES, USAGE_OPTIONS } from "@/lib/constants";

export const EMPTY_RX = {
  type: "spectacle",
  right: { dp: {}, np: {}, add: "", pd: "" },
  left: { dp: {}, np: {}, add: "", pd: "" },
  vertexDistance: "",
  refractiveIndex: "",
  fittingHeight: "",
  lens: "",
  shade: "",
  frame: "",
  usage: [],
  notes: "",
};

export function rxIsEmpty(rx) {
  if (!rx) return true;
  const eye = (e) => [e?.dp?.sph, e?.dp?.cyl, e?.np?.sph, e?.add].some((v) => v && String(v).trim());
  return !eye(rx.right) && !eye(rx.left);
}

/** Copy only the editable fields of a saved prescription. */
export function rxFromSaved(saved) {
  if (!saved) return EMPTY_RX;
  const eye = (e = {}) => ({ dp: { ...(e.dp || {}) }, np: { ...(e.np || {}) }, add: e.add || "", pd: e.pd || "" });
  return {
    ...EMPTY_RX,
    type: saved.type || "spectacle",
    right: eye(saved.right),
    left: eye(saved.left),
    vertexDistance: saved.vertexDistance || "",
    refractiveIndex: saved.refractiveIndex || "",
    fittingHeight: saved.fittingHeight || "",
    lens: saved.lens || "",
    shade: saved.shade || "",
    frame: saved.frame || "",
    usage: saved.usage || [],
    notes: saved.notes || "",
  };
}

const addPower = (sph, add) => {
  const a = Number(sph || 0) + Number(add || 0);
  return normalizePower(String(a));
};

function Cell({ value, onChange, list, power, className, placeholder, ...props }) {
  return (
    <input
      value={value ?? ""}
      list={list}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={power ? (e) => onChange(normalizePower(e.target.value)) : undefined}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-transparent bg-input/50 px-1 text-center font-mono text-xs tabular outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30",
        className
      )}
      autoComplete="off"
      {...props}
    />
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="space-y-0.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-lg border border-transparent bg-input/50 px-2.5 text-xs outline-none focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30"
      />
    </label>
  );
}

export function RxForm({ value, onChange, compact = false }) {
  const rx = value ?? EMPTY_RX;

  const setEye = (side, row, field, v) => {
    const eye = rx[side];
    if (row) onChange({ ...rx, [side]: { ...eye, [row]: { ...(eye[row] || {}), [field]: v } } });
    else onChange({ ...rx, [side]: { ...eye, [field]: v } });
  };

  // When ADD is entered, auto-fill the near-vision row from distance + add (only if near row is empty).
  const onAddBlur = (side, raw) => {
    const add = normalizePower(raw);
    const eye = rx[side];
    const next = { ...eye, add };
    if (add && !eye.np?.sph && eye.dp?.sph) {
      next.np = { ...(eye.np || {}), sph: addPower(eye.dp.sph, add), cyl: eye.dp.cyl || "", axis: eye.dp.axis || "" };
    }
    onChange({ ...rx, [side]: next });
  };

  const toggleUsage = (u) =>
    onChange({ ...rx, usage: rx.usage?.includes(u) ? rx.usage.filter((x) => x !== u) : [...(rx.usage || []), u] });

  const rows = [
    { side: "right", row: "dp", label: "R", sub: "Distance", first: true },
    { side: "right", row: "np", label: "R", sub: "Near" },
    { side: "left", row: "dp", label: "L", sub: "Distance", first: true },
    { side: "left", row: "np", label: "L", sub: "Near" },
  ];

  return (
    <div className="space-y-3">
      <datalist id="rx-sph">{SPH_VALUES.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="rx-cyl">{CYL_VALUES.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="rx-add">{ADD_VALUES.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="rx-va">{VA_VALUES.map((v) => <option key={v} value={v} />)}</datalist>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-muted p-1">
          {RX_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ ...rx, type: t.value })}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                rx.type === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {USAGE_OPTIONS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => toggleUsage(u.value)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                rx.usage?.includes(u.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-separate border-spacing-[3px]">
          <thead>
            <tr className="text-[11px] font-medium text-muted-foreground">
              <th className="w-16" />
              <th className="font-medium">SPH</th>
              <th className="font-medium">CYL</th>
              <th className="w-12 font-medium">AXIS</th>
              <th className="w-14 font-medium">VA</th>
              <th className="w-14 font-medium">ADD</th>
              <th className="w-12 font-medium">PD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ side, row, label, sub, first }) => {
              const eye = rx[side] || {};
              const r = eye[row] || {};
              const nearPlaceholder = row === "np" && eye.add && eye.dp?.sph ? addPower(eye.dp.sph, eye.add) : "";
              return (
                <tr key={side + row} className={cn(first && side === "left" && "[&>td]:pt-2")}>
                  <td className="pr-1 text-left">
                    <span
                      className={cn(
                        "mr-1 inline-flex size-5 items-center justify-center rounded-md text-[11px] font-semibold",
                        side === "right" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700"
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{sub === "Distance" ? "DV" : "NV"}</span>
                  </td>
                  <td><Cell value={r.sph} list="rx-sph" power placeholder={nearPlaceholder} onChange={(v) => setEye(side, row, "sph", v)} /></td>
                  <td><Cell value={r.cyl} list="rx-cyl" power onChange={(v) => setEye(side, row, "cyl", v)} /></td>
                  <td><Cell value={r.axis} inputMode="numeric" maxLength={3} onChange={(v) => setEye(side, row, "axis", v.replace(/\D/g, ""))} /></td>
                  <td><Cell value={r.va} list="rx-va" onChange={(v) => setEye(side, row, "va", v)} /></td>
                  {first ? (
                    <>
                      <td rowSpan={2} className="align-middle">
                        <Cell
                          value={eye.add}
                          list="rx-add"
                          className="h-[4.2rem]"
                          onChange={(v) => setEye(side, null, "add", v)}
                          onBlur={(e) => onAddBlur(side, e.target.value)}
                        />
                      </td>
                      <td rowSpan={2} className="align-middle">
                        <Cell value={eye.pd} inputMode="decimal" className="h-[4.2rem]" onChange={(v) => setEye(side, null, "pd", v)} />
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6")}>
        <TextField label="Lens" placeholder="Blue cut, Progressive…" value={rx.lens} onChange={(v) => onChange({ ...rx, lens: v })} />
        <TextField label="Frame" value={rx.frame} onChange={(v) => onChange({ ...rx, frame: v })} />
        <TextField label="Shade / Tint" value={rx.shade} onChange={(v) => onChange({ ...rx, shade: v })} />
        <TextField label="Fitting height" value={rx.fittingHeight} onChange={(v) => onChange({ ...rx, fittingHeight: v })} />
        <TextField label="Vertex distance" value={rx.vertexDistance} onChange={(v) => onChange({ ...rx, vertexDistance: v })} />
        <TextField label="Refractive index" value={rx.refractiveIndex} onChange={(v) => onChange({ ...rx, refractiveIndex: v })} />
      </div>
    </div>
  );
}
