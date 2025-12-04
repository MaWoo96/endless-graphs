"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-gray-950 p-6">
      <div className="text-center max-w-md">
        {/* Offline icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-navy-dark dark:text-white mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you've lost your internet connection. Some features may
          be unavailable until you're back online.
        </p>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white rounded-full font-semibold hover:bg-teal/90 active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        {/* Cached data info */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          Your previously viewed data may still be available.
          <br />
          We'll sync any changes when you're back online.
        </p>
      </div>
    </div>
  );
}

