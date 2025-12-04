"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ReceiptUploadProps {
  entityId: string;
  tenantId: string;
  onUploadComplete?: (receipt: UploadedReceipt) => void;
}

export interface UploadedReceipt {
  id: string;
  vendor: string | null;
  amount: number | null;
  date: string | null;
  match_status: "auto_matched" | "review_required" | "no_match" | "pending";
  match_confidence: number;
  matched_transaction_id: string | null;
  ocr_confidence: number;
  storage_path: string;
  image_url: string;
}

type UploadState = "idle" | "uploading" | "processing" | "success" | "error";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ReceiptUpload({
  entityId,
  tenantId,
  onUploadComplete,
}: ReceiptUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadedReceipt, setUploadedReceipt] = useState<UploadedReceipt | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Please upload JPEG, PNG, HEIC, WebP, or PDF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const uploadReceipt = async (file: File) => {
    setUploadState("uploading");
    setError(null);

    try {
      // Get session for auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      setUploadState("processing");

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity_id", entityId);
      formData.append("tenant_id", tenantId);

      // Upload via our API route (proxies to worker)
      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success" && data.receipt) {
        setUploadedReceipt(data.receipt);
        setUploadState("success");
        onUploadComplete?.(data.receipt);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        setSelectedFile(file);
        setError(null);
      }
    },
    []
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        setSelectedFile(file);
        setError(null);
      }
    },
    []
  );

  const handleUploadClick = () => {
    if (selectedFile) {
      uploadReceipt(selectedFile);
    }
  };

  const handleReset = () => {
    setUploadState("idle");
    setUploadedReceipt(null);
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMatchStatusBadge = (status: string, confidence: number) => {
    switch (status) {
      case "auto_matched":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="h-3 w-3" />
            Auto-matched ({confidence}%)
          </span>
        );
      case "review_required":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <AlertCircle className="h-3 w-3" />
            Review needed ({confidence}%)
          </span>
        );
      case "no_match":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            No match found
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            Pending
          </span>
        );
    }
  };

  // Success state
  if (uploadState === "success" && uploadedReceipt) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-dark">Receipt Uploaded</h3>
            <p className="text-sm text-gray-500">
              OCR Confidence: {uploadedReceipt.ocr_confidence}%
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Vendor</span>
              <p className="font-medium text-navy-dark">
                {uploadedReceipt.vendor || "Unknown"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Amount</span>
              <p className="font-medium text-navy-dark">
                {uploadedReceipt.amount
                  ? `$${uploadedReceipt.amount.toFixed(2)}`
                  : "Unknown"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Date</span>
              <p className="font-medium text-navy-dark">
                {uploadedReceipt.date || "Unknown"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Match Status</span>
              <div className="mt-1">
                {getMatchStatusBadge(
                  uploadedReceipt.match_status,
                  uploadedReceipt.match_confidence
                )}
              </div>
            </div>
          </div>

          {uploadedReceipt.matched_transaction_id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Link2 className="h-4 w-4" />
                <span>Linked to transaction</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReset} className="flex-1">
            Upload Another
          </Button>
          {uploadedReceipt.image_url && (
            <Button
              variant="outline"
              onClick={() => window.open(uploadedReceipt.image_url, "_blank")}
            >
              View Receipt
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Upload/Processing state
  if (uploadState === "uploading" || uploadState === "processing") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-12 w-12 text-teal animate-spin mb-4" />
          <h3 className="font-semibold text-navy-dark mb-2">
            {uploadState === "uploading" ? "Uploading..." : "Processing Receipt..."}
          </h3>
          <p className="text-sm text-gray-500">
            {uploadState === "uploading"
              ? "Uploading your receipt"
              : "Running OCR and matching to transactions"}
          </p>
        </div>
      </div>
    );
  }

  // Idle/Error state with drag-drop zone
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        id="receipt-upload"
      />

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
          dragActive
            ? "border-teal bg-teal/5"
            : selectedFile
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-teal hover:bg-gray-50"
        )}
      >
        {selectedFile ? (
          <div className="flex items-center gap-4">
            {getFileIcon(selectedFile)}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy-dark truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-teal/10 rounded-full mb-4">
              <Upload className="h-8 w-8 text-teal" />
            </div>
            <p className="font-medium text-navy-dark mb-1">
              Drop your receipt here
            </p>
            <p className="text-sm text-gray-500 mb-2">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400">
              JPEG, PNG, HEIC, WebP, or PDF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button
          onClick={handleUploadClick}
          disabled={uploadState !== "idle"}
          className="w-full mt-4 bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload & Process Receipt
        </Button>
      )}
    </div>
  );
}
