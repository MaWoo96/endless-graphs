"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "./ChartCard";

interface ProfitMarginTrendProps {
  data: Array<{ quarter: string; margin: number }>;
}

export function ProfitMarginTrend({ data }: ProfitMarginTrendProps) {
  const avgMargin = data.reduce((sum, d) => sum + d.margin, 0) / data.length;

  return (
    <ChartCard
      title="Profit Margin Trend"
      description="Quarterly profit margin percentage"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="marginGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="quarter"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [`${value}%`, "Margin"]}
          />
          <ReferenceLine
            y={avgMargin}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            label={{ value: `Avg: ${avgMargin.toFixed(1)}%`, position: "right" }}
          />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="url(#marginGradient)"
            strokeWidth={3}
            dot={{ fill: "#7C3AED", r: 6, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
