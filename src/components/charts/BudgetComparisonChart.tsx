"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

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

const chartConfig = {
  budget: {
    label: "Budget",
    color: "hsl(217 91% 60%)", // Blue
  },
  actual: {
    label: "Actual",
    color: "hsl(152 73% 55%)", // Green
  },
};

export function BudgetComparisonChart({
  data,
  title = "Budget vs Actual",
  description = "Compare planned budget against actual spending"
}: BudgetComparisonChartProps) {
  return (
    <ChartCard title={title} description={description}>
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="category"
            tickLine={false}
            axisLine={false}
            width={70}
            style={{ fontSize: "12px" }}
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
            fill="hsl(217 91% 60%)"
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
                fill={entry.variance > 0 ? "hsl(0 84% 60%)" : "hsl(152 73% 55%)"}
              />
            ))}
          </Bar>
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </BarChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-text-muted">Under Budget</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-text-muted">Over Budget</span>
        </div>
      </div>
    </ChartCard>
  );
}
