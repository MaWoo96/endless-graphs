"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2, Check } from "lucide-react";
import { useEntityContext, Entity } from "@/contexts/EntityContext";

export function EntityPicker() {
  const { entities, selectedEntity, setSelectedEntity, isLoading, tenantName } = useEntityContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (entity: Entity) => {
    setSelectedEntity(entity);
    setIsOpen(false);
  };

  // Don't show picker if there's only one entity or none
  if (isLoading || entities.length <= 1) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy-dark dark:text-white">Endless Graphs</h1>
        <p className="text-sm text-text-muted dark:text-gray-400">
          {selectedEntity?.name || "Financial Dashboard"}
        </p>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-left group"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div>
          <h1 className="text-2xl font-bold text-navy-dark dark:text-white">Endless Graphs</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-text-muted dark:text-gray-400 group-hover:text-navy-medium dark:group-hover:text-gray-300 transition-colors">
              {selectedEntity?.name || "Select Entity"}
            </p>
            <ChevronDown
              className={`h-4 w-4 text-text-muted dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          role="listbox"
          aria-label="Select entity"
        >
          {tenantName && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tenantName}
              </p>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => handleSelect(entity)}
                className={`w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedEntity?.id === entity.id
                    ? 'bg-winning-green/5 dark:bg-winning-green/10'
                    : ''
                }`}
                role="option"
                aria-selected={selectedEntity?.id === entity.id}
              >
                <div className={`p-1.5 rounded-lg ${
                  selectedEntity?.id === entity.id
                    ? 'bg-winning-green/10 text-winning-green'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selectedEntity?.id === entity.id
                      ? 'text-winning-green'
                      : 'text-navy-dark dark:text-white'
                  }`}>
                    {entity.name}
                  </p>
                  {entity.entity_type && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {entity.entity_type}
                    </p>
                  )}
                </div>
                {selectedEntity?.id === entity.id && (
                  <Check className="h-4 w-4 text-winning-green flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {entities.length > 5 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {entities.length} entities available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
