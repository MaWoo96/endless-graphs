"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  ChevronRight,
  Flag,
  Check,
  Tag,
  Sparkles,
  MessageSquare,
  ScanLine,
  MoreHorizontal,
} from "lucide-react";
import type { Transaction } from "@/lib/supabase/types";
import {
  getCategoryEmoji,
  getRelativeTime,
  normalizeMerchantName,
  getTransactionBgColor,
  formatTransactionAmount,
} from "@/lib/transaction-utils";

// Receipt type for transaction-receipt linking
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
}

interface TransactionCardProps {
  transaction: Transaction;
  onSelect: (tx: Transaction) => void;
  onCategoryChange?: (id: string, category: string) => void;
  onFlag?: (id: string) => void;
  onApprove?: (id: string) => void;
  hasReceipt?: boolean;
  isSelected?: boolean;
}

// Get category from transaction
function getCategory(tx: Transaction): string {
  if (tx.coa_keywords) return tx.coa_keywords;
  if (tx.pfc_primary) return tx.pfc_primary.replace(/_/g, " ");
  if (tx.category && tx.category.length > 0) return tx.category[0];
  return "Uncategorized";
}

// Get category color based on PFC category
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
    OFFICE_SUPPLIES: "bg-blue-500/20 text-blue-600",
    PROFESSIONAL_SERVICES: "bg-violet-500/20 text-violet-600",
    ADVERTISING: "bg-fuchsia-500/20 text-fuchsia-600",
    INSURANCE: "bg-teal-500/20 text-teal-600",
    PAYROLL: "bg-emerald-500/20 text-emerald-600",
  };
  const normalizedCategory = category?.toUpperCase().replace(/\s+/g, "_") || "";
  return colors[normalizedCategory] || "bg-gray-500/20 text-gray-600";
}

// Swipe threshold for actions
const SWIPE_THRESHOLD = 80;

export function TransactionCard({
  transaction,
  onSelect,
  onCategoryChange,
  onFlag,
  onApprove,
  hasReceipt,
  isSelected,
}: TransactionCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const category = getCategory(transaction);
  const hasAICategory =
    transaction.categorization_source && transaction.categorization_confidence;
  const isFlagged = transaction.review_status === "flagged";
  const isApproved = transaction.review_status === "approved";

  const amountDisplay = formatTransactionAmount(transaction.amount);
  const categoryEmoji = getCategoryEmoji(category);
  const relativeTime = getRelativeTime(transaction.date);
  const merchantName = normalizeMerchantName(
    transaction.merchant_name || transaction.name
  );

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      if (info.offset.x < -SWIPE_THRESHOLD && onFlag) {
        // Swipe left to flag
        onFlag(transaction.id);
      } else if (info.offset.x > SWIPE_THRESHOLD && onApprove) {
        // Swipe right to approve
        onApprove(transaction.id);
      }

      setSwipeOffset(0);
    },
    [onFlag, onApprove, transaction.id]
  );

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setSwipeOffset(info.offset.x);
    },
    []
  );

  return (
    <div className="relative overflow-hidden">
      {/* Swipe action backgrounds */}
      <div className="absolute inset-0 flex">
        {/* Left action (approve) - green */}
        <div
          className={`flex-1 flex items-center justify-start pl-6 bg-winning-green transition-opacity ${
            swipeOffset > 20 ? "opacity-100" : "opacity-0"
          }`}
        >
          <Check className="w-6 h-6 text-white" />
          <span className="ml-2 text-white font-medium">Approve</span>
        </div>
        {/* Right action (flag) - amber */}
        <div
          className={`flex-1 flex items-center justify-end pr-6 bg-warning-amber transition-opacity ${
            swipeOffset < -20 ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="mr-2 text-white font-medium">Flag</span>
          <Flag className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Main card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className={`relative bg-white dark:bg-gray-900 ${
          isFlagged ? "border-l-4 border-l-warning-amber" : ""
        } ${isApproved ? "border-l-4 border-l-winning-green" : ""} ${
          isSelected ? "bg-teal/5 dark:bg-teal/10" : ""
        }`}
        style={{ x: isDragging ? swipeOffset : 0 }}
      >
        <button
          onClick={() => !isDragging && onSelect(transaction)}
          className="w-full text-left active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          style={{ minHeight: "72px" }} // Touch target minimum
        >
          <div className="flex items-center gap-3 p-4">
            {/* Merchant icon with emoji fallback */}
            <div className="flex-shrink-0 relative">
              {transaction.merchant_logo_url ? (
                <img
                  src={transaction.merchant_logo_url}
                  alt={merchantName}
                  className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100 dark:border-gray-700 shadow-sm"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getCategoryColor(
                    transaction.pfc_primary
                  )}`}
                >
                  {categoryEmoji}
                </div>
              )}
              {/* Status indicators */}
              {isFlagged && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning-amber rounded-full flex items-center justify-center shadow-sm">
                  <Flag className="w-3 h-3 text-white fill-current" />
                </div>
              )}
              {isApproved && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-winning-green rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Transaction info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-navy-dark dark:text-white truncate text-base">
                  {merchantName}
                </p>
                {hasReceipt && (
                  <ScanLine className="w-4 h-4 text-teal flex-shrink-0" />
                )}
                {hasAICategory && (
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                )}
              </div>

              {/* Category badge and time */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                    category.toUpperCase().replace(/\s+/g, "_")
                  )}`}
                >
                  {category}
                </span>
                <span className="text-xs text-gray-400">{relativeTime}</span>
                {transaction.pending && (
                  <span className="text-xs text-warning-amber font-medium">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Amount and chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <p className={`font-bold text-lg ${amountDisplay.className}`}>
                  {amountDisplay.formatted}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          {/* Additional indicators row */}
          {(transaction.review_notes || transaction.institution_name) && (
            <div className="px-4 pb-3 flex items-center gap-3 text-xs text-gray-500">
              {transaction.institution_name && (
                <span className="truncate">{transaction.institution_name}</span>
              )}
              {transaction.review_notes && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Has notes
                </span>
              )}
            </div>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// Date group header for mobile
export function TransactionDateHeader({ date }: { date: string }) {
  const dateObj = new Date(date + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (dateObj.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// Mobile transaction list with pull-to-refresh support
interface TransactionCardListProps {
  transactions: Transaction[];
  onSelect: (tx: Transaction) => void;
  onFlag?: (id: string) => void;
  onApprove?: (id: string) => void;
  receiptsMap?: Map<string, LinkedReceipt[]>;
  selectedIds?: Set<string>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function TransactionCardList({
  transactions,
  onSelect,
  onFlag,
  onApprove,
  receiptsMap,
  selectedIds,
  isLoading,
  onRefresh,
}: TransactionCardListProps) {
  // Group transactions by date
  const groupedByDate = transactions.reduce(
    (acc, tx) => {
      const date = tx.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(tx);
      return acc;
    },
    {} as Record<string, Transaction[]>
  );

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          No transactions found
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Transactions will appear here once synced
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {sortedDates.map((date) => (
        <div key={date}>
          <TransactionDateHeader date={date} />
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {groupedByDate[date].map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onSelect={onSelect}
                onFlag={onFlag}
                onApprove={onApprove}
                hasReceipt={
                  receiptsMap?.has(tx.id) &&
                  (receiptsMap.get(tx.id)?.length ?? 0) > 0
                }
                isSelected={selectedIds?.has(tx.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

