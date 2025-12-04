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
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface WaterfallDataPoint {
  name: string;
  value: number;
  type: "start" | "positive" | "negative" | "total";
}

interface CashFlowWaterfallProps {
  data: {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
  className?: string;
  showLabels?: boolean;
  height?: number;
}

// Transform cash flow data into waterfall format
function transformToWaterfall(
  data: CashFlowWaterfallProps["data"]
): WaterfallDataPoint[] {
  if (!data || data.length === 0) return [];

  const result: WaterfallDataPoint[] = [];
  let runningTotal = 0;

  // Starting balance (could be 0 or first month's opening)
  result.push({
    name: "Opening",
    value: 0,
    type: "start",
  });

  // Add each month's net change
  data.forEach((month) => {
    result.push({
      name: `${month.month} In`,
      value: month.inflow,
      type: "positive",
    });
    result.push({
      name: `${month.month} Out`,
      value: -month.outflow,
      type: "negative",
    });
    runningTotal += month.net;
  });

  // Closing balance
  result.push({
    name: "Closing",
    value: runningTotal,
    type: "total",
  });

  return result;
}

// Simplified waterfall showing monthly net changes
function transformToSimpleWaterfall(
  data: CashFlowWaterfallProps["data"]
): { name: string; value: number; start: number; end: number; isTotal: boolean }[] {
  if (!data || data.length === 0) return [];

  const result: { name: string; value: number; start: number; end: number; isTotal: boolean }[] = [];
  let runningTotal = 0;

  data.forEach((month) => {
    const start = runningTotal;
    runningTotal += month.net;
    result.push({
      name: month.month,
      value: month.net,
      start,
      end: runningTotal,
      isTotal: false,
    });
  });

  // Add total bar
  result.push({
    name: "Total",
    value: runningTotal,
    start: 0,
    end: runningTotal,
    isTotal: true,
  });

  return result;
}

// Colors
const COLORS = {
  positive: "#10b981", // winning-green
  negative: "#ef4444", // loss-red
  total: "#8AB2B5", // teal
  start: "#6b7280", // gray
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; start: number; end: number; isTotal: boolean } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isPositive = data.value >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-semibold text-navy-dark dark:text-white mb-1">
        {data.name}
      </p>
      <p className={cn(
        "text-lg font-bold",
        data.isTotal ? "text-teal" : isPositive ? "text-winning-green" : "text-loss-red"
      )}>
        {isPositive ? "+" : ""}{data.value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </p>
      {!data.isTotal && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Running: {data.end.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      )}
    </div>
  );
}

export function CashFlowWaterfallChart({
  data,
  className,
  showLabels = true,
  height = 350,
}: CashFlowWaterfallProps) {
  const waterfallData = transformToSimpleWaterfall(data);

  if (waterfallData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-gray-500", className)}>
        No cash flow data available
      </div>
    );
  }

  // Calculate min/max for domain
  const allValues = waterfallData.flatMap((d) => [d.start, d.end]);
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(0, ...allValues);
  const padding = (maxValue - minValue) * 0.1;

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-navy-dark dark:text-white">
            Cash Flow Waterfall
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly net changes and cumulative total
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-winning-green" />
            <span className="text-gray-600 dark:text-gray-400">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-loss-red" />
            <span className="text-gray-600 dark:text-gray-400">Negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-teal" />
            <span className="text-gray-600 dark:text-gray-400">Total</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={waterfallData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tickFormatter={(value) =>
              value >= 1000 || value <= -1000
                ? `$${(value / 1000).toFixed(0)}k`
                : `$${value}`
            }
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            domain={[minValue - padding, maxValue + padding]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />

          {/* Invisible bar to create the floating effect */}
          <Bar dataKey="start" stackId="waterfall" fill="transparent" />

          {/* Main value bar */}
          <Bar
            dataKey="value"
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
          >
            {waterfallData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isTotal
                    ? COLORS.total
                    : entry.value >= 0
                      ? COLORS.positive
                      : COLORS.negative
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary row */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Inflows
          </p>
          <p className="text-lg font-bold text-winning-green mt-1">
            {data.reduce((sum, m) => sum + m.inflow, 0).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Outflows
          </p>
          <p className="text-lg font-bold text-loss-red mt-1">
            {data.reduce((sum, m) => sum + m.outflow, 0).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Net Change
          </p>
          <p className={cn(
            "text-lg font-bold mt-1",
            data.reduce((sum, m) => sum + m.net, 0) >= 0 ? "text-teal" : "text-loss-red"
          )}>
            {data.reduce((sum, m) => sum + m.net, 0).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact version for dashboard overview
export function CashFlowWaterfallCompact({
  data,
  className,
}: {
  data: CashFlowWaterfallProps["data"];
  className?: string;
}) {
  const netTotal = data.reduce((sum, m) => sum + m.net, 0);
  const isPositive = netTotal >= 0;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Net Cash Flow
        </span>
        <span className={cn(
          "text-lg font-bold",
          isPositive ? "text-winning-green" : "text-loss-red"
        )}>
          {isPositive ? "+" : ""}{netTotal.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          })}
        </span>
      </div>

      {/* Mini bar visualization */}
      <div className="flex items-end gap-1 h-16">
        {data.slice(-6).map((month, idx) => {
          const maxAbs = Math.max(...data.slice(-6).map((d) => Math.abs(d.net)));
          const height = maxAbs > 0 ? (Math.abs(month.net) / maxAbs) * 100 : 0;
          const isPos = month.net >= 0;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  isPos ? "bg-winning-green/80" : "bg-loss-red/80"
                )}
                style={{ height: `${Math.max(height, 8)}%` }}
                title={`${month.month}: ${month.net.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
              />
              <span className="text-[10px] text-gray-400 mt-1">{month.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
