"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { ChartCard } from "./ChartCard";
import { CHART_COLOR_SEQUENCE, CHART_COLOR_SEQUENCE_DARK } from "@/lib/chart-colors";

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
  [key: string]: string | number;
}

interface BudgetPieChartProps {
  data: BudgetCategory[];
  title?: string;
  description?: string;
}

export function BudgetPieChart({
  data,
  title = "Budget Breakdown",
  description = "Spending distribution by category"
}: BudgetPieChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? CHART_COLOR_SEQUENCE_DARK : CHART_COLOR_SEQUENCE;

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BudgetCategory }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-navy-dark dark:text-white">{item.category}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ${item.amount.toLocaleString()} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
      {data.map((entry, index) => (
        <div key={entry.category} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors[index % colors.length] }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{entry.category}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ChartCard title={title} description={description}>
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="amount"
              nameKey="category"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {renderCustomLegend()}
        <div className="text-center mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
          <p className="text-xl font-bold text-navy-dark dark:text-white">
            ${total.toLocaleString()}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
