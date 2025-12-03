"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { useState, useCallback } from "react";
import { ChartCard } from "./ChartCard";
import { formatCurrency, cn } from "@/lib/utils";

interface ExpensesPieChartProps {
  data: Array<{ category: string; amount: number; percentage: number }>;
  onCategoryClick?: (category: string) => void;
}

// Tremor-inspired color palette
const COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-800 p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-sm"
          style={{ backgroundColor: payload[0].payload.fill }}
        />
        <span className="font-medium text-gray-900 dark:text-gray-50">{data.category}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="text-gray-500 dark:text-gray-400">Amount</span>
        <span className="font-medium text-gray-900 dark:text-gray-50 tabular-nums">
          {formatCurrency(data.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500 dark:text-gray-400">Share</span>
        <span className="font-medium text-gray-900 dark:text-gray-50 tabular-nums">
          {data.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function ExpensesPieChart({ data, onCategoryClick }: ExpensesPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Calculate total for center display
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Sort data by amount descending for legend
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const onPieClick = useCallback((_: any, index: number) => {
    if (onCategoryClick && data[index]) {
      onCategoryClick(data[index].category);
    }
  }, [data, onCategoryClick]);

  return (
    <ChartCard
      title="Expenses by Category"
      description="Distribution of expenses across categories"
    >
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Chart */}
        <div className="relative w-full lg:w-1/2 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="amount"
                activeShape={activeIndex !== undefined ? renderActiveShape : undefined}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                onClick={onPieClick}
                className={onCategoryClick ? "cursor-pointer" : ""}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="transition-opacity"
                    style={{
                      opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.5,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full lg:w-1/2 space-y-2">
          {sortedData.map((item) => {
            const originalIndex = data.findIndex(d => d.category === item.category);
            const color = COLORS[originalIndex % COLORS.length];

            return (
              <div
                key={item.category}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                  onCategoryClick ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : "cursor-default",
                  activeIndex === originalIndex && "bg-gray-50 dark:bg-gray-800"
                )}
                onMouseEnter={() => setActiveIndex(originalIndex)}
                onMouseLeave={() => setActiveIndex(undefined)}
                onClick={() => onCategoryClick?.(item.category)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50 tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
