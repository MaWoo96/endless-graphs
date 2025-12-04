"use client";

import { cn } from "@/lib/utils";
import { ChartCard } from "./ChartCard";
import { CHART_COLOR_SEQUENCE } from "@/lib/chart-colors";

interface BudgetItem {
  department: string;
  allocated: number;
  spent: number;
  remaining: number;
}

interface BudgetProgressProps {
  data: BudgetItem[];
  title?: string;
  description?: string;
}

// Tailwind classes for progress bars that align with our color system
const PROGRESS_BG_COLORS = [
  "bg-[#8B5CF6]", // violet
  "bg-[#3B82F6]", // blue
  "bg-[#10B981]", // emerald
  "bg-[#F59E0B]", // amber
  "bg-[#F43F5E]", // rose
];

export function BudgetProgress({
  data,
  title = "Budget Progress",
  description = "Spending vs allocated budget by department"
}: BudgetProgressProps) {
  return (
    <ChartCard title={title} description={description}>
      <div className="space-y-5 py-2">
        {data.map((item, index) => {
          const percentage = Math.round((item.spent / item.allocated) * 100);
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 90 && !isOverBudget;

          return (
            <div key={item.department} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLOR_SEQUENCE[index % CHART_COLOR_SEQUENCE.length] }}
                  />
                  <span className="text-sm font-medium text-navy-dark dark:text-white">
                    {item.department}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      isOverBudget
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : isNearLimit
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isOverBudget
                      ? "bg-gradient-to-r from-red-400 to-red-500"
                      : isNearLimit
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : PROGRESS_BG_COLORS[index % PROGRESS_BG_COLORS.length]
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {item.remaining > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ${item.remaining.toLocaleString()} remaining
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
