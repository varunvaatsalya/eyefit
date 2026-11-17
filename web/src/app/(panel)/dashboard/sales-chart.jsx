"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatINR } from "@/lib/format";

const config = { sales: { label: "Sales", color: "var(--chart-3)" } };

const compact = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);

/** Single-series daily sales: one hue, no legend (the card title names it), hover tooltip. */
export function SalesChart({ data, className = "h-56" }) {
  return (
    <ChartContainer config={config} className={`aspect-auto w-full ${className}`}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", radius: 6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.full}
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.bills} bills</span>
                  <span className="font-medium tabular text-foreground">{formatINR(value, { decimals: false })}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={400} />
      </BarChart>
    </ChartContainer>
  );
}
