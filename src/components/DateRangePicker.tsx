"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";

export type DateRangeOption =
  | "ytd_parent"
  | "qtd"
  | "mtd"
  | "last_month"
  | "last_week"
  | "current_week"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "6m"
  | "12m"
  | "custom";

interface CustomDateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value?: DateRangeOption;
  onChange?: (value: DateRangeOption, customRange?: CustomDateRange) => void;
  readOnly?: boolean;
  variant?: "default" | "glass";
  showPeriodPresets?: boolean;
}

const standardOptions: { value: DateRangeOption; label: string }[] = [
  { value: "ytd_parent", label: "YTD by Parent" },
  { value: "qtd", label: "QTD" },
  { value: "mtd", label: "MTD" },
  { value: "last_month", label: "Last Month" },
  { value: "last_week", label: "Last Week" },
  { value: "current_week", label: "Current Week" },
  { value: "custom", label: "Custom Date Range" },
];

const periodOptions: { value: DateRangeOption; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "6m", label: "Last 6 Months" },
  { value: "12m", label: "Last 12 Months" },
  { value: "custom", label: "Custom Range" },
];

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DateRangePicker({
  value = "ytd_parent",
  onChange,
  readOnly = true,
  variant = "default",
  showPeriodPresets = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<DateRangeOption>(value);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: "",
    endDate: ""
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = showPeriodPresets ? periodOptions : standardOptions;

  const getDisplayLabel = () => {
    if (selected === "custom" && customRange.startDate && customRange.endDate) {
      return `${formatDateDisplay(customRange.startDate)} - ${formatDateDisplay(customRange.endDate)}`;
    }
    return options.find(opt => opt.value === selected)?.label ||
           standardOptions.find(opt => opt.value === selected)?.label ||
           "Select Range";
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: DateRangeOption) => {
    if (optionValue === "custom") {
      setShowCustomPicker(true);
    } else {
      setSelected(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomRange = () => {
    if (customRange.startDate && customRange.endDate) {
      setSelected("custom");
      onChange?.("custom", customRange);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCancelCustom = () => {
    setShowCustomPicker(false);
  };

  const buttonClasses = variant === "glass"
    ? "flex items-center gap-2 px-4 py-2 glass-input rounded-lg hover:bg-white/20 transition-all text-sm font-medium text-navy-dark dark:text-white"
    : "flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-sm font-medium text-navy-dark dark:text-white";

  const dropdownClasses = variant === "glass"
    ? "absolute top-full right-0 mt-2 glass-surface rounded-lg z-50 overflow-hidden"
    : "absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <Calendar className="h-4 w-4 text-winning-green" />
        <span>{getDisplayLabel()}</span>
        {readOnly && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
            Read Only
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={dropdownClasses}>
          {!showCustomPicker ? (
            <div className="py-1 w-56">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between
                    ${selected === option.value
                      ? 'bg-winning-green/10 text-winning-green font-medium'
                      : 'text-navy-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>{option.label}</span>
                  {selected === option.value && (
                    <div className="w-2 h-2 rounded-full bg-winning-green" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-navy-dark dark:text-white">Custom Date Range</h3>
                <button
                  onClick={handleCancelCustom}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customRange.startDate}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-navy-dark dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-winning-green/50 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customRange.endDate}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                    min={customRange.startDate}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-navy-dark dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-winning-green/50 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleCancelCustom}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customRange.startDate || !customRange.endDate}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-winning-green rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
