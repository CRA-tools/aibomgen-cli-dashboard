"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Download, Heart, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useHFSearch } from "@/hooks/use-hf-search";
import { cn } from "@/lib/utils";

interface ModelSearchPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function formatCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function ModelSearchPicker({ selectedIds, onChange }: ModelSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, isLoading } = useHFSearch(query);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function addManual(id: string) {
    const trimmed = id.trim();
    if (trimmed && !selectedIds.includes(trimmed)) {
      onChange([...selectedIds, trimmed]);
    }
    setQuery("");
    setOpen(false);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  const queryTrimmed = query.trim();
  // Show "add manually" option when query looks like a model id (non-empty)
  // and it's not already a search result
  const showManualAdd =
    queryTrimmed.length > 0 &&
    !results.some((r) => r.id.toLowerCase() === queryTrimmed.toLowerCase());

  return (
    <div className="space-y-3">
      {/* Search trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              Select Hugging Face models…
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[500px] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by model name, organisation…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-72">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </div>
              )}

              {!isLoading && queryTrimmed && results.length === 0 && !showManualAdd && (
                <CommandEmpty>No models found.</CommandEmpty>
              )}

              {!isLoading && results.length > 0 && (
                <CommandGroup heading="Hugging Face Hub results">
                  {results.map((model) => {
                    const selected = selectedIds.includes(model.id);
                    return (
                      <CommandItem
                        key={model.id}
                        value={model.id}
                        onSelect={() => toggle(model.id)}
                        className="flex items-center gap-2 py-2"
                      >
                        <Check
                          className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                          style={{ color: selected ? "#19224d" : undefined }}
                        />
                        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                          <span className="font-mono text-sm truncate">{model.id}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {model.pipeline_tag && (
                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                {model.pipeline_tag}
                              </Badge>
                            )}
                            {model.downloads !== undefined && (
                              <span className="flex items-center gap-0.5">
                                <Download className="h-3 w-3" />
                                {formatCount(model.downloads)}
                              </span>
                            )}
                            {model.likes !== undefined && (
                              <span className="flex items-center gap-0.5">
                                <Heart className="h-3 w-3" />
                                {formatCount(model.likes)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {showManualAdd && (
                <>
                  {results.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Add manually">
                    <CommandItem
                      value={`__manual__${queryTrimmed}`}
                      onSelect={() => addManual(queryTrimmed)}
                      className="flex items-center gap-2 py-2"
                    >
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {queryTrimmed}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">Add as-is</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {!queryTrimmed && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search the Hugging Face Hub…
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected model list */}
      {selectedIds.length > 0 && (
        <div className="rounded-md border divide-y" style={{ borderColor: "#dde3ea" }}>
          {selectedIds.map((id, i) => (
            <div
              key={id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-medium shrink-0 w-5 text-center rounded"
                  style={{ color: "#58595B" }}
                >
                  {i + 1}
                </span>
                <code className="font-mono truncate">{id}</code>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => remove(id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
