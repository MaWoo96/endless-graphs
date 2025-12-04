"use client";

import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CHART_COLORS, CHART_COLORS_DARK, FINANCIAL_COLORS, FINANCIAL_COLORS_DARK } from "@/lib/chart-colors";

interface SparklineProps {
  data: number[];
  type?: "line" | "area";
  color?: "green" | "red" | "blue" | "purple" | "amber";
  height?: number;
  width?: number;
  className?: string;
  showDot?: boolean;
}

export function Sparkline({
  data,
  type = "line",
  color = "green",
  height = 40,
  width = 100,
  className,
  showDot = false,
}: SparklineProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  const financialColors = isDark ? FINANCIAL_COLORS_DARK : FINANCIAL_COLORS;

  // Map color names to actual colors from our unified system
  const colorMap = {
    green: {
      stroke: financialColors.profit,
      fill: financialColors.profit,
    },
    red: {
      stroke: financialColors.loss,
      fill: financialColors.loss,
    },
    blue: {
      stroke: chartColors.blue,
      fill: chartColors.blue,
    },
    purple: {
      stroke: chartColors.violet,
      fill: chartColors.violet,
    },
    amber: {
      stroke: chartColors.amber,
      fill: chartColors.amber,
    },
  };

  const chartData = data.map((value, index) => ({ value, index }));
  const colors = colorMap[color];
  const isPositive = data[data.length - 1] >= data[0];
  const autoColor = isPositive ? colorMap.green : colorMap.red;
  const finalColors = color === "green" && !isPositive ? autoColor : colors;

  if (type === "area") {
    return (
      <div className={cn("inline-block", className)} style={{ width, height, minWidth: width, minHeight: height }}>
        <ResponsiveContainer width={width} height={height}>
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={finalColors.fill} stopOpacity={0.3} />
                <stop offset="95%" stopColor={finalColors.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={finalColors.stroke}
              strokeWidth={1.5}
              fill={`url(#sparkline-gradient-${color})`}
              dot={showDot ? { r: 2, fill: finalColors.stroke } : false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={cn("inline-block", className)} style={{ width, height, minWidth: width, minHeight: height }}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={finalColors.stroke}
            strokeWidth={1.5}
            dot={showDot ? { r: 2, fill: finalColors.stroke } : false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// KPI Card with integrated sparkline
interface SparklineKPICardProps {
  title: string;
  value: string;
  change: number;
  period: string;
  sparklineData: number[];
  sparklineType?: "line" | "area";
}

export function SparklineKPICard({
  title,
  value,
  change,
  period,
  sparklineData,
  sparklineType = "area",
}: SparklineKPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-navy-dark dark:text-white mt-1">{value}</h3>
        </div>
        <Sparkline
          data={sparklineData}
          type={sparklineType}
          color={isPositive ? "green" : "red"}
          height={35}
          width={80}
        />
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            isPositive
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {isPositive ? "+" : ""}{change}%
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{period}</span>
      </div>
    </div>
  );
}
