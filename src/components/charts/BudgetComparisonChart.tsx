"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
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

interface BudgetComparisonItem {
  category: string;
  budget: number;
  actual: number;
  variance: number;
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[];
  title?: string;
  description?: string;
}

// Chart config uses CSS variables for theme support
const chartConfig = {
  budget: {
    label: "Budget",
    color: "var(--chart-10)", // Blue
  },
  actual: {
    label: "Actual",
    color: "var(--chart-3)", // Emerald
  },
};

export function BudgetComparisonChart({
  data,
  title = "Budget vs Actual",
  description = "Compare planned budget against actual spending"
}: BudgetComparisonChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const financialColors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  return (
    <ChartCard title={title} description={description}>
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: axisColors.label, fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="category"
            tickLine={false}
            axisLine={false}
            width={70}
            tick={{ fill: axisColors.label, fontSize: 12 }}
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
          <Bar
            dataKey="budget"
            fill={chartColors.blue}
            radius={[0, 4, 4, 0]}
            barSize={12}
            name="budget"
          />
          <Bar
            dataKey="actual"
            radius={[0, 4, 4, 0]}
            barSize={12}
            name="actual"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.variance > 0 ? financialColors.loss : financialColors.profit}
              />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: financialColors.profit }} />
          <span className="text-gray-500 dark:text-gray-400">Under Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: financialColors.loss }} />
          <span className="text-gray-500 dark:text-gray-400">Over Budget</span>
        </div>
      </div>
    </ChartCard>
  );
}
