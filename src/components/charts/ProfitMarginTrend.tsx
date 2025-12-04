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
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface ProfitMarginTrendProps {
  data: Array<{ quarter: string; margin: number }>;
}

export function ProfitMarginTrend({ data }: ProfitMarginTrendProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

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
              <stop offset="0%" stopColor={chartColors.violet} />
              <stop offset="50%" stopColor={chartColors.pink} />
              <stop offset="100%" stopColor={chartColors.rose} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} vertical={false} />
          <XAxis
            dataKey="quarter"
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1E293B" : "white",
              border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              color: isDark ? "#F9FAFB" : "#1E1A2A",
            }}
            formatter={(value: number) => [`${value}%`, "Margin"]}
          />
          <ReferenceLine
            y={avgMargin}
            stroke={axisColors.label}
            strokeDasharray="5 5"
            label={{ value: `Avg: ${avgMargin.toFixed(1)}%`, position: "right", fill: axisColors.label }}
          />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="url(#marginGradient)"
            strokeWidth={3}
            dot={{ fill: chartColors.violet, r: 6, strokeWidth: 2, stroke: isDark ? "#1E293B" : "#fff" }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
