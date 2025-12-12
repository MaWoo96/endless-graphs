"use client";

import { useMemo } from "react";
import { Building2, CreditCard, Landmark, PiggyBank, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/supabase/types";

interface AccountFilterPillsProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
  isLoading?: boolean;
}

/**
 * Get icon for account type
 */
function getAccountIcon(type: string, subtype: string | null) {
  if (type === "credit") return CreditCard;
  if (subtype === "savings") return PiggyBank;
  if (subtype === "checking") return Landmark;
  return Wallet;
}

/**
 * Get color classes for account type
 */
function getAccountColor(type: string, subtype: string | null): string {
  if (type === "credit") return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30";
  if (subtype === "savings") return "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30";
  if (subtype === "checking") return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
}

/**
 * Check if account is a liability (owes money) vs asset (has money)
 * Liabilities: credit cards, loans
 * Assets: checking, savings, investment, depository
 */
function isLiabilityAccount(type: string): boolean {
  return type === "credit" || type === "loan";
}

/**
 * Format balance for display
 */
function formatBalance(balance: number | null): string {
  if (balance === null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(balance);
}

/**
 * Get display name for account
 */
function getAccountDisplayName(account: Account): string {
  if (account.display_name) return account.display_name;
  if (account.mask) return `${account.name} ****${account.mask}`;
  return account.name;
}

export function AccountFilterPills({
  accounts,
  selectedAccountId,
  onSelectAccount,
  isLoading = false,
}: AccountFilterPillsProps) {
  // Group accounts by institution for better visual organization
  const groupedAccounts = useMemo(() => {
    const groups = new Map<string, Account[]>();
    accounts.forEach((acc) => {
      const institution = acc.institution_name || "Other";
      if (!groups.has(institution)) {
        groups.set(institution, []);
      }
      groups.get(institution)!.push(acc);
    });
    return groups;
  }, [accounts]);

  // Calculate total balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance_current || 0), 0);
  }, [accounts]);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-10 w-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-10 w-28 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return null;
  }

  // Don't show filter if only one account
  if (accounts.length === 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Account Filter Pills */}
      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin">
        {/* All Accounts pill */}
        <button
          onClick={() => onSelectAccount(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
            selectedAccountId === null
              ? "bg-navy-dark text-white border-navy-dark dark:bg-white dark:text-navy-dark dark:border-white shadow-sm"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          )}
        >
          <Wallet className="w-4 h-4" />
          <span>All Accounts</span>
          <span className="text-xs opacity-70">
            {formatBalance(totalBalance)}
          </span>
        </button>

        {/* Individual account pills */}
        {Array.from(groupedAccounts.entries()).map(([institution, accs]) =>
          accs.map((account) => {
            const Icon = getAccountIcon(account.type, account.subtype);
            const isSelected = selectedAccountId === account.plaid_account_id;
            const colorClasses = getAccountColor(account.type, account.subtype);
            const isLiability = isLiabilityAccount(account.type);

            return (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account.plaid_account_id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                  isSelected
                    ? `${colorClasses} shadow-sm ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900`
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                title={`${institution} - ${account.official_name || account.name}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {/* Asset/Liability indicator dot - green for assets, red for liabilities */}
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    isLiability
                      ? "bg-rose-500"
                      : "bg-emerald-500"
                  )}
                  title={isLiability ? "Liability" : "Asset"}
                />
                <span className="truncate max-w-[120px]">
                  {getAccountDisplayName(account)}
                </span>
                {account.balance_current !== null && (
                  <span className="text-xs opacity-70">
                    {formatBalance(account.balance_current)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Institution grouping indicator (subtle) */}
      {groupedAccounts.size > 1 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {Array.from(groupedAccounts.entries()).map(([institution, accs]) => (
            <div key={institution} className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              <span>{institution}</span>
              <span className="text-gray-400">({accs.length})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline use in table headers
 */
export function AccountFilterDropdown({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: Omit<AccountFilterPillsProps, "isLoading">) {
  if (accounts.length <= 1) {
    return null;
  }

  const selectedAccount = accounts.find(
    (a) => a.plaid_account_id === selectedAccountId
  );

  return (
    <select
      value={selectedAccountId || "all"}
      onChange={(e) =>
        onSelectAccount(e.target.value === "all" ? null : e.target.value)
      }
      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-teal/50 focus:border-teal"
    >
      <option value="all">All Accounts</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.plaid_account_id}>
          {getAccountDisplayName(account)} ({formatBalance(account.balance_current)})
        </option>
      ))}
    </select>
  );
}
