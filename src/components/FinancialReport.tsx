"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { MonthlyData, CategoryData, CashFlowData } from "@/lib/supabase/types";

// Using Helvetica (built-in PDF font) to avoid font loading issues

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1E1A2A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
  },
  logo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1E1A2A",
  },
  logoAccent: {
    color: "#10b981",
  },
  reportTitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  reportDate: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1E1A2A",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  kpiGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  kpiLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1E1A2A",
    marginTop: 4,
  },
  kpiValuePositive: {
    color: "#10b981",
  },
  kpiValueNegative: {
    color: "#ef4444",
  },
  kpiChange: {
    fontSize: 9,
    marginTop: 4,
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  tableCellRight: {
    textAlign: "right",
  },
  summaryBox: {
    backgroundColor: "#f0fdf4",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86efac",
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: "#15803d",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  pageNumber: {
    fontSize: 8,
    color: "#9ca3af",
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  chartPlaceholderText: {
    fontSize: 10,
    color: "#9ca3af",
  },
  barContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    marginTop: 10,
    gap: 3,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barPositive: {
    backgroundColor: "#10b981",
  },
  barNegative: {
    backgroundColor: "#ef4444",
  },
  barLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 10,
  },
  categoryAmount: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1E1A2A",
  },
  categoryPercent: {
    fontSize: 9,
    color: "#6b7280",
    marginLeft: 8,
    width: 40,
    textAlign: "right",
  },
});

// Category colors for the report
const categoryColors = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#6b7280", // gray
];

interface FinancialReportProps {
  businessName: string;
  reportPeriod: string;
  kpiMetrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    transactionCount: number;
  };
  monthlyData: MonthlyData[];
  expensesByCategory: CategoryData[];
  cashFlow: CashFlowData[];
  generatedAt?: Date;
}

// Format currency for PDF
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Financial Report PDF Document
function FinancialReportDocument({
  businessName,
  reportPeriod,
  kpiMetrics,
  monthlyData,
  expensesByCategory,
  cashFlow,
  generatedAt = new Date(),
}: FinancialReportProps) {
  const maxMonthlyValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.revenue, m.expenses)),
    1
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Endless <Text style={styles.logoAccent}>Winning</Text>
            </Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Financial Summary Report</Text>
            <Text style={styles.reportDate}>
              {reportPeriod} • Generated {generatedAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Business Name */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1E1A2A" }}>
            {businessName}
          </Text>
        </View>

        {/* KPI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Gross Revenue</Text>
              <Text style={[styles.kpiValue, styles.kpiValuePositive]}>
                {formatCurrency(kpiMetrics.totalRevenue)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Expenses</Text>
              <Text style={[styles.kpiValue, styles.kpiValueNegative]}>
                {formatCurrency(kpiMetrics.totalExpenses)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Net Profit</Text>
              <Text
                style={[
                  styles.kpiValue,
                  kpiMetrics.netProfit >= 0
                    ? styles.kpiValuePositive
                    : styles.kpiValueNegative,
                ]}
              >
                {formatCurrency(kpiMetrics.netProfit)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Profit Margin</Text>
              <Text
                style={[
                  styles.kpiValue,
                  kpiMetrics.profitMargin >= 0
                    ? styles.kpiValuePositive
                    : styles.kpiValueNegative,
                ]}
              >
                {kpiMetrics.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Trend - Simple bar representation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Revenue & Expenses</Text>
          <View style={styles.barContainer}>
            {monthlyData.slice(-6).map((month, idx) => (
              <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 2 }}>
                  <View
                    style={[
                      styles.bar,
                      styles.barPositive,
                      {
                        width: 12,
                        height: `${(month.revenue / maxMonthlyValue) * 100}%`,
                        minHeight: 2,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.barNegative,
                      {
                        width: 12,
                        height: `${(month.expenses / maxMonthlyValue) * 100}%`,
                        minHeight: 2,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{month.month}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 15, gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 12, height: 12, backgroundColor: "#10b981", borderRadius: 2, marginRight: 6 }} />
              <Text style={{ fontSize: 9, color: "#6b7280" }}>Revenue</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 12, height: 12, backgroundColor: "#ef4444", borderRadius: 2, marginRight: 6 }} />
              <Text style={{ fontSize: 9, color: "#6b7280" }}>Expenses</Text>
            </View>
          </View>
        </View>

        {/* Expenses by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          {expensesByCategory.slice(0, 6).map((cat, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryColors[idx % categoryColors.length] },
                ]}
              />
              <Text style={styles.categoryName}>{cat.category}</Text>
              <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
              <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
            </View>
          ))}
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Period Summary</Text>
          <Text style={styles.summaryText}>
            During {reportPeriod}, {businessName} processed{" "}
            {kpiMetrics.transactionCount.toLocaleString()} transactions, generating{" "}
            {formatCurrency(kpiMetrics.totalRevenue)} in revenue. After{" "}
            {formatCurrency(kpiMetrics.totalExpenses)} in expenses, the net{" "}
            {kpiMetrics.netProfit >= 0 ? "profit" : "loss"} was{" "}
            {formatCurrency(Math.abs(kpiMetrics.netProfit))}, representing a{" "}
            {kpiMetrics.profitMargin.toFixed(1)}% profit margin.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Endless Winning • Financial Analytics Platform
          </Text>
          <Text style={styles.pageNumber}>
            Page 1 of 1 • Confidential
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Export function to generate and download PDF
export async function generateFinancialReport(props: FinancialReportProps) {
  const blob = await pdf(<FinancialReportDocument {...props} />).toBlob();
  const filename = `${props.businessName.replace(/\s+/g, "_")}_Financial_Report_${props.reportPeriod.replace(/\s+/g, "_")}.pdf`;
  saveAs(blob, filename);
}

// Button component to trigger report generation
interface ReportButtonProps {
  businessName: string;
  reportPeriod: string;
  kpiMetrics: FinancialReportProps["kpiMetrics"];
  monthlyData: MonthlyData[];
  expensesByCategory: CategoryData[];
  cashFlow: CashFlowData[];
  className?: string;
}

export function GenerateReportButton({
  businessName,
  reportPeriod,
  kpiMetrics,
  monthlyData,
  expensesByCategory,
  cashFlow,
  className,
}: ReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateFinancialReport({
        businessName,
        reportPeriod,
        kpiMetrics,
        monthlyData,
        expensesByCategory,
        cashFlow,
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn(
        "flex items-center gap-2 px-4 py-2 bg-navy-dark hover:bg-navy-medium text-white font-medium rounded-lg transition-colors disabled:opacity-50",
        className
      )}
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Report
        </>
      )}
    </button>
  );
}

// Need to import useState for the button
import { useState } from "react";
import { cn } from "@/lib/utils";
