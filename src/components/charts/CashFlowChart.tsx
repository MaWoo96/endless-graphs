"use client";

import {
  ComposedChart,
  Line,
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
import { FINANCIAL_COLORS, FINANCIAL_COLORS_DARK, CHART_AXIS_COLORS, CHART_COLORS, CHART_COLORS_DARK } from "@/lib/chart-colors";

interface CashFlowChartProps {
  data: Array<{ month: string; inflow: number; outflow: number; net: number }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  return (
    <ChartCard
      title="Cash Flow Analysis"
      description="Monthly cash inflows, outflows, and net position"
    >
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.profit} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.profit} stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.loss} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.loss} stopOpacity={0.3} />
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
            iconType="circle"
          />
          <Bar
            dataKey="inflow"
            fill="url(#inflowGradient)"
            name="Cash Inflow"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="outflow"
            fill="url(#outflowGradient)"
            name="Cash Outflow"
            radius={[8, 8, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke={chartColors.violet}
            strokeWidth={3}
            name="Net Cash Flow"
            dot={{ fill: chartColors.violet, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
