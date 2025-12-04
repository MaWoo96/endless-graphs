"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Search,
  Download,
  Loader2,
  Tag,
  Flag,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import type { Transaction } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface VirtualizedTransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  categoryFilter?: string | null;
  onClearFilter?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Get category from transaction
function getCategory(tx: Transaction): string {
  if (tx.coa_keywords) return tx.coa_keywords;
  if (tx.pfc_primary) return tx.pfc_primary.replace(/_/g, " ");
  if (tx.category && tx.category.length > 0) return tx.category[0];
  return "Uncategorized";
}

// Get category color
function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    INCOME: "bg-winning-green/20 text-winning-green",
    TRANSFER_IN: "bg-winning-green/20 text-winning-green",
    FOOD_AND_DRINK: "bg-orange-500/20 text-orange-600",
    GENERAL_MERCHANDISE: "bg-blue-500/20 text-blue-600",
    TRANSPORTATION: "bg-purple-500/20 text-purple-600",
    TRAVEL: "bg-cyan-500/20 text-cyan-600",
    RENT_AND_UTILITIES: "bg-amber-500/20 text-amber-600",
    ENTERTAINMENT: "bg-pink-500/20 text-pink-600",
    PERSONAL_CARE: "bg-rose-500/20 text-rose-600",
    GENERAL_SERVICES: "bg-indigo-500/20 text-indigo-600",
    GOVERNMENT_AND_NON_PROFIT: "bg-slate-500/20 text-slate-600",
    MEDICAL: "bg-red-500/20 text-red-600",
    BANK_FEES: "bg-gray-500/20 text-gray-600",
    LOAN_PAYMENTS: "bg-yellow-500/20 text-yellow-700",
    TRANSFER_OUT: "bg-gray-500/20 text-gray-600",
  };
  const normalizedCategory = category?.toUpperCase().replace(/\s+/g, "_") || "";
  return colors[normalizedCategory] || "bg-gray-500/20 text-gray-600";
}

// Get merchant abbreviation
function getMerchantAbbreviation(name: string | null): string {
  if (!name) return "??";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Export to CSV
function exportToCSV(transactions: Transaction[]) {
  const headers = ["Date", "Merchant", "Category", "Amount", "Type", "Account"];
  const rows = transactions.map((tx) => [
    tx.date,
    tx.merchant_name || tx.name || "Unknown",
    getCategory(tx),
    tx.amount.toFixed(2),
    tx.amount < 0 ? "Income" : "Expense",
    tx.institution_name || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

export function VirtualizedTransactionTable({
  transactions,
  isLoading = false,
  categoryFilter,
  onClearFilter,
  onTransactionClick,
}: VirtualizedTransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const parentRef = useRef<HTMLDivElement>(null);

  // Define columns
  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-navy-dark dark:hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {formatDate(row.original.date)}
          </span>
        ),
        size: 80,
      },
      {
        id: "merchant",
        accessorFn: (row) => row.merchant_name || row.name || "Unknown",
        header: "Merchant",
        cell: ({ row }) => {
          const tx = row.original;
          const isIncome = tx.amount < 0;
          const hasAI = tx.categorization_source && tx.categorization_confidence;
          const isFlagged = tx.review_status === "flagged";
          const isApproved = tx.review_status === "approved";

          return (
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <div className="flex-shrink-0 relative">
                {tx.merchant_logo_url ? (
                  <img
                    src={tx.merchant_logo_url}
                    alt=""
                    className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 dark:border-gray-700"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold",
                      getCategoryColor(tx.pfc_primary)
                    )}
                  >
                    {getMerchantAbbreviation(tx.merchant_name || tx.name)}
                  </div>
                )}
                {isFlagged && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning-amber rounded-full flex items-center justify-center">
                    <Flag className="w-1.5 h-1.5 text-white fill-current" />
                  </div>
                )}
                {isApproved && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-winning-green rounded-full flex items-center justify-center">
                    <Check className="w-1.5 h-1.5 text-white" />
                  </div>
                )}
              </div>

              {/* Name & Status */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-navy-dark dark:text-white truncate text-sm">
                    {tx.merchant_name || tx.name || "Unknown"}
                  </span>
                  {hasAI && (
                    <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  )}
                  {tx.pending && (
                    <span className="w-1.5 h-1.5 rounded-full bg-warning-amber flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          );
        },
        size: 220,
      },
      {
        id: "category",
        accessorFn: (row) => getCategory(row),
        header: "Category",
        cell: ({ row }) => {
          const category = getCategory(row.original);
          return (
            <Badge
              className={cn(
                "text-xs font-medium",
                getCategoryColor(category.toUpperCase().replace(/\s+/g, "_"))
              )}
            >
              {category}
            </Badge>
          );
        },
        filterFn: (row, id, filterValue) => {
          if (!filterValue) return true;
          const category = getCategory(row.original).toLowerCase();
          return category.includes(filterValue.toLowerCase());
        },
        size: 140,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-navy-dark dark:hover:text-white transition-colors ml-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const amount = row.original.amount;
          const isIncome = amount < 0;
          return (
            <span
              className={cn(
                "font-semibold text-sm tabular-nums",
                isIncome ? "text-winning-green" : "text-navy-dark dark:text-white"
              )}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(amount)}
            </span>
          );
        },
        size: 100,
      },
      {
        accessorKey: "institution_name",
        header: "Account",
        cell: ({ row }) => (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {row.original.institution_name || "—"}
          </span>
        ),
        size: 100,
      },
    ],
    []
  );

  // Apply category filter
  useMemo(() => {
    if (categoryFilter) {
      setColumnFilters([{ id: "category", value: categoryFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [categoryFilter]);

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const { rows } = table.getRowModel();

  // Virtual row rendering
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = rows.map((r) => r.original);
    const income = filtered
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const expenses = filtered
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expenses, count: filtered.length };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
            />
          </div>

          {/* Filter badge */}
          {categoryFilter && (
            <Badge className="bg-teal/10 text-teal border-teal/20 gap-1.5">
              <Tag className="h-3 w-3" />
              {categoryFilter}
              <button
                onClick={onClearFilter}
                className="ml-1 hover:bg-teal/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{totals.count} transactions</span>
            <span className="text-winning-green font-medium">
              +{formatCurrency(totals.income)}
            </span>
            <span className="text-loss-red font-medium">
              -{formatCurrency(totals.expenses)}
            </span>
            <button
              onClick={() => exportToCSV(rows.map((r) => r.original))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={cn(
                  "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  header.column.id === "amount" && "text-right ml-auto"
                )}
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: "500px" }}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualRows.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              No transactions found
            </div>
          ) : (
            virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className={cn(
                    "absolute left-0 right-0 flex items-center gap-3 px-4 py-3",
                    "border-b border-gray-100 dark:border-gray-800",
                    "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onTransactionClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={cn(
                        cell.column.id === "amount" && "text-right ml-auto"
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
        Virtualized table - {transactions.length} total rows, {rows.length} filtered
      </div>
    </div>
  );
}
