"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
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

interface ForecastDataPoint {
  date: string;
  balance: number;
  withIncome: number;
  afterExpenses: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  description?: string;
}

// Chart config uses CSS variables for theme support
const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "var(--chart-10)", // Blue
  },
  withIncome: {
    label: "With Income",
    color: "var(--chart-3)", // Emerald/Green
  },
  afterExpenses: {
    label: "After Expenses",
    color: "var(--chart-5)", // Amber
  },
};

export function ForecastChart({
  data,
  title = "Balance Projection",
  description = "Projected balance over time based on spending patterns"
}: ForecastChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const financialColors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  const minBalance = Math.min(...data.map(d => Math.min(d.balance, d.withIncome, d.afterExpenses)));
  const hasNegative = minBalance < 0;

  return (
    <ChartCard title={title} description={description}>
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: axisColors.label, fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={70}
            tick={{ fill: axisColors.label, fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  return `$${numValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}`;
                }}
              />
            }
          />
          {hasNegative && (
            <ReferenceLine
              y={0}
              stroke={financialColors.loss}
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          )}
          <Line
            type="monotone"
            dataKey="withIncome"
            stroke={financialColors.profit}
            strokeWidth={2}
            dot={false}
            name="withIncome"
          />
          <Line
            type="monotone"
            dataKey="afterExpenses"
            stroke={chartColors.amber}
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            name="afterExpenses"
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={chartColors.blue}
            strokeWidth={3}
            dot={false}
            name="balance"
          />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}
