"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface ResultDisplayProps {
  data: unknown;
  error: string | null;
  label?: string;
}

export function ResultDisplay({ data, error, label = "Response" }: ResultDisplayProps) {
  if (!data && !error) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {error ? (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Error
          </Badge>
        ) : (
          <Badge variant="outline" className="text-emerald-600 border-emerald-600">OK</Badge>
        )}
      </div>
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : (
        <ScrollArea className="h-72 w-full rounded-md border bg-muted/40">
          <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}
