/**
 * Transaction Utility Functions
 * Ported from cosmos-aura-monorepo with enhancements for endless-graphs
 *
 * Provides:
 * - Category emoji icons
 * - Relative time display
 * - Merchant name normalization
 * - Transaction color coding
 * - Confidence level utilities
 */

/**
 * Get emoji icon for transaction category
 * Maps PFC (Plaid Financial Categories) to visual icons
 */
export function getCategoryEmoji(category: string | null): string {
  if (!category) return '💰';

  const categoryLower = category.toLowerCase().replace(/_/g, ' ');

  // Map of category patterns to emojis
  const categoryIcons: Record<string, string> = {
    // Income & Transfers
    'income': '💵',
    'transfer in': '💵',
    'transfer out': '💸',
    'transfer': '💸',
    'deposit': '💵',
    'withdrawal': '💸',

    // Food & Dining
    'food and drink': '🍽️',
    'food': '🍽️',
    'restaurants': '🍽️',
    'fast food': '🍔',
    'groceries': '🛒',
    'grocery': '🛒',
    'coffee': '☕',
    'coffee shops': '☕',
    'cafe': '☕',
    'bars': '🍺',
    'alcohol': '🍺',

    // Transportation
    'transportation': '🚗',
    'gas': '⛽',
    'fuel': '⛽',
    'gas station': '⛽',
    'parking': '🅿️',
    'uber': '🚕',
    'lyft': '🚕',
    'taxi': '🚕',
    'rideshare': '🚕',
    'public transit': '🚇',
    'airlines': '✈️',
    'travel': '✈️',

    // Shopping
    'shopping': '🛍️',
    'general merchandise': '🛍️',
    'online shopping': '💻',
    'clothing': '👕',
    'electronics': '📱',

    // Bills & Utilities
    'bills': '🏠',
    'utilities': '💡',
    'rent': '🏠',
    'mortgage': '🏠',
    'rent and utilities': '🏠',
    'internet': '📡',
    'phone': '📱',
    'electricity': '⚡',
    'water': '💧',

    // Financial
    'atm': '🏧',
    'bank fee': '🏦',
    'bank fees': '🏦',
    'credit card': '💳',
    'loan': '📋',
    'loan payments': '📋',
    'investment': '📈',
    'salary': '💼',
    'paycheck': '💼',
    'payroll': '💼',

    // Entertainment
    'entertainment': '🎭',
    'movies': '🎬',
    'streaming': '📺',
    'netflix': '📺',
    'spotify': '🎵',
    'music': '🎵',
    'games': '🎮',
    'sports': '⚽',
    'gym': '💪',
    'fitness': '💪',

    // Health & Medical
    'medical': '🏥',
    'healthcare': '🏥',
    'pharmacy': '💊',
    'doctor': '👨‍⚕️',
    'dental': '🦷',
    'insurance': '🛡️',

    // Personal Care
    'personal care': '💅',
    'salon': '💇',
    'spa': '💆',

    // Professional & Business
    'professional services': '👔',
    'general services': '🔧',
    'office supplies': '📎',
    'advertising': '📢',

    // Education
    'education': '📚',
    'tuition': '🎓',
    'books': '📚',

    // Government & Tax
    'government and non profit': '🏛️',
    'government': '🏛️',
    'tax': '📋',

    // Others
    'subscription': '📅',
    'charity': '❤️',
    'donation': '❤️',
    'miscellaneous': '📌',
    'other': '📌',
    'general': '📌',
    'uncategorized': '❓',
  };

  // Find matching icon (check for partial matches)
  for (const [pattern, icon] of Object.entries(categoryIcons)) {
    if (categoryLower.includes(pattern)) {
      return icon;
    }
  }

  // Specific merchant patterns
  if (categoryLower.includes('amazon')) return '📦';
  if (categoryLower.includes('walmart')) return '🛒';
  if (categoryLower.includes('target')) return '🎯';
  if (categoryLower.includes('starbucks')) return '☕';
  if (categoryLower.includes('mcdonald')) return '🍔';
  if (categoryLower.includes('subway')) return '🥪';

  // Default icon
  return '💰';
}

/**
 * Get relative time string from a date
 * Examples: "Just now", "2h ago", "3d ago", "Jan 15"
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const transactionDate = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  const diffMs = now.getTime() - transactionDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Normalize merchant name for better display
 * Removes special characters, store numbers, and standardizes format
 */
export function normalizeMerchantName(merchant: string | null): string {
  if (!merchant) return 'Unknown';

  // Special cases for common transfers and transactions
  const specialCases: Record<string, string> = {
    'PURCHASE DAY ONE JOUR': 'Day One Jour',
    'DAY ONE JOUR': 'Day One Jour',
    'PURCH RTN': 'Purchase Return',
    'ONLINE TRANSFER': 'Online Transfer',
    'TRANSFER INSTANT': 'Instant Transfer',
    'MONEY TRANSFER': 'Money Transfer',
    'E-PAYMENT': 'E-Payment',
    'ACH CREDIT': 'ACH Credit',
    'ACH DEBIT': 'ACH Debit',
    'WIRE TRANSFER': 'Wire Transfer',
    'DIRECT DEPOSIT': 'Direct Deposit',
  };

  const upperMerchant = merchant.toUpperCase();
  for (const [key, value] of Object.entries(specialCases)) {
    if (upperMerchant.includes(key)) {
      return value;
    }
  }

  return merchant
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/(INC|LLC|CORP|CO|LTD|COMPANY)$/g, '') // Remove business suffixes
    .replace(/\d{4,}/g, '') // Remove long numbers (like store numbers)
    .replace(/#\d+/g, '') // Remove reference numbers
    .replace(/\s+$/, '') // Remove trailing spaces
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
    .trim() || 'Unknown';
}

