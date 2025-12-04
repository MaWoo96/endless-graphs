"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  History,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  Upload,
  ExternalLink,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { ReceiptUpload, UploadedReceipt } from "@/components/ReceiptUpload";
import { ReceiptCapture, MobileReceiptFAB } from "@/components/ReceiptCapture";
import { useEntityContext } from "@/contexts/EntityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface StoredReceipt {
  id: string;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  match_status: string;
  match_confidence: number;
  matched_transaction_id: string | null;
  ocr_confidence: number;
  storage_path: string;
  created_at: string;
}

// Transaction name lookup for display
interface TransactionInfo {
  id: string;
  name: string | null;
  merchant_name: string | null;
}

export default function ReceiptsPage() {
  const { selectedEntity, isLoading: entityLoading } = useEntityContext();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [transactionMap, setTransactionMap] = useState<Map<string, TransactionInfo>>(new Map());
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const isMobile = useIsMobile();
  const supabase = createClient();

  // Handle camera capture
  const handleCameraCapture = useCallback(async (file: File) => {
    if (!selectedEntity) return;

    setIsUploading(true);
    setShowCameraCapture(false);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityId", selectedEntity.id);

      // Upload to API
      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      // Add to receipts list
      if (result.receipt) {
        setReceipts((prev) => [
          {
            ...result.receipt,
            created_at: new Date().toISOString(),
          } as StoredReceipt,
          ...prev,
        ]);
      }

      // Switch to history tab to show the new receipt
      setActiveTab("history");
    } catch (err) {
      console.error("Upload error:", err);
      // Could show a toast notification here
    } finally {
      setIsUploading(false);
    }
  }, [selectedEntity]);

  // Load receipts when entity changes
  useEffect(() => {
    const loadReceipts = async () => {
      if (!selectedEntity) return;

      setIsLoadingReceipts(true);
      try {
        const { data, error } = await supabase
          .from("receipts")
          .select("*")
          .eq("entity_id", selectedEntity.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading receipts:", error);
        } else {
          setReceipts(data || []);

          // Fetch matched transaction info for display
          const matchedIds = (data || [])
            .filter((r: StoredReceipt) => r.matched_transaction_id)
            .map((r: StoredReceipt) => r.matched_transaction_id as string);

          if (matchedIds.length > 0) {
            const { data: txData } = await supabase
              .from("transactions")
              .select("id, name, merchant_name")
              .in("id", matchedIds);

            if (txData) {
              const map = new Map<string, TransactionInfo>();
              txData.forEach((tx: TransactionInfo) => {
                map.set(tx.id, tx);
              });
              setTransactionMap(map);
            }
          }
        }
      } catch (err) {
        console.error("Error loading receipts:", err);
      } finally {
        setIsLoadingReceipts(false);
      }
    };

    loadReceipts();
  }, [selectedEntity, supabase]);

  const handleUploadComplete = (receipt: UploadedReceipt) => {
    // Add the new receipt to the list
    setReceipts((prev) => [
      {
        ...receipt,
        created_at: new Date().toISOString(),
      } as StoredReceipt,
      ...prev,
    ]);
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case "auto_matched":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
            <CheckCircle className="h-3 w-3" />
            Matched
          </span>
        );
      case "review_required":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
            <AlertCircle className="h-3 w-3" />
            Review
          </span>
        );
      case "no_match":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
            No match
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (entityLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal animate-spin" />
      </div>
    );
  }

  // No entity selected
  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No entity selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
          Please select an entity from the sidebar to manage receipts.
        </p>
        <Link href="/graphs">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-winning-green to-teal rounded-lg">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Receipts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload and manage receipts for {selectedEntity.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-3 px-1 border-b-2 transition-colors font-medium text-sm flex items-center gap-2 ${
                activeTab === "upload"
                  ? "border-teal text-teal"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 px-1 border-b-2 transition-colors font-medium text-sm flex items-center gap-2 ${
                activeTab === "history"
                  ? "border-teal text-teal"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <History className="h-4 w-4" />
              History
              {receipts.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                  {receipts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {activeTab === "upload" ? (
          <div className="max-w-xl mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Upload a Receipt
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a receipt image or PDF. We&apos;ll extract the details and
                automatically match it to your transactions.
              </p>
            </div>

            <ReceiptUpload
              entityId={selectedEntity.id}
              tenantId={selectedEntity.tenant_id}
              onUploadComplete={handleUploadComplete}
            />

            {/* Supported formats */}
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supported Formats
              </h3>
              <div className="flex flex-wrap gap-2">
                {["JPEG", "PNG", "HEIC", "WebP", "PDF"].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-400"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search receipts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Receipts List */}
            {isLoadingReceipts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-teal animate-spin" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No receipts yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Upload your first receipt to get started
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Receipt
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Amount
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Linked Transaction
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                        Uploaded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {receipts.map((receipt) => {
                      const matchedTx = receipt.matched_transaction_id
                        ? transactionMap.get(receipt.matched_transaction_id)
                        : null;
                      const txDisplayName = matchedTx
                        ? (matchedTx.merchant_name || matchedTx.name || "Transaction")
                        : null;

                      return (
                        <tr
                          key={receipt.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {receipt.vendor || "Unknown Vendor"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  OCR: {receipt.ocr_confidence}%
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {receipt.amount
                                ? `$${receipt.amount.toFixed(2)}`
                                : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {receipt.date || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {getMatchStatusBadge(receipt.match_status)}
                          </td>
                          <td className="px-6 py-4">
                            {receipt.matched_transaction_id && txDisplayName ? (
                              <Link
                                href={`/graphs?tab=transactions`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 rounded-lg transition-colors"
                                title={`View: ${txDisplayName}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="max-w-[150px] truncate">
                                  {txDisplayName.length > 25
                                    ? txDisplayName.slice(0, 25) + "..."
                                    : txDisplayName}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-sm">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(receipt.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Camera FAB */}
      {isMobile && selectedEntity && !showCameraCapture && (
        <MobileReceiptFAB onClick={() => setShowCameraCapture(true)} />
      )}

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {showCameraCapture && (
          <ReceiptCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCameraCapture(false)}
            maxSizeKB={500}
            quality={0.8}
          />
        )}
      </AnimatePresence>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-teal animate-spin" />
            <p className="text-gray-900 dark:text-white font-medium">Uploading receipt...</p>
            <p className="text-sm text-gray-500">Processing and matching</p>
          </div>
        </div>
      )}
    </div>
  );
}
