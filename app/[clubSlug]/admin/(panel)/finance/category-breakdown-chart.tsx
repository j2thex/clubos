"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { CategoryBreakdownRow } from "@/lib/finance/queries";

const PALETTE = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"];

export function CategoryBreakdownChart({
  data,
  currencySymbol = "€",
}: {
  data: CategoryBreakdownRow[];
  currencySymbol?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-sm text-gray-400">
        —
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.category_name,
    gross: Number(d.gross.toFixed(2)),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 16, bottom: 10, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              tickFormatter={(v) => `${currencySymbol}${v}`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              width={110}
            />
            <Tooltip
              formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="gross" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