/**
 * Get abbreviation for transaction (for avatar fallbacks)
 * Examples: "OT" for Online Transfer, "AM" for Amazon
 */
export function getTransactionAbbreviation(merchant: string | null, category: string | null): string {
  if (!merchant && !category) return 'TX';

  const name = (merchant || category || '').toLowerCase();

  // Check for specific transaction types
  if (name.includes('online transfer')) return 'OT';
  if (name.includes('transfer instant')) return 'TI';
  if (name.includes('transfer')) return 'TR';
  if (name.includes('deposit')) return 'DP';
  if (name.includes('withdrawal')) return 'WD';
  if (name.includes('payment')) return 'PM';
  if (name.includes('refund')) return 'RF';
  if (name.includes('purchase')) return 'PR';

  // Get first two letters of merchant
  const cleanName = normalizeMerchantName(merchant);
  if (cleanName && cleanName !== 'Unknown') {
    const words = cleanName.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  }

  return 'TX';
}

/**
 * Get background color class for transaction type/category
 */
export function getTransactionBgColor(merchant: string | null, category: string | null): string {
  const name = (merchant || category || '').toLowerCase();

  // Specific colors for transaction types
  if (name.includes('online transfer')) return 'bg-cyan-500';
  if (name.includes('transfer instant')) return 'bg-purple-500';
  if (name.includes('refund')) return 'bg-green-500';
  if (name.includes('deposit')) return 'bg-emerald-500';
  if (name.includes('withdrawal')) return 'bg-orange-500';
  if (name.includes('payment')) return 'bg-blue-500';

  // Default colors based on category
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes('income') || cat.includes('transfer_in')) return 'bg-emerald-500';
    if (cat.includes('food')) return 'bg-orange-500';
    if (cat.includes('transport')) return 'bg-blue-500';
    if (cat.includes('shopping') || cat.includes('merchandise')) return 'bg-purple-500';
    if (cat.includes('entertainment')) return 'bg-pink-500';
    if (cat.includes('bills') || cat.includes('utilities')) return 'bg-slate-500';
    if (cat.includes('medical')) return 'bg-red-500';
    if (cat.includes('professional') || cat.includes('services')) return 'bg-violet-500';
  }

  return 'bg-gray-500';
}

/**
 * Format transaction amount for display
 */
export function formatTransactionAmount(
  amount: number,
  options: { showSign?: boolean; showCurrency?: boolean } = {}
): {
  formatted: string;
  sign: string;
  className: string;
  isIncome: boolean;
} {
  const { showSign = true, showCurrency = true } = options;
  const isIncome = amount < 0; // In Plaid, negative = income (credit)
  const absAmount = Math.abs(amount);

  const formatted = showCurrency
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(absAmount)
    : absAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

  return {
    formatted: showSign ? `${isIncome ? '+' : '-'}${formatted}` : formatted,
    sign: isIncome ? '+' : '-',
    className: isIncome ? 'text-winning-green' : 'text-navy-dark dark:text-white',
    isIncome
  };
}

/**
 * Get confidence level color class
 * Used for AI categorization confidence display
 */
export function getConfidenceColor(confidence: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (confidence >= 0.8) {
    return {
      bg: 'bg-winning-green/20',
      text: 'text-winning-green',
      label: 'High'
    };
  }
  if (confidence >= 0.6) {
    return {
      bg: 'bg-warning-amber/20',
      text: 'text-warning-amber',
      label: 'Medium'
    };
  }
  return {
    bg: 'bg-loss-red/20',
    text: 'text-loss-red',
    label: 'Low'
  };
}

/**
 * Get status color classes for transaction status
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toLowerCase()) {
    case 'pending':
      return {
        bg: 'bg-warning-amber/20',
        text: 'text-warning-amber',
        border: 'border-warning-amber/30'
      };
    case 'posted':
    case 'completed':
    case 'approved':
      return {
        bg: 'bg-winning-green/20',
        text: 'text-winning-green',
        border: 'border-winning-green/30'
      };
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return {
        bg: 'bg-loss-red/20',
        text: 'text-loss-red',
        border: 'border-loss-red/30'
      };
    case 'flagged':
      return {
        bg: 'bg-warning-amber/20',
        text: 'text-warning-amber',
        border: 'border-warning-amber/30'
      };
    default:
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500/30'
      };
  }
}

/**
 * Get date group label for transaction list
 * Examples: "Today", "Yesterday", "Monday, January 15"
 */
export function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}

/**
 * Account type badge colors
 */
export function getAccountTypeColor(accountType: string): string {
  const colors: Record<string, string> = {
    checking: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    savings: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
    credit_card: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    credit: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    investment: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    loan: 'bg-red-500/20 text-red-700 dark:text-red-300',
    depository: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  };

  return colors[accountType.toLowerCase()] || 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
}
