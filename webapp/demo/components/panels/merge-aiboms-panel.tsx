"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FilePicker } from "@/components/file-picker";
import { ResultDisplay } from "@/components/result-display";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { MergeResponse } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MergeAibomsPanel() {
  const [sbom, setSbom] = useState<File[]>([]);
  const [aiboms, setAiboms] = useState<File[]>([]);
  const [sbomName, setSbomName] = useState("");
  const [dedup, setDedup] = useState(false);
  const { data, error, isPending, execute } = useApiCall<MergeResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sbom[0]) { toast.error("Select the SBOM file."); return; }
    if (aiboms.length === 0) { toast.error("Select at least one AIBOM file."); return; }
    await execute(() =>
      api.mergeAIBOMsWithSBOM(sbom[0], aiboms, {
        sbom_name: sbomName || undefined,
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
        <div className="space-y-1.5">
          <Label htmlFor="aiboms-sbom-name">SBOM label <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="aiboms-sbom-name"
            placeholder="my-application"
            value={sbomName}
            onChange={(e) => setSbomName(e.target.value)}
          />
        </div>
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
        <div className="flex flex-wrap gap-2">
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
        </div>
      )}

      <ResultDisplay data={data} error={error} label="Merged BOM" />
    </form>
  );
}
