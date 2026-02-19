"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export function FilePicker({
  id,
  label,
  accept = ".json,.xml",
  multiple = false,
  files,
  onChange,
  className,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    onChange(Array.from(e.target.files));
    // reset so the same file can be re-selected
    e.target.value = "";
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40",
          files.length > 0 && "border-primary/50 bg-muted/20"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        <span>{files.length === 0 ? "Click to select" : "Click to change"}</span>
        {files.length > 0 && (
          <span className="font-medium text-foreground">
            {files.length === 1 ? files[0].name : `${files.length} files selected`}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      {files.length > 1 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-xs">
              <span className="truncate">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={(e) => { e.stopPropagation(); remove(i); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
