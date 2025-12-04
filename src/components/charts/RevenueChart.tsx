"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { CHART_COLORS, CHART_COLORS_DARK, FINANCIAL_COLORS, FINANCIAL_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

// Chart config uses CSS variables for theme support
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-4)", // Violet
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)", // Rose
  },
  profit: {
    label: "Profit",
    color: "var(--chart-3)", // Emerald
  },
};

export function RevenueChart({ data }: RevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const financialColors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  return (
    <ChartCard
      title="Revenue & Expenses"
      description="Monthly revenue, expenses, and profit trends"
    >
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.violet} stopOpacity={0.35} />
              <stop offset="95%" stopColor={chartColors.violet} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={financialColors.expenses} stopOpacity={0.35} />
              <stop offset="95%" stopColor={financialColors.expenses} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={financialColors.profit} stopOpacity={0.35} />
              <stop offset="95%" stopColor={financialColors.profit} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: axisColors.label, fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={60}
            tick={{ fill: axisColors.label, fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  const formattedValue = `$${numValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}`;
                  return `${formattedValue}`;
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={chartColors.violet}
            strokeWidth={2}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke={financialColors.expenses}
            strokeWidth={2}
            fill="url(#colorExpenses)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke={financialColors.profit}
            strokeWidth={2}
            fill="url(#colorProfit)"
          />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
