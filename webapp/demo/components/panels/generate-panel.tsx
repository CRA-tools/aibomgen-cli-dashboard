"use client";

import { useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ResultDisplay } from "@/components/result-display";
import { ModelSearchPicker } from "@/components/model-search-picker";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { GenerateResponse, GeneratedBOM } from "@/lib/types";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Sanitise a model ID so it's safe as a filename: replace / and spaces */
function safeFilename(modelId: string): string {
  return modelId.replace(/[/\\:*?"<>|]/g, "_");
}

async function downloadBOMs(boms: GeneratedBOM[]) {
  if (boms.length === 1) {
    // Single BOM → direct .cdx.json download
    const bom = boms[0];
    const blob = new Blob([JSON.stringify(bom.bom, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFilename(bom.model_id)}.cdx.json`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Multiple BOMs → ZIP
  const zip = new JSZip();
  for (const bom of boms) {
    zip.file(`${safeFilename(bom.model_id)}.cdx.json`, JSON.stringify(bom.bom, null, 2));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aiboms_${boms.length}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export function GeneratePanel() {
  const [modelIds, setModelIds] = useState<string[]>([]);
  const [hfToken, setHfToken] = useState("");
  const [timeoutSecs, setTimeoutSecs] = useState(30);
  const { data, error, isPending, execute } = useApiCall<GenerateResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modelIds.length === 0) {
      toast.error("Select at least one model.");
      return;
    }
    await execute(() =>
      api.generate({ model_ids: modelIds, hf_token: hfToken || undefined, timeout_seconds: timeoutSecs })
    );
    if (!error) toast.success("AIBOMs generated.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Hugging Face Model IDs</Label>
        <p className="text-xs text-muted-foreground">
          Search the Hugging Face Hub or type a model ID directly (e.g.{" "}
          <code className="font-mono">google-bert/bert-base-uncased</code>). Select multiple.
        </p>
        <ModelSearchPicker selectedIds={modelIds} onChange={setModelIds} />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="hf-token">
            HF Token <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="hf-token"
            type="password"
            placeholder="hf_..."
            value={hfToken}
            onChange={(e) => setHfToken(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            min={5}
            max={300}
            value={timeoutSecs}
            onChange={(e) => setTimeoutSecs(Number(e.target.value))}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || modelIds.length === 0} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending
          ? "Generating…"
          : modelIds.length > 0
            ? `Generate ${modelIds.length} AIBOM${modelIds.length !== 1 ? "s" : ""}`
            : "Generate AIBOMs"}
      </Button>

      {data && !error && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {data.count} BOM{data.count !== 1 ? "s" : ""} generated
            </Badge>
            {data.boms.map((b) => (
              <Badge key={b.model_id} variant="secondary">
                {b.model_id}
              </Badge>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => downloadBOMs(data.boms)}
            >
              <Download className="h-4 w-4" />
              {data.count === 1 ? "Download AIBOM" : `Download ${data.count} AIBOMs (.zip)`}
            </Button>
          </div>
        </div>
      )}

      <ResultDisplay data={data} error={error} label="Generated AIBOMs" />
    </form>
  );
}
