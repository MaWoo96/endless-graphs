"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(271 91% 65%)", // Purple
  },
  expenses: {
    label: "Expenses",
    color: "hsl(0 84% 60%)", // Red
  },
  profit: {
    label: "Profit",
    color: "hsl(152 73% 55%)", // Green
  },
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ChartCard
      title="Revenue & Expenses"
      description="Monthly revenue, expenses, and profit trends"
    >
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(271 91% 65%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(271 91% 65%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152 73% 55%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(152 73% 55%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: "12px" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={60}
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
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
            stroke="hsl(271 91% 65%)"
            strokeWidth={2}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            fill="url(#colorExpenses)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="hsl(152 73% 55%)"
            strokeWidth={2}
            fill="url(#colorProfit)"
          />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
