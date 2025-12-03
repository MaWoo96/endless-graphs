"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, ChartArea, DollarSign, Percent, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
  period: string;
  icon?: "chart" | "dollar" | "percent" | "users" | "credit";
  variant?: "default" | "glass";
  accent?: "green" | "amber" | "red" | "blue";
}

const iconMap = {
  chart: ChartArea,
  dollar: DollarSign,
  percent: Percent,
  users: Users,
  credit: CreditCard,
};

export function KPICard({
  title,
  value,
  change,
  trend,
  period,
  icon = "chart",
  variant = "default",
  accent
}: KPICardProps) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const Icon = iconMap[icon] || ChartArea;

  // Determine accent color
  const accentColor = accent || (isPositive ? "green" : "red");
  const accentClasses = {
    green: "text-winning-green",
    amber: "text-warning-amber",
    red: "text-loss-red",
    blue: "text-info-blue",
  };

  const cardClasses = variant === "glass"
    ? "glass-card-light p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    : "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5";

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-muted dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-navy-dark dark:text-white mt-2">{value}</h3>
          <div className="flex items-center gap-2 mt-3">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                isPositive
                  ? "bg-winning-green/10 text-winning-green"
                  : "bg-loss-red/10 text-loss-red"
              )}
            >
              <ArrowUpRight className={cn("h-3 w-3", !isPositive && "rotate-90")} />
              {Math.abs(change)}%
            </div>
            <span className="text-sm text-text-muted dark:text-gray-500">{period}</span>
          </div>
        </div>
        <div className="size-12 rounded-xl bg-gray-100/80 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700 flex items-center justify-center shadow-sm">
          <Icon className={cn("w-6 h-6", accentClasses[accentColor])} />
        </div>
      </div>
    </div>
  );
}

// Bonus: MetricCard component matching cosmos-aura style exactly
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down";
  accent?: "green" | "amber" | "red" | "blue";
}

export function MetricCard({ title, value, subtitle, trend, accent }: MetricCardProps) {
  const accentClasses = {
    green: "text-winning-green",
    amber: "text-warning-amber",
    red: "text-loss-red",
    blue: "text-info-blue",
  };

  return (
    <div className="glass-card-light p-6">
      <div className="text-sm text-text-muted mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-navy-dark">{value}</div>
          {subtitle && (
            <div className={cn(
              "text-xs mt-1 flex items-center gap-1",
              accent ? accentClasses[accent] : "text-winning-green"
            )}>
              {trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
              {subtitle}
            </div>
          )}
        </div>
        <div className="size-10 rounded-lg bg-gray-100/80 border border-gray-200/50 flex items-center justify-center">
          <ChartArea className={cn("w-5 h-5", accent ? accentClasses[accent] : "text-winning-green")} />
        </div>
      </div>
    </div>
  );
}
