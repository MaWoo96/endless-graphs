"use client";

import { Receipt, Upload, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export default function ReceiptsPage() {
  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-navy-dark transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-winning-green to-teal rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy-dark">Receipts</h1>
                <p className="text-sm text-text-muted">Upload & manage receipts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Coming Soon Icon */}
          <div className="w-24 h-24 rounded-full bg-teal/10 flex items-center justify-center mb-8">
            <Clock className="w-12 h-12 text-teal" />
          </div>

          <h2 className="text-3xl font-bold text-navy-dark mb-4">Coming Soon</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Receipt upload and management is currently in development. Soon you&apos;ll be able to
            upload, categorize, and track all your business receipts in one place.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Upload className="w-8 h-8 text-teal mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Easy Upload</h3>
              <p className="text-sm text-gray-500">Drag & drop or snap photos of receipts</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Receipt className="w-8 h-8 text-teal mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Auto-Categorize</h3>
              <p className="text-sm text-gray-500">AI-powered expense categorization</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Clock className="w-8 h-8 text-teal mb-3" />
              <h3 className="font-semibold text-navy-dark mb-2">Track History</h3>
              <p className="text-sm text-gray-500">Full receipt history & search</p>
            </div>
          </div>

          {/* Back Button */}
          <Link
            href="/"
            className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-navy-dark text-white rounded-xl font-medium hover:bg-navy-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </Link>
        </div>
      </main>
    </div>
  );
}
