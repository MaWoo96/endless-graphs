"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS, CHART_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface YearOverYearComparisonProps {
  data: Array<{ month: string; year2023: number; year2024: number }>;
}

export function YearOverYearComparison({ data }: YearOverYearComparisonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  return (
    <ChartCard
      title="Year-over-Year Comparison"
      description="Revenue comparison between 2023 and 2024"
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="year2023" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={axisColors.label} stopOpacity={0.8} />
              <stop offset="100%" stopColor={axisColors.label} stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="year2024" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.violet} stopOpacity={0.9} />
              <stop offset="100%" stopColor={chartColors.pink} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1E293B" : "white",
              border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              color: isDark ? "#F9FAFB" : "#1E1A2A",
            }}
            formatter={(value: number) => [formatCurrency(value), ""]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="rect"
          />
          <Bar
            dataKey="year2023"
            fill="url(#year2023)"
            name="2023"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
          <Bar
            dataKey="year2024"
            fill="url(#year2024)"
            name="2024"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
