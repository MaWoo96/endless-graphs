"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartCard } from "./ChartCard";

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

const COLORS = [
  "hsl(271 91% 65%)", // Purple
  "hsl(217 91% 60%)", // Blue
  "hsl(152 73% 55%)", // Green
  "hsl(38 92% 50%)",  // Amber
  "hsl(0 84% 60%)",   // Red
  "hsl(199 89% 48%)", // Cyan
];

export function BudgetPieChart({
  data,
  title = "Budget Breakdown",
  description = "Spending distribution by category"
}: BudgetPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: BudgetCategory }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-navy-dark">{item.category}</p>
          <p className="text-sm text-text-muted">
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
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <span className="text-xs text-text-muted">{entry.category}</span>
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
                  fill={COLORS[index % COLORS.length]}
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {renderCustomLegend()}
        <div className="text-center mt-2">
          <p className="text-sm text-text-muted">Total Budget</p>
          <p className="text-xl font-bold text-navy-dark">
            ${total.toLocaleString()}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
