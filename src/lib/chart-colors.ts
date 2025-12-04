/**
 * Unified Chart Color Palette
 *
 * This is the single source of truth for all chart colors in the application.
 * These colors are WCAG AA compliant and colorblind-safe.
 *
 * The palette is designed to work in both light and dark modes.
 * Dark mode versions are slightly lighter for better visibility on dark backgrounds.
 */

// Light mode chart colors
export const CHART_COLORS = {
  // Primary data series colors
  indigo: "#6366F1",
  rose: "#F43F5E",
  emerald: "#10B981",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  cyan: "#06B6D4",
  pink: "#EC4899",
  teal: "#14B8A6",
  orange: "#F97316",
  blue: "#3B82F6",
  lime: "#84CC16",
  fuchsia: "#D946EF",
} as const;

// Dark mode chart colors (slightly lighter)
export const CHART_COLORS_DARK = {
  indigo: "#818CF8",
  rose: "#FB7185",
  emerald: "#34D399",
  violet: "#A78BFA",
  amber: "#FBBF24",
  cyan: "#22D3EE",
  pink: "#F472B6",
  teal: "#2DD4BF",
  orange: "#FB923C",
  blue: "#60A5FA",
  lime: "#A3E635",
  fuchsia: "#E879F9",
} as const;

// Ordered array for sequential data series
export const CHART_COLOR_SEQUENCE = [
  CHART_COLORS.indigo,
  CHART_COLORS.rose,
  CHART_COLORS.emerald,
  CHART_COLORS.violet,
  CHART_COLORS.amber,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.blue,
  CHART_COLORS.lime,
  CHART_COLORS.fuchsia,
] as const;

export const CHART_COLOR_SEQUENCE_DARK = [
  CHART_COLORS_DARK.indigo,
  CHART_COLORS_DARK.rose,
  CHART_COLORS_DARK.emerald,
  CHART_COLORS_DARK.violet,
  CHART_COLORS_DARK.amber,
  CHART_COLORS_DARK.cyan,
  CHART_COLORS_DARK.pink,
  CHART_COLORS_DARK.teal,
  CHART_COLORS_DARK.orange,
  CHART_COLORS_DARK.blue,
  CHART_COLORS_DARK.lime,
  CHART_COLORS_DARK.fuchsia,
] as const;

// Semantic colors for financial data
export const FINANCIAL_COLORS = {
  income: "#6366F1",      // Indigo - for revenue/income
  expenses: "#F43F5E",    // Rose - for expenses
  profit: "#10B981",      // Emerald - for profit/positive
  loss: "#EF4444",        // Red - for loss/negative
  pending: "#F59E0B",     // Amber - for pending/warning
  neutral: "#3B82F6",     // Blue - for neutral/info
} as const;

export const FINANCIAL_COLORS_DARK = {
  income: "#818CF8",
  expenses: "#FB7185",
  profit: "#34D399",
  loss: "#F87171",
  pending: "#FBBF24",
  neutral: "#60A5FA",
} as const;

// Chart axis and grid colors
export const CHART_AXIS_COLORS = {
  light: {
    label: "#6B7280",       // Gray-500
    tick: "#D1D5DB",        // Gray-300
    grid: "#E5E7EB",        // Gray-200
    gridOpacity: 0.5,
  },
  dark: {
    label: "#9CA3AF",       // Gray-400
    tick: "#4B5563",        // Gray-600
    grid: "#374151",        // Gray-700
    gridOpacity: 0.3,
  },
} as const;

// Tooltip colors
export const TOOLTIP_COLORS = {
  light: {
    background: "#FFFFFF",
    border: "#E5E7EB",
    text: "#1E1A2A",
    textMuted: "#6B7280",
  },
  dark: {
    background: "#1E293B",
    border: "#334155",
    text: "#F9FAFB",
    textMuted: "#9CA3AF",
  },
} as const;

/**
 * Get chart color by index (wraps around if index > 12)
 */
export function getChartColor(index: number, isDark = false): string {
  const colors = isDark ? CHART_COLOR_SEQUENCE_DARK : CHART_COLOR_SEQUENCE;
  return colors[index % colors.length];
}

/**
 * Get semantic financial color
 */
export function getFinancialColor(
  type: keyof typeof FINANCIAL_COLORS,
  isDark = false
): string {
  return isDark ? FINANCIAL_COLORS_DARK[type] : FINANCIAL_COLORS[type];
}
