"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { formatCurrency, cn } from "@/lib/utils";
import { FINANCIAL_COLORS, FINANCIAL_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface MonthToMonthComparisonProps {
  data: Array<{ month: string; revenue: number; expenses: number }>;
}

// Custom Legend
function ChartLegend({ isDark = false }: { isDark?: boolean }) {
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const items = [
    { name: "Revenue", color: colors.income },
    { name: "Expenses", color: colors.expenses },
    { name: "Profit", color: colors.profit },
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-sm text-gray-500 dark:text-gray-400">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-slate-700 p-3 text-sm min-w-[160px]">
      <p className="font-medium text-gray-900 dark:text-gray-50 mb-2 pb-2 border-b border-gray-100 dark:border-slate-700">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
          </div>
          <span className={cn(
            "font-medium tabular-nums",
            entry.name === "Profit" && entry.value < 0
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-gray-50"
          )}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MonthToMonthComparison({ data }: MonthToMonthComparisonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  // Calculate month-over-month changes with last 6 months
  const comparisonData = data.slice(-6).map((item, index, arr) => {
    const prevMonth = index > 0 ? arr[index - 1] : null;
    const revenueChange = prevMonth
      ? ((item.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : 0;
    const expensesChange = prevMonth
      ? ((item.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
      : 0;
    const profit = item.revenue - item.expenses;
    const prevProfit = prevMonth ? prevMonth.revenue - prevMonth.expenses : profit;
    const profitChange = prevMonth && prevProfit !== 0
      ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100
      : 0;

    return {
      month: item.month,
      revenue: item.revenue,
      expenses: item.expenses,
      profit,
      revenueChange: Math.round(revenueChange * 10) / 10,
      expensesChange: Math.round(expensesChange * 10) / 10,
      profitChange: Math.round(profitChange * 10) / 10,
    };
  });

  const latestData = comparisonData[comparisonData.length - 1];

  return (
    <ChartCard
      title="Month to Month Performance"
      description="Revenue, expenses, and profit compared to previous month"
    >
      {/* Summary Stats */}
      {comparisonData.length > 1 && latestData && (
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.income }} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Revenue Change</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-semibold tabular-nums",
                latestData.revenueChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {latestData.revenueChange >= 0 ? "+" : ""}{latestData.revenueChange}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.expenses }} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Expenses Change</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-semibold tabular-nums",
                latestData.expensesChange <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {latestData.expensesChange >= 0 ? "+" : ""}{latestData.expensesChange}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.profit }} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Profit Change</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-semibold tabular-nums",
                latestData.profitChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {latestData.profitChange >= 0 ? "+" : ""}{latestData.profitChange}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={comparisonData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barGap={4}
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
            name="Revenue"
            fill={colors.income}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill={colors.expenses}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="profit"
            name="Profit"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          >
            {comparisonData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.profit >= 0 ? colors.profit : colors.loss}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend isDark={isDark} />
    </ChartCard>
  );
}
