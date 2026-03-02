"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FilePicker } from "@/components/file-picker";
import { ResultDisplay } from "@/components/result-display";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { MergeResponse } from "@/lib/types";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

function downloadMergedBOM(bom: Record<string, unknown>) {
  const filename = "merged.cdx.json";
  const blob = new Blob([JSON.stringify(bom, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MergeAibomsPanel() {
  const [sbom, setSbom] = useState<File[]>([]);
  const [aiboms, setAiboms] = useState<File[]>([]);
  const [dedup, setDedup] = useState(false);
  const { data, error, isPending, execute } = useApiCall<MergeResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sbom[0]) { toast.error("Select the SBOM file."); return; }
    if (aiboms.length === 0) { toast.error("Select at least one AIBOM file."); return; }
    await execute(() =>
      api.mergeAIBOMsWithSBOM(sbom[0], aiboms, {
        deduplicate_components: dedup,
      })
    );
    if (!error) toast.success("AIBOMs merged into SBOM.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker
        id="aiboms-sbom"
        label="Base SBOM file"
        files={sbom}
        onChange={setSbom}
      />

      <FilePicker
        id="aiboms-aiboms"
        label="AIBOM files (select multiple)"
        multiple
        files={aiboms}
        onChange={setAiboms}
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-end gap-2 pb-1 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dedup}
            onChange={(e) => setDedup(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Deduplicate components
        </label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Merging…" : "Merge AIBOMs into SBOM"}
      </Button>

      {data && !error && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">SBOM components: {data.sbom_component_count}</Badge>
            <Badge variant="outline">AIBOM components: {data.aibom_component_count}</Badge>
            {data.model_components.length > 0 && (
              <Badge variant="secondary">Models: {data.model_components.length}</Badge>
            )}
            {data.dataset_components.length > 0 && (
              <Badge variant="secondary">Datasets: {data.dataset_components.length}</Badge>
            )}
            {data.duplicates_removed > 0 && (
              <Badge variant="secondary">Duplicates removed: {data.duplicates_removed}</Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => downloadMergedBOM(data.merged_bom)}
            >
              <Download className="h-4 w-4" />
              Download Merged BOM
            </Button>
          </div>
        </div>
      )}

      <ResultDisplay data={data} error={error} label="Merged BOM" />
    </form>
  );
}
