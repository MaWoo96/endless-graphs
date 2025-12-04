"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { formatCurrency, cn } from "@/lib/utils";
import { FINANCIAL_COLORS, FINANCIAL_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface IncomeVsExpensesChartProps {
  data: Array<{ month: string; revenue: number; expenses: number }>;
}

// Custom Legend Component
function ChartLegend({ isDark = false }: { isDark?: boolean }) {
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const items = [
    { name: "Income", color: colors.income },
    { name: "Expenses", color: colors.expenses },
    { name: "Profit", color: colors.profit, isDashed: true },
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          {item.isDashed ? (
            <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-800 p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-50 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn("w-2 h-2 rounded-sm", entry.name === "Profit" && "rounded-full")}
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
          </div>
          <span className={cn(
            "font-medium tabular-nums",
            entry.value >= 0 ? "text-gray-900 dark:text-gray-50" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeVsExpensesChart({ data }: IncomeVsExpensesChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  // Calculate profit for each month
  const chartData = data.map((item) => ({
    ...item,
    profit: item.revenue - item.expenses,
  }));

  // Calculate totals for the header
  const totalIncome = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  // Get date range for subtitle
  const firstMonth = chartData[0]?.month || "";
  const lastMonth = chartData[chartData.length - 1]?.month || "";

  return (
    <ChartCard
      title="Income vs Expenses"
      description={`${firstMonth} - ${lastMonth}`}
    >
      {/* Header Stats - Tremor style */}
      <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.income }} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Income</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.expenses }} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.profit }} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Net Profit</span>
          </div>
          <p className={cn(
            "text-xl font-semibold tabular-nums",
            totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={axisColors.grid}
            strokeOpacity={axisColors.gridOpacity}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={65}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }} />
          <Bar
            dataKey="revenue"
            name="Income"
            fill={colors.income}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill={colors.expenses}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke={colors.profit}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: colors.profit, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <ChartLegend isDark={isDark} />
    </ChartCard>
  );
}
