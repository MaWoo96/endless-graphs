"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Tag as TagIcon, Plus, X, Check, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Tag } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface TagPickerProps {
  transactionId: string;
  tenantId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  disabled?: boolean;
}

// Default tag colors to cycle through
const TAG_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

/**
 * Get contrasting text color for a background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * TagPicker component with autocomplete and create new tag functionality
 */
export function TagPicker({
  transactionId,
  tenantId,
  selectedTags,
  onTagsChange,
  disabled = false,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  // Fetch available tags for this tenant
  const fetchTags = useCallback(async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId]);

  // Load tags when popover opens
  useEffect(() => {
    if (open) {
      fetchTags();
    }
  }, [open, fetchTags]);

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!search.trim()) return availableTags;
    const searchLower = search.toLowerCase();
    return availableTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchLower) ||
        tag.description?.toLowerCase().includes(searchLower)
    );
  }, [availableTags, search]);

  // Check if search term matches an existing tag
  const exactMatch = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return availableTags.some((tag) => tag.name.toLowerCase() === searchLower);
  }, [availableTags, search]);

  // Check if tag is selected
  const isTagSelected = useCallback(
    (tagId: string) => selectedTags.some((t) => t.id === tagId),
    [selectedTags]
  );

  // Create a new tag
  const handleCreateTag = useCallback(async () => {
    if (!search.trim() || exactMatch || !tenantId) return;

    setIsCreating(true);
    try {
      // Pick a random color
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

      const { data: newTag, error } = await supabase
        .from("tags")
        .insert({
          tenant_id: tenantId,
          name: search.trim(),
          color,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to available tags
      setAvailableTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));

      // Also add to transaction
      await handleToggleTag(newTag);

      setSearch("");
    } catch (err) {
      console.error("Failed to create tag:", err);
    } finally {
      setIsCreating(false);
    }
  }, [supabase, tenantId, search, exactMatch]);

  // Toggle tag on/off for the transaction
  const handleToggleTag = useCallback(
    async (tag: Tag) => {
      const isSelected = isTagSelected(tag.id);

      try {
        if (isSelected) {
          // Remove tag from transaction
          const { error } = await supabase
            .from("transaction_tags")
            .delete()
            .eq("transaction_id", transactionId)
            .eq("tag_id", tag.id);

          if (error) throw error;

          onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
        } else {
          // Add tag to transaction
          const { error } = await supabase.from("transaction_tags").insert({
            transaction_id: transactionId,
            tag_id: tag.id,
          });

          if (error) throw error;

          onTagsChange([...selectedTags, tag]);
        }
      } catch (err) {
        console.error("Failed to toggle tag:", err);
      }
    },
    [supabase, transactionId, selectedTags, isTagSelected, onTagsChange]
  );

  // Remove a tag (click X on badge)
  const handleRemoveTag = useCallback(
    async (tag: Tag, e: React.MouseEvent) => {
      e.stopPropagation();
      await handleToggleTag(tag);
    },
    [handleToggleTag]
  );

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              className="pl-2 pr-1 py-1 gap-1 cursor-default"
              style={{
                backgroundColor: `${tag.color || "#6366f1"}20`,
                borderColor: `${tag.color || "#6366f1"}40`,
                color: tag.color || "#6366f1",
              }}
            >
              <span className="text-xs font-medium">{tag.name}</span>
              {!disabled && (
                <button
                  onClick={(e) => handleRemoveTag(tag, e)}
                  className="ml-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Add Tag Button / Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <TagIcon className="w-4 h-4" />
            {selectedTags.length === 0 ? "Add tags" : "Edit tags"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create tag..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Create new tag option */}
                  {search.trim() && !exactMatch && (
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateTag}
                        disabled={isCreating}
                        className="cursor-pointer"
                      >
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        <span>Create &quot;{search.trim()}&quot;</span>
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {/* Existing tags */}
                  <CommandGroup heading={filteredTags.length > 0 ? "Tags" : undefined}>
                    {filteredTags.length === 0 && !search.trim() ? (
                      <CommandEmpty>No tags yet. Type to create one.</CommandEmpty>
                    ) : filteredTags.length === 0 && search.trim() ? (
                      <CommandEmpty>No matching tags.</CommandEmpty>
                    ) : (
                      filteredTags.map((tag) => {
                        const selected = isTagSelected(tag.id);
                        return (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() => handleToggleTag(tag)}
                            className="cursor-pointer"
                          >
                            <div
                              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: tag.color || "#6366f1" }}
                            />
                            <span className="flex-1 truncate">{tag.name}</span>
                            {selected && (
                              <Check className="w-4 h-4 text-teal flex-shrink-0" />
                            )}
                          </CommandItem>
                        );
                      })
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Compact inline tag display for transaction rows - dot style for minimal footprint
 */
export function TagBadges({
  tags,
  maxDisplay = 3,
  onClick,
  variant = "dots",
}: {
  tags: Tag[];
  maxDisplay?: number;
  onClick?: () => void;
  variant?: "dots" | "pills";
}) {
  if (tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remaining = tags.length - maxDisplay;

  // Dot variant - minimal colored dots with tooltip
  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex items-center gap-0.5",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
        title={tags.map(t => t.name).join(", ")}
      >
        {displayTags.map((tag) => (
          <div
            key={tag.id}
            className="w-2 h-2 rounded-full ring-1 ring-white dark:ring-gray-900 transition-transform hover:scale-125"
            style={{ backgroundColor: tag.color || "#6366f1" }}
          />
        ))}
        {remaining > 0 && (
          <span className="text-[9px] text-gray-400 ml-0.5">+{remaining}</span>
        )}
      </div>
    );
  }

  // Pills variant - full tag names
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        onClick && "cursor-pointer hover:opacity-80"
      )}
      onClick={onClick}
    >
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border"
          style={{
            backgroundColor: `${tag.color || "#6366f1"}15`,
            borderColor: `${tag.color || "#6366f1"}30`,
            color: tag.color || "#6366f1",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: tag.color || "#6366f1" }}
          />
          {tag.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          +{remaining}
        </span>
      )}
    </div>
  );
}

/**
 * Tag filter pills for filtering transactions by tags
 * Modern, compact design that integrates well with other filters
 */
export function TagFilterPills({
  tags,
  selectedTagIds,
  onToggleTag,
  onClearAll,
  isLoading = false,
  filteredCount,
  totalCount,
}: {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
  filteredCount?: number;
  totalCount?: number;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-7 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-7 w-14 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedTagIds.length > 0;

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        <TagIcon className="w-3.5 h-3.5" />
        <span>Tags</span>
        {hasActiveFilters && filteredCount !== undefined && (
          <span className="text-teal font-medium">
            {filteredCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Tag chips - horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin flex-1">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className={cn(
                "group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                isSelected
                  ? "shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
              style={
                isSelected
                  ? {
                      backgroundColor: `${tag.color || "#6366f1"}20`,
                      color: tag.color || "#6366f1",
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full transition-transform",
                  isSelected && "scale-110"
                )}
                style={{ backgroundColor: tag.color || "#6366f1" }}
              />
              <span>{tag.name}</span>
              {isSelected && (
                <Check className="w-3 h-3 ml-0.5 opacity-70" />
              )}
            </button>
          );
        })}
      </div>

      {/* Clear button */}
      {hasActiveFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}
    </div>
  );
}
