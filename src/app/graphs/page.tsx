"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { ChartErrorBoundary, ErrorBoundary } from "@/components/ErrorBoundary";
import { TransactionTable } from "@/components/TransactionTable";
import {
  expensesByCategory as mockExpensesByCategory,
} from "@/lib/mock-data";
import { Loader2, AlertCircle, RefreshCw, FileDown, Database, Wifi } from "lucide-react";
import { DateRangePicker, DateRangeOption } from "@/components/DateRangePicker";
import { YearPicker } from "@/components/YearPicker";
import { useClientData, useAggregatedData, useAccounts } from "@/hooks/useClientData";
import { useEntityContext } from "@/contexts/EntityContext";
import { AccountFilterPills } from "@/components/AccountFilterPills";
import { TagFilterPills } from "@/components/TagPicker";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Transaction, Tag } from "@/lib/supabase/types";

// Chart loading skeleton for lazy-loaded components
function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center`}>
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}

// Lazy load heavy chart components for better mobile performance
const ExpensesPieChart = dynamic(
  () => import("@/components/charts/ExpensesPieChart").then(mod => ({ default: mod.ExpensesPieChart })),
  { loading: () => <ChartSkeleton height="h-80" />, ssr: false }
);

const KPICard = dynamic(
  () => import("@/components/charts/KPICard").then(mod => ({ default: mod.KPICard })),
  { loading: () => <ChartSkeleton height="h-32" />, ssr: false }
);

const EnhancedKPICard = dynamic(
  () => import("@/components/charts/EnhancedKPICard").then(mod => ({ default: mod.EnhancedKPICard })),
  { loading: () => <ChartSkeleton height="h-36" />, ssr: false }
);

const KPIGrid = dynamic(
  () => import("@/components/charts/EnhancedKPICard").then(mod => ({ default: mod.KPIGrid })),
  { ssr: false }
);

const IncomeVsExpensesChart = dynamic(
  () => import("@/components/charts/IncomeVsExpensesChart").then(mod => ({ default: mod.IncomeVsExpensesChart })),
  { loading: () => <ChartSkeleton height="h-80" />, ssr: false }
);

const MonthToMonthComparison = dynamic(
  () => import("@/components/charts/MonthToMonthComparison").then(mod => ({ default: mod.MonthToMonthComparison })),
  { loading: () => <ChartSkeleton height="h-80" />, ssr: false }
);

const CashFlowWaterfallChart = dynamic(
  () => import("@/components/charts/WaterfallChart").then(mod => ({ default: mod.CashFlowWaterfallChart })),
  { loading: () => <ChartSkeleton height="h-80" />, ssr: false }
);

// Receipt type for linking
interface LinkedReceipt {
  id: string;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  match_status: string;
  match_confidence: number;
  ocr_confidence: number;
  storage_path: string;
  created_at: string;
  matched_transaction_id: string | null;
}

// Tab transition variants - optimized for smooth switching
const tabVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const tabTransition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1] as const
};

// Helper to get date range from option
function getDateRangeFromOption(option: DateRangeOption): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (option) {
    case "ytd_parent":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "qtd":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "mtd":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate.setDate(0); // Last day of previous month
      break;
    case "last_week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "current_week":
      const dayOfWeek = now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek);
      break;
    case "weekly":
      startDate.setDate(now.getDate() - 7);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarterly":
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "6m":
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "12m":
    default:
      startDate.setMonth(now.getMonth() - 12);
      break;
  }

  return { startDate, endDate };
}

// Helper to get display label for date range option
function getPeriodLabel(option: DateRangeOption): string {
  switch (option) {
    case "weekly":
    case "last_week":
      return "Last 7 days";
    case "current_week":
      return "This week";
    case "monthly":
    case "mtd":
      return "Month to date";
    case "last_month":
      return "Last month";
    case "quarterly":
    case "qtd":
      return "Quarter to date";
    case "yearly":
    case "ytd_parent":
      return "Year to date";
    case "6m":
      return "Last 6 months";
    case "12m":
      return "Last 12 months";
    default:
      return "Selected period";
  }
}

// Filter transactions by date range
function filterTransactionsByDateRange(
  transactions: Transaction[],
  dateRange: { startDate: Date; endDate: Date }
): Transaction[] {
  const startStr = dateRange.startDate.toISOString().split("T")[0];
  const endStr = dateRange.endDate.toISOString().split("T")[0];

  return transactions.filter((tx) => {
    const txDate = tx.date;
    return txDate >= startStr && txDate <= endStr;
  });
}

// Filter transactions by year (for month-to-month comparison)
function filterTransactionsByYear(
  transactions: Transaction[],
  year: number
): Transaction[] {
  const startStr = `${year}-01-01`;
  const endStr = `${year}-12-31`;

  return transactions.filter((tx) => {
    const txDate = tx.date;
    return txDate >= startStr && txDate <= endStr;
  });
}

function HomeContent() {
  // URL-based tab state
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  // Mobile detection for adaptive layouts
  const isMobile = useIsMobile();

  // Fetch ALL transactions once (last 12 months as max range)
  const maxDateRange = useMemo(() => getDateRangeFromOption("12m"), []);

  const { selectedEntity, isLoading: entityLoading } = useEntityContext();
  const { client, transactions: allTransactions, isLoading, error, refetch } = useClientData(maxDateRange, selectedEntity?.id);
  const { accounts, isLoading: accountsLoading } = useAccounts(selectedEntity?.id || null);

  // Fetch receipts for the selected entity to show receipt indicators on transactions
  const [receiptsMap, setReceiptsMap] = useState<Map<string, LinkedReceipt[]>>(new Map());
  const supabase = createClient();

  useEffect(() => {
    const fetchReceipts = async () => {
      if (!selectedEntity?.id) {
        setReceiptsMap(new Map());
        return;
      }

      try {
        const { data, error } = await supabase
          .from("receipts")
          .select("*")
          .eq("entity_id", selectedEntity.id)
          .not("matched_transaction_id", "is", null);

        if (error) {
          console.error("Error fetching receipts:", error);
          return;
        }

        // Build a map of transaction_id -> receipts
        const map = new Map<string, LinkedReceipt[]>();
        (data || []).forEach((receipt: LinkedReceipt) => {
          if (receipt.matched_transaction_id) {
            const existing = map.get(receipt.matched_transaction_id) || [];
            existing.push(receipt);
            map.set(receipt.matched_transaction_id, existing);
          }
        });
        setReceiptsMap(map);
      } catch (err) {
        console.error("Error fetching receipts:", err);
      }
    };

    fetchReceipts();
  }, [selectedEntity?.id, supabase]);

  // Section-specific date range states
  const [kpiDateOption, setKpiDateOption] = useState<DateRangeOption>("12m");
  const [incomeExpensesDateOption, setIncomeExpensesDateOption] = useState<DateRangeOption>("12m");
  const [monthComparisonYear, setMonthComparisonYear] = useState<number>(new Date().getFullYear());
  const [expensesCategoryDateOption, setExpensesCategoryDateOption] = useState<DateRangeOption>("12m");

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [transactionTagsMap, setTransactionTagsMap] = useState<Map<string, string[]>>(new Map());
  const [allTransactionTagsMap, setAllTransactionTagsMap] = useState<Map<string, Tag[]>>(new Map());

  // Fetch all transaction tags for display in rows
  useEffect(() => {
    async function fetchAllTransactionTags() {
      if (!selectedEntity?.tenant_id || allTransactions.length === 0) {
        setAllTransactionTagsMap(new Map());
        return;
      }

      try {
        // Get all transaction_tags with their tag details for this tenant's transactions
        const transactionIds = allTransactions.map(tx => tx.id);
        const { data, error } = await supabase
          .from("transaction_tags")
          .select("transaction_id, tags(*)")
          .in("transaction_id", transactionIds);

        if (error) throw error;

        // Build map of transaction_id -> Tag[]
        const map = new Map<string, Tag[]>();
        data?.forEach((tt: { transaction_id: string; tags: Tag | Tag[] | null }) => {
          const tag = Array.isArray(tt.tags) ? tt.tags[0] : tt.tags;
          if (tag) {
            const existing = map.get(tt.transaction_id) || [];
            existing.push(tag);
            map.set(tt.transaction_id, existing);
          }
        });
        setAllTransactionTagsMap(map);
      } catch (err) {
        console.error("Failed to fetch all transaction tags:", err);
      }
    }
    fetchAllTransactionTags();
  }, [supabase, selectedEntity?.tenant_id, allTransactions]);

  // Fetch available tags for the tenant
  useEffect(() => {
    async function fetchTags() {
      if (!selectedEntity?.tenant_id) {
        setAvailableTags([]);
        return;
      }

      setTagsLoading(true);
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("tenant_id", selectedEntity.tenant_id)
          .order("name");

        if (error) throw error;
        setAvailableTags(data || []);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      } finally {
        setTagsLoading(false);
      }
    }
    fetchTags();
  }, [supabase, selectedEntity?.tenant_id]);

  // Fetch transaction-tag mappings when tags are selected
  useEffect(() => {
    async function fetchTransactionTags() {
      if (selectedTagIds.length === 0 || allTransactions.length === 0) {
        setTransactionTagsMap(new Map());
        return;
      }

      try {
        // Get all transaction_tags for selected tags
        const { data, error } = await supabase
          .from("transaction_tags")
          .select("transaction_id, tag_id")
          .in("tag_id", selectedTagIds);

        if (error) throw error;

        // Build map of transaction_id -> tag_ids
        const map = new Map<string, string[]>();
        data?.forEach((tt) => {
          const existing = map.get(tt.transaction_id) || [];
          existing.push(tt.tag_id);
          map.set(tt.transaction_id, existing);
        });
        setTransactionTagsMap(map);
      } catch (err) {
        console.error("Failed to fetch transaction tags:", err);
      }
    }
    fetchTransactionTags();
  }, [supabase, selectedTagIds, allTransactions.length]);

  // Toggle tag filter
  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  // Clear tag filters
  const handleClearTagFilters = useCallback(() => {
    setSelectedTagIds([]);
  }, []);

  // Handle category click from pie chart - switch to transactions tab with filter
  const handleCategoryClick = useCallback((category: string) => {
    setCategoryFilter(category);
    router.push("/graphs?tab=transactions");
  }, [router]);

  // Clear category filter
  const handleClearFilter = useCallback(() => {
    setCategoryFilter(null);
  }, []);

  // Clear account filter
  const handleClearAccountFilter = useCallback(() => {
    setAccountFilter(null);
  }, []);

  // Reset account filter when entity changes
  useMemo(() => {
    setAccountFilter(null);
  }, [selectedEntity?.id]);

  // Compute date ranges for each section
  const kpiDateRange = useMemo(() => getDateRangeFromOption(kpiDateOption), [kpiDateOption]);
  const incomeExpensesDateRange = useMemo(() => getDateRangeFromOption(incomeExpensesDateOption), [incomeExpensesDateOption]);
  const expensesCategoryDateRange = useMemo(() => getDateRangeFromOption(expensesCategoryDateOption), [expensesCategoryDateOption]);

  // Filter transactions for each section
  const kpiTransactions = useMemo(
    () => filterTransactionsByDateRange(allTransactions, kpiDateRange),
    [allTransactions, kpiDateRange]
  );
  const incomeExpensesTransactions = useMemo(
    () => filterTransactionsByDateRange(allTransactions, incomeExpensesDateRange),
    [allTransactions, incomeExpensesDateRange]
  );
  const monthComparisonTransactions = useMemo(
    () => filterTransactionsByYear(allTransactions, monthComparisonYear),
    [allTransactions, monthComparisonYear]
  );
  const expensesCategoryTransactions = useMemo(
    () => filterTransactionsByDateRange(allTransactions, expensesCategoryDateRange),
    [allTransactions, expensesCategoryDateRange]
  );

  // Aggregate data for each section
  const kpiAggregatedData = useAggregatedData(kpiTransactions);
  const incomeExpensesAggregatedData = useAggregatedData(incomeExpensesTransactions);
  const monthComparisonAggregatedData = useAggregatedData(monthComparisonTransactions);
  const expensesCategoryAggregatedData = useAggregatedData(expensesCategoryTransactions);

  // Use real data if available, otherwise fall back to mock
  const hasRealData = allTransactions.length > 0;
  const expensesByCategory = hasRealData ? expensesCategoryAggregatedData.expensesByCategory : mockExpensesByCategory;

  // Calculate profit margin for KPIs
  const profitMargin = hasRealData && kpiAggregatedData.kpiMetrics.totalRevenue > 0
    ? (kpiAggregatedData.kpiMetrics.netProfit / kpiAggregatedData.kpiMetrics.totalRevenue) * 100
    : 36.5;

  // KPI metrics - Gross Income, Gross Expenses, Profit, Profit Margin
  const periodLabel = getPeriodLabel(kpiDateOption);
  const kpiMetrics = hasRealData
    ? [
        {
          title: "Gross Income",
          value: `$${kpiAggregatedData.kpiMetrics.totalRevenue.toLocaleString()}`,
          change: 0,
          trend: "up" as const,
          period: periodLabel,
        },
        {
          title: "Gross Expenses",
          value: `$${kpiAggregatedData.kpiMetrics.totalExpenses.toLocaleString()}`,
          change: 0,
          trend: "down" as const,
          period: periodLabel,
        },
        {
          title: "Profit",
          value: `$${kpiAggregatedData.kpiMetrics.netProfit.toLocaleString()}`,
          change: 0,
          trend: kpiAggregatedData.kpiMetrics.netProfit >= 0 ? "up" as const : "down" as const,
          period: periodLabel,
        },
        {
          title: "Profit Margin",
          value: `${profitMargin.toFixed(1)}%`,
          change: 0,
          trend: profitMargin >= 0 ? "up" as const : "down" as const,
          period: "Of revenue",
        },
      ]
    : [
        { title: "Gross Income", value: "$935,000", change: 15.3, trend: "up" as const, period: "vs last month" },
        { title: "Gross Expenses", value: "$593,000", change: -3.2, trend: "down" as const, period: "vs last month" },
        { title: "Profit", value: "$342,000", change: 22.7, trend: "up" as const, period: "vs last month" },
        { title: "Profit Margin", value: "36.5%", change: 4.2, trend: "up" as const, period: "vs last month" },
      ];

  return (
    <div className="min-h-full bg-off-white dark:bg-gray-950 transition-colors">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-4">
          {/* Connection Status Indicators */}
          <div className="flex items-center gap-3 px-3 py-1.5 glass-card-light rounded-full">
            <div className="flex items-center gap-1.5" title="Database connected">
              <span className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-winning-green glow-emerald' : 'bg-gray-400'}`} />
              <Database className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="h-3 w-px bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-1.5" title="Live sync">
              <span className={`w-2 h-2 rounded-full ${hasRealData ? 'bg-winning-green glow-emerald glow-pulse' : 'bg-gray-400'}`} />
              <Wifi className="w-3.5 h-3.5 text-gray-500" />
            </div>
          </div>

          {/* Data Status Badge */}
          {hasRealData && (
            <span className="px-3 py-1.5 text-xs font-medium bg-winning-green/10 text-winning-green rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-winning-green glow-emerald" />
              Live Data
            </span>
          )}
          {!hasRealData && !isLoading && (
            <span className="px-3 py-1.5 text-xs font-medium bg-warning-amber/10 text-warning-amber rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-amber" />
              Demo Data
            </span>
          )}
        </div>

        <button
          onClick={refetch}
          className="p-2 text-gray-500 hover:text-navy-dark dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {(isLoading || entityLoading) && (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-navy-medium dark:text-gray-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your financial data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="px-6 py-4">
          <div className="bg-loss-red/5 dark:bg-loss-red/10 border border-loss-red/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-loss-red flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-loss-red text-sm">Unable to load data</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Tab Transitions */}
      {!isLoading && !entityLoading && (
        <main className="px-3 py-4 md:px-6 md:py-6">
          <AnimatePresence mode="wait">
            {/* Dashboard View */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={tabVariants}
                transition={tabTransition}
              >
              {/* KPI Metrics Grid - Enhanced with sparklines */}
              <section className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-navy-dark dark:text-white">
                      {isMobile ? "Key Metrics" : "Key Performance Indicators"}
                    </h2>
                    {hasRealData && !isMobile && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {kpiTransactions.length} transactions • {kpiDateRange.startDate.toLocaleDateString()} - {kpiDateRange.endDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {hasRealData && !isMobile && (
                      <button
                        disabled
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium rounded-lg cursor-not-allowed"
                        title="Coming Soon"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Download Report</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">Soon</span>
                      </button>
                    )}
                    <DateRangePicker
                      value={kpiDateOption}
                      onChange={setKpiDateOption}
                      readOnly={false}
                      showPeriodPresets={!isMobile}
                    />
                  </div>
                </div>

                {/* Enhanced KPI Cards with Sparklines - 2 columns on mobile, 4 on desktop */}
                {hasRealData ? (
                  <KPIGrid columns={isMobile ? 2 : 4}>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title={isMobile ? "Income" : "Gross Income"}
                        value={kpiAggregatedData.kpiMetrics.totalRevenue}
                        previousValue={kpiAggregatedData.previousPeriod.totalRevenue}
                        prefix="$"
                        trend="up"
                        period={isMobile ? "" : periodLabel}
                        sparklineData={isMobile ? undefined : kpiAggregatedData.sparklines.revenue}
                        icon="dollar"
                        format="currency"
                        accentColor="green"
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title={isMobile ? "Expenses" : "Gross Expenses"}
                        value={kpiAggregatedData.kpiMetrics.totalExpenses}
                        previousValue={kpiAggregatedData.previousPeriod.totalExpenses}
                        prefix="$"
                        trend="down"
                        period={isMobile ? "" : periodLabel}
                        sparklineData={isMobile ? undefined : kpiAggregatedData.sparklines.expenses}
                        icon="credit"
                        format="currency"
                        accentColor="red"
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title={isMobile ? "Profit" : "Net Profit"}
                        value={kpiAggregatedData.kpiMetrics.netProfit}
                        previousValue={kpiAggregatedData.previousPeriod.netProfit}
                        prefix="$"
                        trend={kpiAggregatedData.kpiMetrics.netProfit >= 0 ? "up" : "down"}
                        period={isMobile ? "" : periodLabel}
                        sparklineData={isMobile ? undefined : kpiAggregatedData.sparklines.profit}
                        icon="piggy"
                        format="currency"
                        accentColor={kpiAggregatedData.kpiMetrics.netProfit >= 0 ? "teal" : "red"}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title="Margin"
                        value={kpiAggregatedData.kpiMetrics.profitMargin}
                        suffix="%"
                        trend={kpiAggregatedData.kpiMetrics.profitMargin >= 0 ? "up" : "down"}
                        period={isMobile ? "" : "Of revenue"}
                        sparklineData={isMobile ? undefined : kpiAggregatedData.sparklines.margin}
                        icon="percent"
                        format="percent"
                        accentColor={kpiAggregatedData.kpiMetrics.profitMargin >= 0 ? "blue" : "red"}
                      />
                    </ErrorBoundary>
                  </KPIGrid>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {kpiMetrics.map((metric, index) => (
                      <ErrorBoundary key={index}>
                        <KPICard {...metric} />
                      </ErrorBoundary>
                    ))}
                  </div>
                )}
              </section>

              {/* Income vs Expenses */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy-dark dark:text-white">Income vs Expenses</h2>
                    {hasRealData && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {incomeExpensesTransactions.length} transactions • {getPeriodLabel(incomeExpensesDateOption)}
                      </p>
                    )}
                  </div>
                  <DateRangePicker
                    value={incomeExpensesDateOption}
                    onChange={setIncomeExpensesDateOption}
                    readOnly={false}
                    showPeriodPresets={true}
                  />
                </div>
                <ChartErrorBoundary>
                  <IncomeVsExpensesChart data={incomeExpensesAggregatedData.monthlyRevenue} />
                </ChartErrorBoundary>
              </section>

              {/* Month-to-Month Comparison */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy-dark dark:text-white">Month-to-Month Comparison</h2>
                    {hasRealData && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {monthComparisonTransactions.length} transactions • {monthComparisonYear}
                      </p>
                    )}
                  </div>
                  <YearPicker
                    value={monthComparisonYear}
                    onChange={setMonthComparisonYear}
                    minYear={2020}
                    maxYear={new Date().getFullYear()}
                  />
                </div>
                <ChartErrorBoundary>
                  <MonthToMonthComparison data={monthComparisonAggregatedData.monthlyRevenue} />
                </ChartErrorBoundary>
              </section>

              {/* Expenses by Category - with drill-down */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy-dark dark:text-white">Expenses by Category</h2>
                    {hasRealData && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {expensesCategoryTransactions.length} transactions • {getPeriodLabel(expensesCategoryDateOption)}
                        <span className="ml-2 text-teal">• Click a category to view transactions</span>
                      </p>
                    )}
                  </div>
                  <DateRangePicker
                    value={expensesCategoryDateOption}
                    onChange={setExpensesCategoryDateOption}
                    readOnly={false}
                    showPeriodPresets={true}
                  />
                </div>
                <ChartErrorBoundary>
                  <ExpensesPieChart
                    data={expensesByCategory}
                    onCategoryClick={handleCategoryClick}
                  />
                </ChartErrorBoundary>
              </section>

              {/* Cash Flow Waterfall Chart */}
              {hasRealData && kpiAggregatedData.cashFlow.length > 0 && (
                <section className="mb-8">
                  <ChartErrorBoundary>
                    <CashFlowWaterfallChart
                      data={kpiAggregatedData.cashFlow}
                    />
                  </ChartErrorBoundary>
                </section>
              )}
              </motion.div>
            )}

            {/* Transactions View */}
            {activeTab === "transactions" && (
              <motion.div
                key="transactions"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={tabVariants}
                transition={tabTransition}
              >
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy-dark dark:text-white">
                      {selectedEntity?.name || "All"} Transactions
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {allTransactions.length} total transactions • Last 12 months
                      {accounts.length > 1 && (
                        <span className="ml-2">• {accounts.length} accounts</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Account Filter Pills - show when entity has multiple accounts */}
                {accounts.length > 1 && (
                  <div className="mb-4">
                    <AccountFilterPills
                      accounts={accounts}
                      selectedAccountId={accountFilter}
                      onSelectAccount={setAccountFilter}
                      isLoading={accountsLoading}
                    />
                  </div>
                )}

                {/* Tag Filter Pills - show when tags exist */}
                {availableTags.length > 0 && (
                  <div className="mb-4">
                    <TagFilterPills
                      tags={availableTags}
                      selectedTagIds={selectedTagIds}
                      onToggleTag={handleToggleTag}
                      onClearAll={handleClearTagFilters}
                      isLoading={tagsLoading}
                      filteredCount={
                        selectedTagIds.length > 0
                          ? allTransactions.filter((tx) =>
                              transactionTagsMap.has(tx.id) &&
                              selectedTagIds.some((tagId) =>
                                transactionTagsMap.get(tx.id)?.includes(tagId)
                              )
                            ).length
                          : undefined
                      }
                      totalCount={allTransactions.length}
                    />
                  </div>
                )}

                <TransactionTable
                  transactions={
                    // Filter by selected tags if any are selected
                    selectedTagIds.length > 0
                      ? allTransactions.filter((tx) =>
                          // Transaction must have at least one of the selected tags
                          transactionTagsMap.has(tx.id) &&
                          selectedTagIds.some((tagId) =>
                            transactionTagsMap.get(tx.id)?.includes(tagId)
                          )
                        )
                      : allTransactions
                  }
                  categoryFilter={categoryFilter}
                  accountFilter={accountFilter}
                  onClearFilter={handleClearFilter}
                  onClearAccountFilter={handleClearAccountFilter}
                  isLoading={isLoading}
                  showRunningBalance={true}
                  startingBalance={
                    // Use actual account balance when filtering by single account
                    accountFilter
                      ? accounts.find(a => a.id === accountFilter)?.balance_current || 0
                      : accounts.length === 1
                        ? accounts[0].balance_current || 0
                        : 0
                  }
                  receiptsMap={receiptsMap}
                  tagsMap={allTransactionTagsMap}
                />
              </section>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}

function HomeFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-teal" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
