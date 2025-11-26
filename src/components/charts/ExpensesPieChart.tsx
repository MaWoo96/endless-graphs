"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartCard } from "./ChartCard";
import { formatCurrency } from "@/lib/utils";

interface ExpensesPieChartProps {
  data: Array<{ category: string; amount: number; percentage: number }>;
}

const COLORS = ["#7C3AED", "#EC4899", "#8AB2B5", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  return (
    <ChartCard
      title="Expenses by Category"
      description="Breakdown of operating expenses"
    >
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ payload }: { payload?: { percentage: number } }) => payload ? `${payload.percentage}%` : ''}
            outerRadius={120}
            fill="#8884d8"
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number, name: string, props: any) => [
              `${formatCurrency(value)} (${props.payload.percentage}%)`,
              props.payload.category,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry: any) => `${entry.payload.category}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
