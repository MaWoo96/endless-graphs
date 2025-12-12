"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Drawer } from "vaul";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
  Calendar,
  Tag,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  MapPin,
  Globe,
  Sparkles,
  ExternalLink,
  Clock,
  Flag,
  Check,
  MessageSquare,
  Loader2,
  Download,
  CheckCircle2,
  FileText,
  Wallet,
  ScanLine,
  Link2,
  Image as ImageIcon,
  Filter,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Tag as TagType } from "@/lib/supabase/types";
import { TagPicker } from "./TagPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionCardList } from "./TransactionCard";
import {
  getCategoryEmoji,
  getRelativeTime,
  normalizeMerchantName,
  getTransactionAbbreviation,
  getTransactionBgColor,
  formatTransactionAmount,
  getConfidenceColor,
  getStatusColor,
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

interface TransactionTableProps {
  transactions: Transaction[];
  categoryFilter?: string | null;
  accountFilter?: string | null;
  onClearFilter?: () => void;
  onClearAccountFilter?: () => void;
  isLoading?: boolean;
  showRunningBalance?: boolean;
  startingBalance?: number;
  receiptsMap?: Map<string, LinkedReceipt[]>; // Map of transaction_id -> receipts
}

// All available categories for the category picker
const CATEGORIES = [
  "INCOME",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "FOOD_AND_DRINK",
  "GENERAL_MERCHANDISE",
  "TRANSPORTATION",
  "TRAVEL",
  "RENT_AND_UTILITIES",
  "ENTERTAINMENT",
  "PERSONAL_CARE",
  "GENERAL_SERVICES",
  "GOVERNMENT_AND_NON_PROFIT",
  "MEDICAL",
  "BANK_FEES",
  "LOAN_PAYMENTS",
  "OFFICE_SUPPLIES",
  "PROFESSIONAL_SERVICES",
  "ADVERTISING",
  "INSURANCE",
  "PAYROLL",
];

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

// Format currency with sign
function formatCurrencyWithSign(amount: number): string {
  const formatted = formatCurrency(amount);
  return amount < 0 ? `-${formatted}` : formatted;
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get date group label (Today, Yesterday, or date)
function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
}

// Get category from transaction
function getCategory(tx: Transaction): string {
  if (tx.coa_keywords) return tx.coa_keywords;
  if (tx.pfc_primary) return tx.pfc_primary.replace(/_/g, " ");
  if (tx.category && tx.category.length > 0) return tx.category[0];
  return "Uncategorized";
}

// Get merchant abbreviation for fallback icon
function getMerchantAbbreviation(name: string | null): string {
  if (!name) return "??";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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

// Export transactions to CSV
function exportToCSV(transactions: Transaction[]) {
  const headers = [
    "Date",
    "Merchant",
    "Category",
    "Amount",
    "Type",
    "Account",
    "Status",
    "Notes",
  ];

  const rows = transactions.map((tx) => [
    tx.date,
    tx.merchant_name || tx.name || "Unknown",
    getCategory(tx),
    tx.amount.toFixed(2),
    tx.amount < 0 ? "Income" : "Expense",
    tx.institution_name || "",
    tx.review_status || "unreviewed",
    tx.review_notes || "",
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

// Category Picker Component
function CategoryPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (category: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getCategoryColor(
            value.toUpperCase().replace(/\s+/g, "_")
          )} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {value}
          <ChevronDown className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {CATEGORIES.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={() => {
                    onChange(cat);
                    setOpen(false);
                  }}
                >
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(cat).split(" ")[0]}`}
                  />
                  {cat.replace(/_/g, " ")}
                  {value.toUpperCase().replace(/\s+/g, "_") === cat && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Bulk Actions Toolbar
function BulkActionsToolbar({
  selectedCount,
  onCategorize,
  onFlag,
  onApprove,
  onExport,
  onClearSelection,
  isProcessing,
}: {
  selectedCount: number;
  onCategorize: (category: string) => void;
  onFlag: () => void;
  onApprove: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 px-4 py-3 bg-navy-dark dark:bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-700">
        <div className="flex items-center gap-2 pr-3 border-r border-gray-600">
          <Checkbox
            checked={true}
            className="border-white data-[state=checked]:bg-teal data-[state=checked]:border-teal"
          />
          <span className="text-sm font-medium">{selectedCount} selected</span>
        </div>

        {/* Categorize */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <button
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Tag className="w-4 h-4" />
              Categorize
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="center">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {CATEGORIES.map((cat) => (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => {
                        onCategorize(cat);
                        setCategoryOpen(false);
                      }}
                    >
                      <span
                        className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(cat).split(" ")[0]}`}
                      />
                      {cat.replace(/_/g, " ")}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Flag */}
        <button
          onClick={onFlag}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <Flag className="w-4 h-4" />
          Flag
        </button>

        {/* Approve */}
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1"
        >
          <X className="w-4 h-4" />
        </button>

        {isProcessing && (
          <Loader2 className="w-4 h-4 animate-spin ml-2" />
        )}
      </div>
    </div>
  );
}

// Transaction detail panel content
function TransactionDetailContent({
  transaction,
  onUpdate,
  receipts,
}: {
  transaction: Transaction;
  onUpdate?: (updated: Transaction) => void;
  receipts?: LinkedReceipt[];
}) {
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [accountExpanded, setAccountExpanded] = useState(true);
  const [reviewNotes, setReviewNotes] = useState(transaction.review_notes || "");
  const [reviewStatus, setReviewStatus] = useState<Transaction["review_status"]>(
    transaction.review_status
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(
    !!transaction.review_notes || transaction.review_status === "flagged"
  );
  const [transactionTags, setTransactionTags] = useState<TagType[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const isIncome = transaction.amount < 0;
  const category = getCategory(transaction);
  const hasLocation = transaction.location_address || transaction.location_city;
  const hasAICategory =
    transaction.categorization_source && transaction.categorization_confidence;
  const hasPaymentDetails = transaction.payment_channel || transaction.name;
  const supabase = createClient();

  // Fetch tags for this transaction
  useEffect(() => {
    async function fetchTransactionTags() {
      setTagsLoading(true);
      try {
        const { data, error } = await supabase
          .from("transaction_tags")
          .select("tag_id, tags(*)")
          .eq("transaction_id", transaction.id);

        if (error) throw error;

        const tags = data
          ?.map((tt: { tags: TagType | TagType[] | null }) =>
            Array.isArray(tt.tags) ? tt.tags[0] : tt.tags
          )
          .filter((t): t is TagType => t !== null) || [];
        setTransactionTags(tags);
      } catch (err) {
        console.error("Failed to fetch transaction tags:", err);
      } finally {
        setTagsLoading(false);
      }
    }
    fetchTransactionTags();
  }, [supabase, transaction.id]);

  // Get formatted amount using new utility
  const amountDisplay = formatTransactionAmount(transaction.amount);
  const confidenceDisplay = hasAICategory && transaction.categorization_confidence
    ? getConfidenceColor(transaction.categorization_confidence)
    : null;

  // Save review status and notes
  const handleSaveReview = useCallback(
    async (status: Transaction["review_status"]) => {
      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            review_status: status,
            review_notes: reviewNotes || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (error) throw error;

        setReviewStatus(status);
        if (onUpdate && data) {
          onUpdate(data as Transaction);
        }

        // Sync notes to Airtable (fire and forget - don't block UI)
        if (reviewNotes && transaction.plaid_transaction_id) {
          fetch('https://plaid-sync-worker-485874813100.us-central1.run.app/api/sync-notes-to-airtable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_id: transaction.plaid_transaction_id,
              review_notes: reviewNotes,
            }),
          }).catch((syncErr) => {
            // Don't fail the main save if Airtable sync fails
            console.warn("Failed to sync notes to Airtable:", syncErr);
          });
        }
      } catch (err) {
        console.error("Failed to save review:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, transaction.id, transaction.plaid_transaction_id, reviewNotes, onUpdate]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    async (newCategory: string) => {
      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            coa_keywords: newCategory.replace(/_/g, " "),
            categorization_source: "manual",
            categorized_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (error) throw error;

        if (onUpdate && data) {
          onUpdate(data as Transaction);
        }
      } catch (err) {
        console.error("Failed to update category:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, transaction.id, onUpdate]
  );

  // Toggle flag status
  const handleToggleFlag = useCallback(() => {
    const newStatus = reviewStatus === "flagged" ? null : "flagged";
    handleSaveReview(newStatus);
    if (newStatus === "flagged") {
      setShowNotes(true);
    }
  }, [reviewStatus, handleSaveReview]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with merchant info - glass morphism style */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 glass-panel">
        <div className="flex items-center gap-4">
          {/* Merchant logo or fallback with emoji */}
          {transaction.merchant_logo_url ? (
            <img
              src={transaction.merchant_logo_url}
              alt={transaction.merchant_name || "Merchant"}
              className="w-14 h-14 rounded-xl object-contain bg-white dark:bg-gray-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${getTransactionBgColor(
                transaction.merchant_name,
                transaction.pfc_primary
              )}/20`}
            >
              {getCategoryEmoji(category)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-navy-dark dark:text-white truncate">
              {normalizeMerchantName(transaction.merchant_name || transaction.name)}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {transaction.institution_name && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.institution_name}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {getRelativeTime(transaction.date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Amount display */}
        <div className="text-center py-4">
          <p
            className={`text-4xl font-bold ${
              isIncome ? "text-winning-green" : "text-navy-dark dark:text-white"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {transaction.pending && (
              <Badge className="bg-warning-amber/20 text-warning-amber border-0">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
            {/* Inline category picker */}
            <CategoryPicker
              value={category}
              onChange={handleCategoryChange}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Transaction timeline */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              Transaction Date
            </div>
            <span className="font-medium text-navy-dark dark:text-white">
              {formatDate(transaction.date)}
            </span>
          </div>
          {transaction.authorized_date &&
            transaction.authorized_date !== transaction.date && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  Authorized Date
                </div>
                <span className="font-medium text-navy-dark dark:text-white">
                  {formatDate(transaction.authorized_date)}
                </span>
              </div>
            )}
        </div>

        {/* AI Categorization info - enhanced with confidence color */}
        {hasAICategory && confidenceDisplay && (
          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 glass-card-light">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                AI Categorization
              </span>
              <Badge className={`${confidenceDisplay.bg} ${confidenceDisplay.text} text-xs border-0 ml-auto`}>
                {Math.round((transaction.categorization_confidence || 0) * 100)}% • {confidenceDisplay.label}
              </Badge>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Source:{" "}
              <span className="capitalize">
                {transaction.categorization_source?.replace("_", " ")}
              </span>
            </p>
            {transaction.pfc_detailed && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Detailed: {transaction.pfc_detailed.replace(/_/g, " ")}
              </p>
            )}
          </div>
        )}

        {/* Account Info - Collapsible */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden glass-card-light">
          <button
            onClick={() => setAccountExpanded(!accountExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Wallet className="w-4 h-4" />
              <span className="font-medium">Account Information</span>
            </div>
            {accountExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {accountExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="w-4 h-4" />
                  Institution
                </div>
                <span className="font-medium text-navy-dark dark:text-white">
                  {transaction.institution_name || "Unknown"}
                </span>
              </div>
              {transaction.payment_channel && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </div>
                  <span className="font-medium text-navy-dark dark:text-white capitalize">
                    {transaction.payment_channel}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Details - Collapsible */}
        {hasPaymentDetails && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden glass-card-light">
            <button
              onClick={() => setPaymentExpanded(!paymentExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Payment Details</span>
              </div>
              {paymentExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {paymentExpanded && (
              <div className="px-4 pb-4 space-y-2 text-sm">
                {transaction.name && transaction.name !== transaction.merchant_name && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500 mb-1">Bank Description</div>
                    <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{transaction.name}</div>
                  </div>
                )}
                {transaction.payment_channel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Channel</span>
                    <span className="capitalize">{transaction.payment_channel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location (collapsible) */}
        {hasLocation && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setLocationExpanded(!locationExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Location</span>
              </div>
              {locationExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {locationExpanded && (
              <div className="px-4 pb-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {transaction.location_address && <p>{transaction.location_address}</p>}
                <p>
                  {[
                    transaction.location_city,
                    transaction.location_region,
                    transaction.location_postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {transaction.location_store_number && (
                  <p className="text-gray-500">
                    Store #{transaction.location_store_number}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Merchant website */}
        {transaction.merchant_website && (
          <a
            href={transaction.merchant_website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal hover:text-teal/80 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {transaction.merchant_website
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, "")}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Description */}
        {transaction.name && transaction.name !== transaction.merchant_name && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {transaction.name}
            </p>
          </div>
        )}

        {/* Receipts Section */}
        {receipts && receipts.length > 0 && (
          <div className="bg-teal/5 border border-teal/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ScanLine className="w-4 h-4 text-teal" />
              <h4 className="text-sm font-semibold text-teal">
                {receipts.length === 1 ? "Attached Receipt" : `${receipts.length} Attached Receipts`}
              </h4>
            </div>
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {receipt.vendor || "Unknown Vendor"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {receipt.date || "No date"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {receipt.amount ? `$${receipt.amount.toFixed(2)}` : "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        OCR: {receipt.ocr_confidence}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      receipt.match_status === "auto_matched"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : receipt.match_status === "review_required"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}>
                      {receipt.match_status === "auto_matched" && <CheckCircle2 className="w-3 h-3" />}
                      {receipt.match_status === "auto_matched" ? "Auto-matched" :
                       receipt.match_status === "review_required" ? "Review needed" :
                       receipt.match_status}
                      {receipt.match_confidence > 0 && ` (${receipt.match_confidence}%)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookkeeper Notes Section (read-only, from Airtable) */}
        {transaction.bookkeeper_notes && (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Bookkeeper Notes
              </h4>
            </div>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 whitespace-pre-wrap">
              {transaction.bookkeeper_notes}
            </p>
          </div>
        )}

        {/* Tags Section */}
        {transaction.tenant_id && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tags
              </h4>
              {tagsLoading && (
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              )}
            </div>
            {!tagsLoading && (
              <TagPicker
                transactionId={transaction.id}
                tenantId={transaction.tenant_id}
                selectedTags={transactionTags}
                onTagsChange={setTransactionTags}
              />
            )}
          </div>
        )}

        {/* Review Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Notes
            </h4>
            <div className="flex items-center gap-2">
              {/* Flag button */}
              <button
                onClick={handleToggleFlag}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  reviewStatus === "flagged"
                    ? "bg-warning-amber/20 text-warning-amber"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Flag
                    className={`w-4 h-4 ${reviewStatus === "flagged" ? "fill-current" : ""}`}
                  />
                )}
                {reviewStatus === "flagged" ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Review status badge */}
          {reviewStatus && (
            <div className="mb-4">
              <Badge
                className={`${
                  reviewStatus === "flagged"
                    ? "bg-warning-amber/20 text-warning-amber border-warning-amber/30"
                    : reviewStatus === "approved"
                    ? "bg-winning-green/20 text-winning-green border-winning-green/30"
                    : "bg-loss-red/20 text-loss-red border-loss-red/30"
                }`}
              >
                {reviewStatus === "flagged" && <Flag className="w-3 h-3 mr-1" />}
                {reviewStatus === "approved" && <Check className="w-3 h-3 mr-1" />}
                {reviewStatus === "rejected" && <X className="w-3 h-3 mr-1" />}
                {reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1)}
              </Badge>
              {transaction.reviewed_at && (
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(transaction.reviewed_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Notes toggle */}
          {!showNotes && (
            <button
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-2 text-sm text-teal hover:text-teal/80 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Add notes
            </button>
          )}

          {/* Notes textarea */}
          {showNotes && (
            <div className="space-y-3">
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your personal notes about this transaction..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                {reviewNotes !== (transaction.review_notes || "") && (
                  <button
                    onClick={() => handleSaveReview(reviewStatus)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Transaction row component with checkbox and running balance
function TransactionRow({
  transaction,
  runningBalance,
  showBalance,
  isSelected,
  onSelect,
  onToggleSelect,
  onCategoryChange,
  isFocused,
  hasReceipt,
}: {
  transaction: Transaction;
  runningBalance?: number;
  showBalance?: boolean;
  isSelected: boolean;
  onSelect: (tx: Transaction) => void;
  onToggleSelect: (id: string) => void;
  onCategoryChange: (id: string, category: string) => void;
  isFocused: boolean;
  hasReceipt?: boolean;
}) {
  const category = getCategory(transaction);
  const hasAICategory =
    transaction.categorization_source && transaction.categorization_confidence;
  const isFlagged = transaction.review_status === "flagged";
  const isApproved = transaction.review_status === "approved";

  // Use new utilities
  const amountDisplay = formatTransactionAmount(transaction.amount);
  const categoryEmoji = getCategoryEmoji(category);
  const relativeTime = getRelativeTime(transaction.date);
  const merchantName = normalizeMerchantName(transaction.merchant_name || transaction.name);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
        isFlagged ? "bg-warning-amber/5" : ""
      } ${isSelected ? "bg-teal/5 dark:bg-teal/10" : ""} ${
        isFocused ? "ring-2 ring-inset ring-teal" : ""
      }`}
      onClick={() => onSelect(transaction)}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(transaction.id);
        }}
      >
        <Checkbox
          checked={isSelected}
          className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-teal data-[state=checked]:border-teal"
        />
      </div>

      {/* Merchant icon with emoji fallback */}
      <div className="flex-shrink-0 relative">
        {transaction.merchant_logo_url ? (
          <img
            src={transaction.merchant_logo_url}
            alt={merchantName}
            className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100 dark:border-gray-700 shadow-sm"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getCategoryColor(
              transaction.pfc_primary
            )}`}
          >
            {categoryEmoji}
          </div>
        )}
        {/* Status indicators with glow */}
        {isFlagged && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning-amber rounded-full flex items-center justify-center glow-amber">
            <Flag className="w-2.5 h-2.5 text-white fill-current" />
          </div>
        )}
        {isApproved && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-winning-green rounded-full flex items-center justify-center glow-emerald">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Transaction info */}
      <div className="flex-1 min-w-0 max-w-[300px]">
        <div className="flex items-center gap-2">
          <p className="font-medium text-navy-dark dark:text-white truncate max-w-[200px]" title={merchantName}>
            {merchantName.length > 30 ? `${merchantName.slice(0, 30)}...` : merchantName}
          </p>
          {hasReceipt && (
            <span
              title="Receipt attached"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal/10 text-teal rounded text-xs font-medium"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Receipt</span>
            </span>
          )}
          {hasAICategory && (
            <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
          )}
          {transaction.pending && (
            <span className="w-2 h-2 rounded-full bg-warning-amber glow-amber glow-pulse flex-shrink-0" />
          )}
          {transaction.bookkeeper_notes && (
            <span title="Bookkeeper notes">
              <BookOpen className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            </span>
          )}
          {transaction.review_notes && (
            <span title="Your notes">
              <MessageSquare className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </span>
          )}
        </div>
        {/* Category with emoji and relative time */}
        <div className="flex items-center gap-2 mt-0.5">
          <div onClick={(e) => e.stopPropagation()}>
            <CategoryPicker
              value={category}
              onChange={(cat) => onCategoryChange(transaction.id, cat)}
            />
          </div>
          <span className="text-xs text-gray-400">{relativeTime}</span>
        </div>
      </div>

      {/* Amount - green for income (negative in Plaid), red for expenses (positive in Plaid) */}
      <div className="flex-shrink-0 text-right min-w-[90px]">
        <p className={`font-semibold ${transaction.amount < 0 ? "text-winning-green" : "text-loss-red"}`}>
          {transaction.amount < 0 ? "+" : "-"}{formatCurrency(transaction.amount)}
        </p>
      </div>

      {/* Running Balance - neutral color unless negative */}
      {showBalance && runningBalance !== undefined && (
        <div className="flex-shrink-0 text-right min-w-[100px]">
          <p
            className={`text-sm font-medium ${
              runningBalance < 0
                ? "text-loss-red"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {formatCurrencyWithSign(runningBalance)}
          </p>
        </div>
      )}
    </div>
  );
}

// Group transactions by date
function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const dateKey = tx.date;
    const existing = groups.get(dateKey) || [];
    existing.push(tx);
    groups.set(dateKey, existing);
  });

  return groups;
}

export function TransactionTable({
  transactions,
  categoryFilter,
  accountFilter,
  onClearFilter,
  onClearAccountFilter,
  isLoading,
  showRunningBalance = true,
  startingBalance = 0,
  receiptsMap,
}: TransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(
    null
  );
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const pageSize = 50;
  const supabase = createClient();
  
  // Mobile detection for adaptive rendering
  const isMobile = useIsMobile();

  // Keep local state in sync with props
  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const filteredTxs = filteredTransactions;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredTxs.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          if (focusedIndex >= 0 && focusedIndex < filteredTxs.length) {
            setSelectedTransaction(filteredTxs[focusedIndex]);
          }
          break;
        case "Escape":
          setSelectedTransaction(null);
          setSelectedIds(new Set());
          break;
        case " ": // Space to toggle selection
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredTxs.length) {
            const tx = filteredTxs[focusedIndex];
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(tx.id)) {
                next.delete(tx.id);
              } else {
                next.add(tx.id);
              }
              return next;
            });
          }
          break;
        case "/":
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder="Search transactions..."]'
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex]);

  // Handle transaction update from drawer
  const handleTransactionUpdate = useCallback((updated: Transaction) => {
    setLocalTransactions((prev) =>
      prev.map((tx) => (tx.id === updated.id ? updated : tx))
    );
    setSelectedTransaction(updated);
  }, []);

  // Handle inline category change
  const handleCategoryChange = useCallback(
    async (id: string, category: string) => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            coa_keywords: category.replace(/_/g, " "),
            categorization_source: "manual",
            categorized_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setLocalTransactions((prev) =>
            prev.map((tx) => (tx.id === id ? (data as Transaction) : tx))
          );
        }
      } catch (err) {
        console.error("Failed to update category:", err);
      }
    },
    [supabase]
  );

  // Bulk actions
  const handleBulkCategorize = useCallback(
    async (category: string) => {
      setIsProcessing(true);
      try {
        const ids = Array.from(selectedIds);
        const { data, error } = await supabase
          .from("transactions")
          .update({
            coa_keywords: category.replace(/_/g, " "),
            categorization_source: "manual_bulk",
            categorized_at: new Date().toISOString(),
          })
          .in("id", ids)
          .select();

        if (error) throw error;

        if (data) {
          setLocalTransactions((prev) =>
            prev.map((tx) => {
              const updated = data.find((d) => d.id === tx.id);
              return updated ? (updated as Transaction) : tx;
            })
          );
        }
        setSelectedIds(new Set());
      } catch (err) {
        console.error("Failed to bulk categorize:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, supabase]
  );

  const handleBulkFlag = useCallback(async () => {
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const { data, error } = await supabase
        .from("transactions")
        .update({
          review_status: "flagged",
          reviewed_at: new Date().toISOString(),
        })
        .in("id", ids)
        .select();

      if (error) throw error;

      if (data) {
        setLocalTransactions((prev) =>
          prev.map((tx) => {
            const updated = data.find((d) => d.id === tx.id);
            return updated ? (updated as Transaction) : tx;
          })
        );
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to bulk flag:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, supabase]);

  const handleBulkApprove = useCallback(async () => {
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const { data, error } = await supabase
        .from("transactions")
        .update({
          review_status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .in("id", ids)
        .select();

      if (error) throw error;

      if (data) {
        setLocalTransactions((prev) =>
          prev.map((tx) => {
            const updated = data.find((d) => d.id === tx.id);
            return updated ? (updated as Transaction) : tx;
          })
        );
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to bulk approve:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, supabase]);

  const handleBulkExport = useCallback(() => {
    const selectedTxs = localTransactions.filter((tx) => selectedIds.has(tx.id));
    exportToCSV(selectedTxs);
    setSelectedIds(new Set());
  }, [selectedIds, localTransactions]);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all visible
  const selectAllVisible = useCallback(() => {
    const visibleIds = paginatedTransactions.map((tx) => tx.id);
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      } else {
        return new Set([...prev, ...visibleIds]);
      }
    });
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = localTransactions;

    // Apply account filter
    if (accountFilter) {
      result = result.filter((tx) => tx.account_id === accountFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter((tx) => {
        const cat = getCategory(tx).toLowerCase();
        return cat.includes(categoryFilter.toLowerCase());
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.merchant_name?.toLowerCase().includes(query) ||
          tx.name?.toLowerCase().includes(query) ||
          getCategory(tx).toLowerCase().includes(query) ||
          tx.amount.toString().includes(query)
      );
    }

    // Sort by date descending
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [localTransactions, categoryFilter, accountFilter, searchQuery]);

  // Calculate running balances starting from current balance, working backwards
  // This shows what the balance was AFTER each transaction
  const transactionsWithBalance = useMemo(() => {
    if (!showRunningBalance) return filteredTransactions.map((tx) => ({ tx, balance: 0 }));

    // Transactions are already sorted descending (newest first)
    // Start from current balance and work backwards
    let balance = startingBalance;
    const withBalance = filteredTransactions.map((tx) => {
      // This balance is AFTER this transaction
      const balanceAfterTx = balance;
      // In Plaid, negative amounts are credits (income), positive are debits (expenses)
      // To get balance BEFORE this tx, we reverse the transaction effect
      balance = balance + tx.amount; // Add back because we're going backwards
      return { tx, balance: balanceAfterTx };
    });

    return withBalance;
  }, [filteredTransactions, showRunningBalance, startingBalance]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const paginatedWithBalance = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactionsWithBalance.slice(start, start + pageSize);
  }, [transactionsWithBalance, currentPage, pageSize]);

  // Group by date
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(paginatedTransactions),
    [paginatedTransactions]
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setFocusedIndex(-1);
  }, [categoryFilter, accountFilter, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const expenses = filteredTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  // Check if all visible are selected
  const allVisibleSelected = useMemo(() => {
    if (paginatedTransactions.length === 0) return false;
    return paginatedTransactions.every((tx) => selectedIds.has(tx.id));
  }, [paginatedTransactions, selectedIds]);

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

  // Mobile flag/approve handlers for swipe actions
  const handleMobileFlag = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          review_status: "flagged",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLocalTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? (data as Transaction) : tx))
        );
      }
    } catch (err) {
      console.error("Failed to flag transaction:", err);
    }
  }, [supabase]);

  const handleMobileApprove = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          review_status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLocalTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? (data as Transaction) : tx))
        );
      }
    } catch (err) {
      console.error("Failed to approve transaction:", err);
    }
  }, [supabase]);

  // Mobile-optimized view
  if (isMobile) {
    return (
      <>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Mobile Header - Compact search and stats */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
              />
            </div>

            {/* Filter badge and stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {categoryFilter && (
                  <Badge className="bg-teal/10 text-teal border-teal/20 gap-1 text-xs">
                    <Tag className="h-3 w-3" />
                    {categoryFilter}
                    <button
                      onClick={onClearFilter}
                      className="ml-0.5 hover:bg-teal/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <span className="text-xs text-gray-500">
                  {filteredTransactions.length} items
                </span>
              </div>
              
              {/* Compact stats */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-winning-green font-semibold">
                  +{formatCurrency(totals.income)}
                </span>
                <span className="text-loss-red font-semibold">
                  -{formatCurrency(totals.expenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Transaction Card List */}
          <TransactionCardList
            transactions={paginatedTransactions}
            onSelect={setSelectedTransaction}
            onFlag={handleMobileFlag}
            onApprove={handleMobileApprove}
            receiptsMap={receiptsMap}
            selectedIds={selectedIds}
            isLoading={isLoading}
          />

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile swipe hint */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 text-center">
            Swipe left to flag • Swipe right to approve • Tap for details
          </div>
        </div>

        {/* Transaction Detail Drawer - Mobile optimized */}
        <Drawer.Root
          open={selectedTransaction !== null}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[90vh] flex-col rounded-t-2xl bg-white dark:bg-gray-900">
              <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700" />
              {selectedTransaction && (
                <TransactionDetailContent
                  transaction={selectedTransaction}
                  onUpdate={handleTransactionUpdate}
                  receipts={receiptsMap?.get(selectedTransaction.id)}
                />
              )}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    );
  }

  // Desktop view (original)
  return (
    <>
      <div
        ref={tableRef}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Header with search and filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
              />
            </div>

            {/* Active filter badge */}
            {categoryFilter && (
              <div className="flex items-center gap-2">
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
              </div>
            )}

            {/* Summary stats & Export */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                {filteredTransactions.length} transactions
              </span>
              <span className="text-winning-green font-medium">
                +{formatCurrency(totals.income)}
              </span>
              <span className="text-loss-red font-medium">
                -{formatCurrency(totals.expenses)}
              </span>
              <button
                onClick={() => exportToCSV(filteredTransactions)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table header with select all and balance column */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="flex-shrink-0">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={selectAllVisible}
              className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-teal data-[state=checked]:border-teal"
            />
          </div>
          <div className="w-10" /> {/* Spacer for icon */}
          <div className="flex-1">Transaction</div>
          <div className="flex-shrink-0 text-right w-24">Amount</div>
          {showRunningBalance && (
            <div className="flex-shrink-0 text-right w-28">Balance</div>
          )}
        </div>

        {/* Transaction list grouped by date */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery || categoryFilter
                ? "No transactions match your filters"
                : "No transactions found"}
            </div>
          ) : (
            Array.from(groupedTransactions.entries()).map(([date, txs]) => (
              <div key={date}>
                {/* Date header - z-index lower than sidebar (z-50) but above content */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-[5]">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {getDateGroupLabel(date)}
                  </span>
                </div>
                {/* Transactions for this date */}
                {txs.map((tx, idx) => {
                  const globalIndex = filteredTransactions.findIndex(
                    (t) => t.id === tx.id
                  );
                  const balanceEntry = paginatedWithBalance.find(
                    (e) => e.tx.id === tx.id
                  );
                  const txReceipts = receiptsMap?.get(tx.id);
                  return (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      runningBalance={balanceEntry?.balance}
                      showBalance={showRunningBalance}
                      isSelected={selectedIds.has(tx.id)}
                      onSelect={setSelectedTransaction}
                      onToggleSelect={toggleSelect}
                      onCategoryChange={handleCategoryChange}
                      isFocused={globalIndex === focusedIndex}
                      hasReceipt={!!txReceipts && txReceipts.length > 0}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
              Space
            </kbd>{" "}
            Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
              Enter
            </kbd>{" "}
            Open
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]">
              /
            </kbd>{" "}
            Search
          </span>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onCategorize={handleBulkCategorize}
        onFlag={handleBulkFlag}
        onApprove={handleBulkApprove}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds(new Set())}
        isProcessing={isProcessing}
      />

      {/* Transaction Detail Drawer - using vaul */}
      <Drawer.Root
        open={selectedTransaction !== null}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-2xl bg-white dark:bg-gray-900 md:left-auto md:right-0 md:top-0 md:mt-0 md:h-full md:w-[480px] md:rounded-none md:rounded-l-2xl">
            <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 md:hidden" />
            {selectedTransaction && (
              <TransactionDetailContent
                transaction={selectedTransaction}
                onUpdate={handleTransactionUpdate}
                receipts={receiptsMap?.get(selectedTransaction.id)}
              />
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
