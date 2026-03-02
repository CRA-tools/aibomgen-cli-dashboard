"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePicker } from "@/components/file-picker";
import { ScoreBar } from "@/components/score-bar";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { CompletenessResponse } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CompletenessPanel() {
  const [file, setFile] = useState<File[]>([]);
  const { data, error, isPending, execute } = useApiCall<CompletenessResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (file.length === 0) { toast.error("Select a BOM file first."); return; }
    await execute(() => api.checkCompleteness(file[0]));
    if (!error) toast.success("Completeness check done.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker
        id="completeness-bom"
        label="BOM file (JSON or XML)"
        files={file}
        onChange={setFile}
      />

      <Button type="submit" disabled={isPending || file.length === 0} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Checking…" : "Check Completeness"}
      </Button>

      {data && !error && (
        <>
          <Separator />
          <div className="space-y-4">
            {data.model_id && (
              <p className="text-sm font-medium">
                Model: <span className="font-mono text-muted-foreground">{data.model_id}</span>
              </p>
            )}
            <ScoreBar score={data.score} passed={data.passed} total={data.total} />

            {data.missing_required.length > 0 && (
              <FieldList title="Missing Required" variant="destructive" fields={data.missing_required} />
            )}
            {data.missing_optional.length > 0 && (
              <FieldList title="Missing Optional" variant="outline" fields={data.missing_optional} />
            )}

            {data.dataset_results && Object.keys(data.dataset_results).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Datasets</p>
                {Object.entries(data.dataset_results).map(([ref, dr]) => (
                  <div key={ref} className="rounded-md border p-3 space-y-2">
                    <p className="text-xs font-mono text-muted-foreground">{dr.dataset_ref || ref}</p>
                    <ScoreBar score={dr.score} passed={dr.passed} total={dr.total} />
                    {dr.missing_required.length > 0 && (
                      <FieldList title="Missing Required" variant="destructive" fields={dr.missing_required} />
                    )}
                    {dr.missing_optional.length > 0 && (
                      <FieldList title="Missing Optional" variant="outline" fields={dr.missing_optional} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
    </form>
  );
}

function FieldList({
  title,
  fields,
  variant,
}: {
  title: string;
  fields: string[];
  variant: "destructive" | "outline";
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ScrollArea className="max-h-32">
        <div className="flex flex-wrap gap-1.5 pr-2">
          {fields.map((f) => (
            <Badge key={f} variant={variant} className="text-xs font-mono font-normal">
              {f}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
