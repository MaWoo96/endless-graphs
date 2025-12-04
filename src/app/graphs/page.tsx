"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ExpensesPieChart } from "@/components/charts/ExpensesPieChart";
import { KPICard } from "@/components/charts/KPICard";
import { EnhancedKPICard, KPIGrid } from "@/components/charts/EnhancedKPICard";
import { IncomeVsExpensesChart } from "@/components/charts/IncomeVsExpensesChart";
import { MonthToMonthComparison } from "@/components/charts/MonthToMonthComparison";
import { CashFlowWaterfallChart } from "@/components/charts/WaterfallChart";
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
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/lib/supabase/types";

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

export default function Home() {
  // URL-based tab state
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";

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
        <main className="px-6 py-6">
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
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy-dark dark:text-white">Key Performance Indicators</h2>
                    {hasRealData && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {kpiTransactions.length} transactions • {kpiDateRange.startDate.toLocaleDateString()} - {kpiDateRange.endDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {hasRealData && (
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
                      showPeriodPresets={true}
                    />
                  </div>
                </div>

                {/* Enhanced KPI Cards with Sparklines */}
                {hasRealData ? (
                  <KPIGrid columns={4}>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title="Gross Income"
                        value={kpiAggregatedData.kpiMetrics.totalRevenue}
                        previousValue={kpiAggregatedData.previousPeriod.totalRevenue}
                        prefix="$"
                        trend="up"
                        period={periodLabel}
                        sparklineData={kpiAggregatedData.sparklines.revenue}
                        icon="dollar"
                        format="currency"
                        accentColor="green"
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title="Gross Expenses"
                        value={kpiAggregatedData.kpiMetrics.totalExpenses}
                        previousValue={kpiAggregatedData.previousPeriod.totalExpenses}
                        prefix="$"
                        trend="down"
                        period={periodLabel}
                        sparklineData={kpiAggregatedData.sparklines.expenses}
                        icon="credit"
                        format="currency"
                        accentColor="red"
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title="Net Profit"
                        value={kpiAggregatedData.kpiMetrics.netProfit}
                        previousValue={kpiAggregatedData.previousPeriod.netProfit}
                        prefix="$"
                        trend={kpiAggregatedData.kpiMetrics.netProfit >= 0 ? "up" : "down"}
                        period={periodLabel}
                        sparklineData={kpiAggregatedData.sparklines.profit}
                        icon="piggy"
                        format="currency"
                        accentColor={kpiAggregatedData.kpiMetrics.netProfit >= 0 ? "teal" : "red"}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <EnhancedKPICard
                        title="Profit Margin"
                        value={kpiAggregatedData.kpiMetrics.profitMargin}
                        suffix="%"
                        trend={kpiAggregatedData.kpiMetrics.profitMargin >= 0 ? "up" : "down"}
                        period="Of revenue"
                        sparklineData={kpiAggregatedData.sparklines.margin}
                        icon="percent"
                        format="percent"
                        accentColor={kpiAggregatedData.kpiMetrics.profitMargin >= 0 ? "blue" : "red"}
                      />
                    </ErrorBoundary>
                  </KPIGrid>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <TransactionTable
                  transactions={allTransactions}
                  categoryFilter={categoryFilter}
                  accountFilter={accountFilter}
                  onClearFilter={handleClearFilter}
                  onClearAccountFilter={handleClearAccountFilter}
                  isLoading={isLoading}
                  showRunningBalance={true}
                  receiptsMap={receiptsMap}
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
