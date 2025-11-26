"use client";

import { useState, useMemo } from "react";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ExpensesPieChart } from "@/components/charts/ExpensesPieChart";
import { ClientRevenueBar } from "@/components/charts/ClientRevenueBar";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { ProfitMarginTrend } from "@/components/charts/ProfitMarginTrend";
import { YearOverYearComparison } from "@/components/charts/YearOverYearComparison";
import { KPICard } from "@/components/charts/KPICard";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { BudgetPieChart } from "@/components/charts/BudgetPieChart";
import { BudgetProgress } from "@/components/charts/BudgetProgress";
import { BudgetComparisonChart } from "@/components/charts/BudgetComparisonChart";
import { SparklineKPICard } from "@/components/charts/Sparkline";
import {
  monthlyRevenue as mockMonthlyRevenue,
  expensesByCategory as mockExpensesByCategory,
  revenueByClient,
  cashFlow as mockCashFlow,
  profitMarginTrend,
  yearOverYearComparison,
  departmentBudgets,
  budgetVsActual,
  forecastData,
  sparklineData,
} from "@/lib/mock-data";
import { BarChart3, LogOut, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { DateRangePicker, DateRangeOption } from "@/components/DateRangePicker";
import { useClientData, useAggregatedData, useUser } from "@/hooks/useClientData";

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

export default function Home() {
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("12m");
  const dateRange = useMemo(() => getDateRangeFromOption(dateRangeOption), [dateRangeOption]);

  const { user, signOut } = useUser();
  const { client, transactions, isLoading, error, refetch } = useClientData(dateRange);
  const aggregatedData = useAggregatedData(transactions);

  // Use real data if available, otherwise fall back to mock
  const hasRealData = transactions.length > 0;
  const monthlyRevenue = hasRealData ? aggregatedData.monthlyRevenue : mockMonthlyRevenue;
  const expensesByCategory = hasRealData ? aggregatedData.expensesByCategory : mockExpensesByCategory;
  const cashFlow = hasRealData ? aggregatedData.cashFlow : mockCashFlow;

  // KPI metrics from real data or mock
  const kpiMetrics = hasRealData
    ? [
        {
          title: "Total Revenue",
          value: `$${aggregatedData.kpiMetrics.totalRevenue.toLocaleString()}`,
          change: 0,
          trend: "up" as const,
          period: dateRangeOption === "12m" ? "Last 12 months" : "Selected period",
        },
        {
          title: "Total Expenses",
          value: `$${aggregatedData.kpiMetrics.totalExpenses.toLocaleString()}`,
          change: 0,
          trend: "down" as const,
          period: dateRangeOption === "12m" ? "Last 12 months" : "Selected period",
        },
        {
          title: "Net Profit",
          value: `$${aggregatedData.kpiMetrics.netProfit.toLocaleString()}`,
          change: 0,
          trend: aggregatedData.kpiMetrics.netProfit >= 0 ? "up" as const : "down" as const,
          period: dateRangeOption === "12m" ? "Last 12 months" : "Selected period",
        },
        {
          title: "Transactions",
          value: aggregatedData.kpiMetrics.transactionCount.toLocaleString(),
          change: 0,
          trend: "up" as const,
          period: "Total count",
        },
        {
          title: "Avg Transaction",
          value: `$${aggregatedData.kpiMetrics.avgTransactionSize.toLocaleString()}`,
          change: 0,
          trend: "up" as const,
          period: "Average size",
        },
        {
          title: "Profit Margin",
          value: aggregatedData.kpiMetrics.totalRevenue > 0
            ? `${Math.round((aggregatedData.kpiMetrics.netProfit / aggregatedData.kpiMetrics.totalRevenue) * 100)}%`
            : "0%",
          change: 0,
          trend: "up" as const,
          period: "Of revenue",
        },
      ]
    : [
        { title: "Total Revenue", value: "$935,000", change: 15.3, trend: "up" as const, period: "vs last year" },
        { title: "Net Profit", value: "$342,000", change: 22.7, trend: "up" as const, period: "vs last year" },
        { title: "Profit Margin", value: "36.5%", change: 4.2, trend: "up" as const, period: "vs last year" },
        { title: "Avg Client Value", value: "$18,750", change: 8.9, trend: "up" as const, period: "vs last year" },
        { title: "Operating Expenses", value: "$593,000", change: -3.2, trend: "down" as const, period: "vs last year" },
        { title: "Cash Balance", value: "$458,000", change: 28.4, trend: "up" as const, period: "vs last month" },
      ];

  const handleDateRangeChange = (option: DateRangeOption) => {
    setDateRangeOption(option);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-winning-green to-teal rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy-dark">Endless Graphs</h1>
                <p className="text-sm text-text-muted">
                  {client ? client.business_name || client.company_name : "Financial Dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasRealData && (
                <span className="px-2 py-1 text-xs font-medium bg-winning-green/10 text-winning-green rounded-full">
                  Live Data
                </span>
              )}
              {!hasRealData && !isLoading && (
                <span className="px-2 py-1 text-xs font-medium bg-warning-amber/10 text-warning-amber rounded-full">
                  Demo Data
                </span>
              )}
              <button
                onClick={refetch}
                className="p-2 text-gray-500 hover:text-navy-dark transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {user && (
                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={signOut}
                    className="p-2 text-gray-500 hover:text-loss-red transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-navy-medium">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your financial data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-loss-red/5 border border-loss-red/20 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-loss-red flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-loss-red">Unable to load data</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
              <p className="text-sm text-gray-500 mt-2">Showing demo data instead.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* KPI Metrics Grid */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-navy-dark">Key Performance Indicators</h2>
              <DateRangePicker
                value={dateRangeOption}
                onChange={handleDateRangeChange}
                readOnly={false}
                showPeriodPresets={true}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kpiMetrics.map((metric, index) => (
                <KPICard key={index} {...metric} />
              ))}
            </div>
          </section>

          {/* Primary Charts */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Revenue & Profitability</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={monthlyRevenue} />
              <ProfitMarginTrend data={profitMarginTrend} />
            </div>
          </section>

          {/* Cash Flow */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Cash Flow Management</h2>
            <CashFlowChart data={cashFlow} />
          </section>

          {/* Expense Breakdown & Client Revenue */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Detailed Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpensesPieChart data={expensesByCategory} />
              <ClientRevenueBar data={revenueByClient} />
            </div>
          </section>

          {/* Year-over-Year Comparison */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Historical Trends</h2>
            <YearOverYearComparison data={yearOverYearComparison} />
          </section>

          {/* Balance Forecast */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Balance Projection</h2>
            <ForecastChart data={forecastData} />
          </section>

          {/* Budget Management */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Budget Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BudgetPieChart data={expensesByCategory} />
              <BudgetProgress data={departmentBudgets} />
            </div>
          </section>

          {/* Budget vs Actual */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Budget vs Actual Performance</h2>
            <BudgetComparisonChart data={budgetVsActual} />
          </section>

          {/* Sparkline KPI Cards */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">Trending Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SparklineKPICard
                title="Revenue Trend"
                value={hasRealData ? `$${Math.round(aggregatedData.kpiMetrics.totalRevenue / 12).toLocaleString()}` : "$92,000"}
                change={18.4}
                period="vs last month"
                sparklineData={sparklineData.revenue}
                sparklineType="area"
              />
              <SparklineKPICard
                title="Profit Trend"
                value={hasRealData ? `$${Math.round(aggregatedData.kpiMetrics.netProfit / 12).toLocaleString()}` : "$46,000"}
                change={14.3}
                period="vs last month"
                sparklineData={sparklineData.profit}
                sparklineType="area"
              />
              <SparklineKPICard
                title="Expense Trend"
                value={hasRealData ? `$${Math.round(aggregatedData.kpiMetrics.totalExpenses / 12).toLocaleString()}` : "$46,000"}
                change={6.4}
                period="vs last month"
                sparklineData={sparklineData.expenses}
                sparklineType="line"
              />
              <SparklineKPICard
                title="Margin Trend"
                value={hasRealData && aggregatedData.kpiMetrics.totalRevenue > 0
                  ? `${Math.round((aggregatedData.kpiMetrics.netProfit / aggregatedData.kpiMetrics.totalRevenue) * 100)}%`
                  : "42%"}
                change={7.7}
                period="vs last quarter"
                sparklineData={sparklineData.margin}
                sparklineType="area"
              />
              <SparklineKPICard
                title="Transaction Count"
                value={hasRealData ? aggregatedData.kpiMetrics.transactionCount.toString() : "72"}
                change={5.9}
                period="vs last month"
                sparklineData={sparklineData.clients}
                sparklineType="line"
              />
              <SparklineKPICard
                title="Avg Transaction"
                value={hasRealData ? `$${aggregatedData.kpiMetrics.avgTransactionSize.toLocaleString()}` : "$458,000"}
                change={-0.4}
                period="vs last month"
                sparklineData={sparklineData.cashBalance}
                sparklineType="area"
              />
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              © 2024 Endless Winning. All rights reserved.
            </p>
            <p className="text-sm text-text-muted">
              Powered by advanced financial analytics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
