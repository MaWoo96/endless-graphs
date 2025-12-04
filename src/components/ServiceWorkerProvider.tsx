"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, RefreshCw, X } from "lucide-react";
import { useServiceWorker, useOnlineStatus } from "@/hooks/useServiceWorker";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const isOnline = useOnlineStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Show offline banner when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else {
      // Hide after a delay when coming back online
      const timer = setTimeout(() => setShowOfflineBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Show update banner when new version available
  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [updateAvailable]);

  return (
    <>
      {children}

      {/* Offline Banner */}
      <AnimatePresence>
        {showOfflineBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-warning-amber text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
          >
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              {isOnline ? "Back online!" : "You're offline. Some features may be unavailable."}
            </span>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[100] bg-navy-dark text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <RefreshCw className="w-5 h-5 flex-shrink-0 text-teal" />
            <div className="flex-1">
              <p className="text-sm font-medium">Update available</p>
              <p className="text-xs text-gray-400">
                Refresh to get the latest version
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Later
              </button>
              <button
                onClick={updateServiceWorker}
                className="px-3 py-1.5 text-sm bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
              >
                Update
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

