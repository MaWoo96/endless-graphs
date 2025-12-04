"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Wallet,
  Receipt,
  TrendingUp,
  Building2,
  Link2,
  Search,
  FileText,
  PiggyBank,
  ArrowRight,
} from "lucide-react";

interface EmptyStateProps {
  type: "no-data" | "no-transactions" | "no-accounts" | "no-search-results" | "error" | "loading";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// SVG Illustrations for empty states
const illustrations = {
  "no-data": (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8AB2B5" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
      <rect x="60" y="70" width="80" height="60" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="70" y="85" width="30" height="6" rx="2" fill="#d1d5db" />
      <rect x="70" y="97" width="50" height="6" rx="2" fill="#d1d5db" />
      <rect x="70" y="109" width="40" height="6" rx="2" fill="#d1d5db" />
      <circle cx="145" cy="85" r="20" fill="#10b981" opacity="0.2" />
      <path d="M138 85l5 5 10-10" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "no-transactions": (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8AB2B5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#grad2)" />
      {/* Receipt icon */}
      <rect x="65" y="50" width="70" height="100" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="2" />
      <line x1="75" y1="70" x2="125" y2="70" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="85" x2="115" y2="85" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="100" x2="120" y2="100" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="115" x2="105" y2="115" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
      <circle cx="145" cy="125" r="25" fill="#10b981" opacity="0.15" />
      <text x="145" y="132" textAnchor="middle" fill="#10b981" fontSize="24" fontWeight="bold">$</text>
    </svg>
  ),
  "no-accounts": (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8AB2B5" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#grad3)" />
      {/* Bank building */}
      <rect x="55" y="80" width="90" height="70" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="2" />
      <polygon points="100,50 45,80 155,80" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" />
      {/* Columns */}
      <rect x="70" y="90" width="10" height="50" fill="#e5e7eb" />
      <rect x="95" y="90" width="10" height="50" fill="#e5e7eb" />
      <rect x="120" y="90" width="10" height="50" fill="#e5e7eb" />
      {/* Link icon */}
      <circle cx="155" cy="60" r="20" fill="#3b82f6" opacity="0.2" />
      <path d="M148 60h14M155 53v14" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "no-search-results": (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8AB2B5" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#grad4)" />
      {/* Magnifying glass */}
      <circle cx="90" cy="90" r="35" fill="none" stroke="#d1d5db" strokeWidth="6" />
      <line x1="115" y1="115" x2="145" y2="145" stroke="#d1d5db" strokeWidth="6" strokeLinecap="round" />
      {/* X mark inside */}
      <path d="M80 80l20 20M100 80l-20 20" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  "error": (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#grad5)" />
      {/* Warning triangle */}
      <polygon points="100,45 150,135 50,135" fill="#fef2f2" stroke="#ef4444" strokeWidth="3" />
      <text x="100" y="115" textAnchor="middle" fill="#ef4444" fontSize="48" fontWeight="bold">!</text>
    </svg>
  ),
};

const defaultContent = {
  "no-data": {
    icon: BarChart3,
    title: "No financial data yet",
    description: "Connect your bank accounts to start seeing your financial insights and analytics.",
  },
  "no-transactions": {
    icon: Receipt,
    title: "No transactions found",
    description: "Once your bank accounts are synced, your transactions will appear here.",
  },
  "no-accounts": {
    icon: Building2,
    title: "No accounts connected",
    description: "Link your bank accounts to automatically import your transactions.",
  },
  "no-search-results": {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or filters to find what you're looking for.",
  },
  "error": {
    icon: FileText,
    title: "Something went wrong",
    description: "We couldn't load your data. Please try again or contact support if the problem persists.",
  },
  "loading": {
    icon: PiggyBank,
    title: "Loading your data",
    description: "Please wait while we fetch your financial information...",
  },
};

export function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const defaults = defaultContent[type];
  const Icon = defaults.icon;
  const illustration = illustrations[type as keyof typeof illustrations];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-8 text-center",
      className
    )}>
      {/* Illustration */}
      <div className="w-48 h-48 mb-6">
        {illustration}
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-navy-dark dark:text-white mb-2">
        {title || defaults.title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description || defaults.description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-winning-green hover:bg-winning-green/90 text-white font-medium rounded-xl transition-colors shadow-lg shadow-winning-green/20"
        >
          {action.label}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Compact empty state for smaller areas
export function EmptyStateCompact({
  type,
  message,
  className,
}: {
  type: "no-data" | "no-transactions" | "no-search-results";
  message?: string;
  className?: string;
}) {
  const defaults = defaultContent[type];
  const Icon = defaults.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {message || defaults.title}
      </p>
    </div>
  );
}

// Loading skeleton for charts
export function ChartSkeleton({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse",
        className
      )}
      style={{ height }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>

      {/* Chart area skeleton */}
      <div className="flex items-end justify-between h-48 gap-2">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>

      {/* X-axis skeleton */}
      <div className="flex justify-between mt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-3 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for KPI cards
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
            <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="w-16 h-8 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for transaction rows
export function TransactionRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}
