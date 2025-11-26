"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { formatCurrency } from "@/lib/utils";

interface YearOverYearComparisonProps {
  data: Array<{ month: string; year2023: number; year2024: number }>;
}

export function YearOverYearComparison({ data }: YearOverYearComparisonProps) {
  return (
    <ChartCard
      title="Year-over-Year Comparison"
      description="Revenue comparison between 2023 and 2024"
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="year2023" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="year2024" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#EC4899" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [formatCurrency(value), ""]}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="rect"
          />
          <Bar
            dataKey="year2023"
            fill="url(#year2023)"
            name="2023"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
          <Bar
            dataKey="year2024"
            fill="url(#year2024)"
            name="2024"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
