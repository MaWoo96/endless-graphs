"use client";

import {
  ComposedChart,
  Line,
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

interface CashFlowChartProps {
  data: Array<{ month: string; inflow: number; outflow: number; net: number }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ChartCard
      title="Cash Flow Analysis"
      description="Monthly cash inflows, outflows, and net position"
    >
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
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
            iconType="circle"
          />
          <Bar
            dataKey="inflow"
            fill="url(#inflowGradient)"
            name="Cash Inflow"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="outflow"
            fill="url(#outflowGradient)"
            name="Cash Outflow"
            radius={[8, 8, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="#7C3AED"
            strokeWidth={3}
            name="Net Cash Flow"
            dot={{ fill: "#7C3AED", r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
