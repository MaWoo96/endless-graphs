"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  value?: string;
  change?: number;
  changeLabel?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
  value,
  change,
  changeLabel
}: ChartCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-lg ring-1 ring-gray-200 dark:ring-gray-800",
      className
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
              {change !== undefined && (
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  change >= 0
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20"
                    : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20"
                )}>
                  {change >= 0 ? "+" : ""}{change}%
                </span>
              )}
            </div>
            {value && (
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
            {changeLabel && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{changeLabel}</p>
            )}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}
