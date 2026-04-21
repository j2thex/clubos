"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DailyRevenuePoint } from "@/lib/finance/queries";

export function RevenueChart({
  data,
  currencySymbol = "€",
}: {
  data: DailyRevenuePoint[];
  currencySymbol?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-sm text-gray-400">
        —
      </div>
    );
  }

  const formatted = data.map((d) => ({
    day: d.day.slice(5),
    gross: Number(d.gross.toFixed(2)),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              tickFormatter={(v) => `${currencySymbol}${v}`}
              width={60}
            />
            <Tooltip
              formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="gross"
              stroke="#111827"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
