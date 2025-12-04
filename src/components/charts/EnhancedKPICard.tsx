"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChartArea, DollarSign, Percent, Users, CreditCard, PiggyBank, Wallet, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import CountUp from "@/components/reactbits/count-up";

interface EnhancedKPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  trend: "up" | "down" | "neutral";
  period: string;
  sparklineData?: number[];
  icon?: "chart" | "dollar" | "percent" | "users" | "credit" | "piggy" | "wallet" | "bank";
  variant?: "default" | "glass" | "gradient";
  accentColor?: "green" | "amber" | "red" | "blue" | "purple" | "teal";
  format?: "currency" | "number" | "percent";
  loading?: boolean;
  animate?: boolean;
}

const iconMap = {
  chart: ChartArea,
  dollar: DollarSign,
  percent: Percent,
  users: Users,
  credit: CreditCard,
  piggy: PiggyBank,
  wallet: Wallet,
  bank: Landmark,
};

const accentClasses = {
  green: {
    bg: "bg-winning-green/10",
    text: "text-winning-green",
    border: "border-winning-green/20",
    gradient: "from-winning-green/20 to-winning-green/5",
  },
  amber: {
    bg: "bg-warning-amber/10",
    text: "text-warning-amber",
    border: "border-warning-amber/20",
    gradient: "from-warning-amber/20 to-warning-amber/5",
  },
  red: {
    bg: "bg-loss-red/10",
    text: "text-loss-red",
    border: "border-loss-red/20",
    gradient: "from-loss-red/20 to-loss-red/5",
  },
  blue: {
    bg: "bg-info-blue/10",
    text: "text-info-blue",
    border: "border-info-blue/20",
    gradient: "from-info-blue/20 to-info-blue/5",
  },
  purple: {
    bg: "bg-chart-1/10",
    text: "text-chart-1",
    border: "border-chart-1/20",
    gradient: "from-chart-1/20 to-chart-1/5",
  },
  teal: {
    bg: "bg-teal/10",
    text: "text-teal",
    border: "border-teal/20",
    gradient: "from-teal/20 to-teal/5",
  },
};

export function EnhancedKPICard({
  title,
  value,
  previousValue,
  prefix = "",
  suffix = "",
  trend,
  period,
  sparklineData,
  icon = "chart",
  variant = "default",
  accentColor,
  format = "number",
  loading = false,
  animate = true,
}: EnhancedKPICardProps) {
  const Icon = iconMap[icon] || ChartArea;

  // Calculate change percentage
  const changePercent = previousValue && previousValue !== 0
    ? ((value - previousValue) / Math.abs(previousValue)) * 100
    : 0;

  const isPositive = trend === "up" || (trend === "neutral" && changePercent >= 0);
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  // Auto-determine accent color based on trend if not specified
  const finalAccentColor = accentColor || (isPositive ? "green" : "red");
  const accent = accentClasses[finalAccentColor];

  // Format display value
  const formatValue = (val: number) => {
    if (format === "currency") {
      return val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    if (format === "percent") {
      return val.toFixed(1);
    }
    return val.toLocaleString("en-US");
  };

  // Determine sparkline color based on data trend
  const sparklineColor = sparklineData && sparklineData.length > 1
    ? sparklineData[sparklineData.length - 1] >= sparklineData[0]
      ? "green"
      : "red"
    : finalAccentColor === "green" || finalAccentColor === "teal" || finalAccentColor === "blue"
      ? "green"
      : "red";

  const cardClasses = {
    default: "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-0.5",
    glass: "glass-card-light dark:glass-card hover:shadow-lg hover:-translate-y-0.5",
    gradient: `bg-gradient-to-br ${accent.gradient} dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-sm border ${accent.border} hover:shadow-lg hover:-translate-y-0.5`,
  };

  if (loading) {
    return (
      <div className={cn(cardClasses[variant], "p-6 transition-all duration-300")}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cardClasses[variant], "p-6 transition-all duration-300")}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-muted dark:text-gray-400 uppercase tracking-wide truncate">
            {title}
          </p>

          <div className="flex items-baseline gap-1 mt-2">
            {prefix && (
              <span className="text-xl font-bold text-navy-dark dark:text-white">
                {prefix}
              </span>
            )}
            {animate ? (
              <CountUp
                to={value}
                from={0}
                duration={1.5}
                separator=","
                className="text-3xl font-bold text-navy-dark dark:text-white tabular-nums"
              />
            ) : (
              <span className="text-3xl font-bold text-navy-dark dark:text-white tabular-nums">
                {formatValue(value)}
              </span>
            )}
            {suffix && (
              <span className="text-xl font-bold text-navy-dark dark:text-white">
                {suffix}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            {changePercent !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold",
                  isPositive
                    ? "bg-winning-green/10 text-winning-green"
                    : "bg-loss-red/10 text-loss-red"
                )}
              >
                <ArrowIcon className={cn("h-3 w-3", !isPositive && "rotate-90")} />
                {Math.abs(changePercent).toFixed(1)}%
              </div>
            )}
            <span className="text-sm text-text-muted dark:text-gray-500 truncate">{period}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          <div className={cn(
            "p-2.5 rounded-xl",
            accent.bg,
            accent.border,
            "border"
          )}>
            <Icon className={cn("w-5 h-5", accent.text)} />
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              type="area"
              color={sparklineColor}
              height={32}
              width={72}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Grid container for KPI cards
interface KPIGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-2 gap-3", // 2 columns on all screens for mobile
    3: "grid-cols-2 md:grid-cols-3 gap-3 md:gap-4",
    4: "grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6",
  };

  return (
    <div className={cn("grid", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Quick stat badge for inline metrics
interface QuickStatProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function QuickStat({ label, value, trend, className }: QuickStatProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-text-muted dark:text-gray-400">{label}:</span>
      <span className={cn(
        "text-sm font-semibold",
        trend === "up" && "text-winning-green",
        trend === "down" && "text-loss-red",
        (!trend || trend === "neutral") && "text-navy-dark dark:text-white"
      )}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      {trend && trend !== "neutral" && (
        <span className={cn(
          "text-xs",
          trend === "up" ? "text-winning-green" : "text-loss-red"
        )}>
          {trend === "up" ? "↑" : "↓"}
        </span>
      )}
    </div>
  );
}
