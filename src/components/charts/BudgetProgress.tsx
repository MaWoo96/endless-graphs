"use client";

import { cn } from "@/lib/utils";
import { ChartCard } from "./ChartCard";

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

const PROGRESS_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
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
                    className={cn(
                      "w-2 h-2 rounded-full",
                      PROGRESS_COLORS[index % PROGRESS_COLORS.length]
                    )}
                  />
                  <span className="text-sm font-medium text-navy-dark">
                    {item.department}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      isOverBudget
                        ? "bg-red-100 text-red-600"
                        : isNearLimit
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isOverBudget
                      ? "bg-gradient-to-r from-red-400 to-red-500"
                      : isNearLimit
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : PROGRESS_COLORS[index % PROGRESS_COLORS.length]
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {item.remaining > 0 && (
                <p className="text-xs text-text-muted">
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
