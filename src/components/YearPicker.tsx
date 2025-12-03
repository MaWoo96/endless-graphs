"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  variant?: "default" | "glass";
}

export function YearPicker({
  value,
  onChange,
  minYear = 2020,
  maxYear = new Date().getFullYear(),
  variant = "default"
}: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate array of years
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevYear = () => {
    if (value > minYear) {
      onChange(value - 1);
    }
  };

  const handleNextYear = () => {
    if (value < maxYear) {
      onChange(value + 1);
    }
  };

  const buttonClasses = variant === "glass"
    ? "flex items-center gap-2 px-4 py-2 glass-input rounded-lg hover:bg-white/20 transition-all text-sm font-medium text-navy-dark dark:text-white"
    : "flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-sm font-medium text-navy-dark dark:text-white";

  const dropdownClasses = variant === "glass"
    ? "absolute top-full right-0 mt-2 glass-surface rounded-lg z-50 overflow-hidden"
    : "absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden";

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      {/* Previous Year Button */}
      <button
        onClick={handlePrevYear}
        disabled={value <= minYear}
        className="p-2 text-gray-400 hover:text-navy-dark dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Previous year"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Year Selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <Calendar className="h-4 w-4 text-winning-green" />
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Next Year Button */}
      <button
        onClick={handleNextYear}
        disabled={value >= maxYear}
        className="p-2 text-gray-400 hover:text-navy-dark dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Next year"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={dropdownClasses}>
          <div className="py-1 w-32 max-h-64 overflow-y-auto">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onChange(year);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between
                  ${value === year
                    ? 'bg-winning-green/10 text-winning-green font-medium'
                    : 'text-navy-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <span>{year}</span>
                {value === year && (
                  <div className="w-2 h-2 rounded-full bg-winning-green" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
