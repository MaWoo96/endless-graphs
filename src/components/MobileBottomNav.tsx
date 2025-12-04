"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  ScanLine,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  tab?: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/graphs",
    tab: "dashboard",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: Receipt,
    href: "/graphs",
    tab: "transactions",
  },
  {
    id: "receipts",
    label: "Receipts",
    icon: ScanLine,
    href: "/graphs/receipts",
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    href: "/reporting",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "dashboard";

  const getIsActive = (item: NavItem): boolean => {
    if (item.tab) {
      // Tab-based navigation on /graphs
      return pathname === "/graphs" && currentTab === item.tab;
    }
    // Path-based navigation
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const handleNavClick = (item: NavItem) => {
    if (item.tab) {
      router.push(`${item.href}?tab=${item.tab}`);
    } else {
      router.push(item.href);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-colors duration-200",
                "active:bg-gray-100 dark:active:bg-gray-800",
                // Touch target minimum 48px
                "min-w-[48px] min-h-[48px]"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-teal rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <Icon
                className={cn(
                  "w-6 h-6 transition-colors",
                  isActive
                    ? "text-teal"
                    : "text-gray-500 dark:text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-xs mt-1 font-medium transition-colors",
                  isActive
                    ? "text-teal"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Spacer component to prevent content from being hidden behind the nav
export function MobileBottomNavSpacer() {
  return (
    <div
      className="h-16 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    />
  );
}

