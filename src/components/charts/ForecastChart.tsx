"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

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

const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "hsl(217 91% 60%)", // Blue
  },
  withIncome: {
    label: "With Income",
    color: "hsl(152 73% 55%)", // Green
  },
  afterExpenses: {
    label: "After Expenses",
    color: "hsl(38 92% 50%)", // Amber
  },
};

export function ForecastChart({
  data,
  title = "Balance Projection",
  description = "Projected balance over time based on spending patterns"
}: ForecastChartProps) {
  const minBalance = Math.min(...data.map(d => Math.min(d.balance, d.withIncome, d.afterExpenses)));
  const hasNegative = minBalance < 0;

  return (
    <ChartCard title={title} description={description}>
      <ChartContainer config={chartConfig} className="w-full h-[350px] aspect-auto">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            style={{ fontSize: "12px" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={70}
            style={{ fontSize: "12px" }}
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
              stroke="hsl(0 84% 60%)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          )}
          <Line
            type="monotone"
            dataKey="withIncome"
            stroke="hsl(152 73% 55%)"
            strokeWidth={2}
            dot={false}
            name="withIncome"
          />
          <Line
            type="monotone"
            dataKey="afterExpenses"
            stroke="hsl(38 92% 50%)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            name="afterExpenses"
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="hsl(217 91% 60%)"
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
