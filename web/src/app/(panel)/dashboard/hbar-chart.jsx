"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatINR } from "@/lib/format";

const config = { value: { label: "Amount", color: "var(--chart-3)" } };

/**
 * Single-series horizontal bars (one amber hue from the shadcn chart theme).
 * Category names sit on the axis and values are written at the bar end, so nothing depends on colour.
 */
export function HBarChart({ data, unitLabel = "bills" }) {
  const height = Math.max(120, data.length * 34 + 10);
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={96} tick={{ fontSize: 12 }} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", radius: 6 }}
          content={
            <ChartTooltipContent
              hideIndicator
              formatter={(value, _n, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.count} {unitLabel}</span>
                  <span className="font-medium tabular text-foreground">{formatINR(value, { decimals: false })}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} maxBarSize={22} animationDuration={400}>
          <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(v) => formatINR(v, { decimals: false })} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
