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
import { formatCurrency, formatPercent } from "@/lib/utils";
import { FINANCIAL_COLORS, FINANCIAL_COLORS_DARK, CHART_AXIS_COLORS } from "@/lib/chart-colors";

interface ClientRevenueBarProps {
  data: Array<{ client: string; revenue: number; growth: number }>;
}

export function ClientRevenueBar({ data }: ClientRevenueBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;
  const axisColors = isDark ? CHART_AXIS_COLORS.dark : CHART_AXIS_COLORS.light;

  return (
    <ChartCard
      title="Revenue by Client"
      description="Top clients with growth indicators"
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={axisColors.grid} strokeOpacity={axisColors.gridOpacity} vertical={false} />
          <XAxis
            dataKey="client"
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: axisColors.label, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1E293B" : "white",
              border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              color: isDark ? "#F9FAFB" : "#1E1A2A",
            }}
            formatter={(value, _name, props) => {
              const numValue = typeof value === 'number' ? value : parseFloat(String(value));
              const growth = props?.payload?.growth ?? 0;
              return [
                `${formatCurrency(numValue)} (${formatPercent(growth)})`,
                "Revenue",
              ];
            }}
          />
          <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.growth >= 0 ? colors.profit : colors.loss}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
