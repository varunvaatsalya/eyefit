import { cn } from "@/lib/utils";
import { RX_TYPES, USAGE_OPTIONS } from "@/lib/constants";

const typeLabel = Object.fromEntries(RX_TYPES.map((t) => [t.value, t.label]));
const usageLabel = Object.fromEntries(USAGE_OPTIONS.map((u) => [u.value, u.label]));

const v = (x) => (x && String(x).trim() ? x : "—");

/** Read-only prescription table (used on profile, invoice, print, job card). */
export function RxView({ rx, dense = false, showMeta = true }) {
  if (!rx) return null;
  const rows = [
    ["R", "DV", rx.right?.dp, rx.right?.add, rx.right?.pd, true],
    ["R", "NV", rx.right?.np],
    ["L", "DV", rx.left?.dp, rx.left?.add, rx.left?.pd, true],
    ["L", "NV", rx.left?.np],
  ];
  const meta = [
    ["Lens", rx.lens],
    ["Frame", rx.frame],
    ["Shade", rx.shade],
    ["Fitting ht.", rx.fittingHeight],
    ["Vertex", rx.vertexDistance],
    ["Ref. index", rx.refractiveIndex],
  ].filter(([, val]) => val);

  return (
    <div className="space-y-2">
      <table className={cn("w-full text-center font-mono tabular", dense ? "text-xs" : "text-sm")}>
        <thead>
          <tr className="font-sans text-xs text-muted-foreground">
            <th className="w-14 text-left font-medium">Eye</th>
            <th className="font-medium">SPH</th>
            <th className="font-medium">CYL</th>
            <th className="font-medium">AXIS</th>
            <th className="font-medium">VA</th>
            <th className="font-medium">ADD</th>
            <th className="font-medium">PD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([eye, row, r = {}, add, pd, first]) => (
            <tr key={eye + row} className={cn(first && eye === "L" && "border-t border-dashed")}>
              <td className="py-1 text-left font-sans text-xs">
                <span className={cn("font-semibold", eye === "R" ? "text-primary" : "text-amber-700")}>{eye}</span>{" "}
                <span className="text-muted-foreground">{row}</span>
              </td>
              <td>{v(r.sph)}</td>
              <td>{v(r.cyl)}</td>
              <td>{v(r.axis)}</td>
              <td>{v(r.va)}</td>
              <td>{first ? v(add) : ""}</td>
              <td>{first ? v(pd) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showMeta && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{typeLabel[rx.type] ?? "Spectacle"}</span>
          {rx.usage?.length > 0 && <span>{rx.usage.map((u) => usageLabel[u]).join(", ")}</span>}
          {meta.map(([k, val]) => (
            <span key={k}>
              {k}: <span className="text-foreground">{val}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
