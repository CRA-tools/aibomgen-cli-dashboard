"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FilePicker } from "@/components/file-picker";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { VulnScanResponse, ComponentVulnScanResult, VulnerabilityFinding } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Download, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
  unknown: 5,
};

function severityClass(severity?: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-800 border-red-300";
    case "high":     return "bg-orange-100 text-orange-800 border-orange-300";
    case "medium":   return "bg-amber-100 text-amber-800 border-amber-300";
    case "low":      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "none":     return "bg-blue-100 text-blue-700 border-blue-300";
    default:         return "bg-muted text-muted-foreground";
  }
}

function sortedFindings(findings: VulnerabilityFinding[]): VulnerabilityFinding[] {
  return [...findings].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity?.toLowerCase() ?? "unknown"] ?? 5) -
      (SEVERITY_ORDER[b.severity?.toLowerCase() ?? "unknown"] ?? 5)
  );
}

// ── Download helper ───────────────────────────────────────────────────────────

function downloadEnriched(bom: Record<string, unknown>, modelId: string) {
  const safe = modelId.replace(/[/\\:*?"<>|]/g, "_");
  const blob = new Blob([JSON.stringify(bom, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${safe}_vuln_enriched.cdx.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FindingRow({ f }: { f: VulnerabilityFinding }) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-2 text-xs">
      <Badge
        variant="outline"
        className={`shrink-0 capitalize ${severityClass(f.severity)}`}
      >
        {f.severity ?? "unknown"}
      </Badge>
      <div className="min-w-0 flex-1">
        {f.source && (
          <span className="font-medium text-muted-foreground mr-1.5">[{f.source}]</span>
        )}
        <span className="font-mono break-all">{f.id}</span>
        {f.description && (
          <p className="mt-0.5 text-muted-foreground leading-snug">{f.description}</p>
        )}
      </div>
    </div>
  );
}

function ComponentCard({ comp }: { comp: ComponentVulnScanResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasVulns = comp.vulnerability_count > 0;
  const hasError = !!comp.error;

  return (
    <div className="rounded-md border">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors rounded-md"
      >
        {hasError ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        ) : hasVulns ? (
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
        ) : (
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
        )}

        <span className="font-mono text-sm font-medium flex-1 truncate">{comp.model_id}</span>

        <div className="flex items-center gap-2 shrink-0">
          {hasError ? (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              scan error
            </Badge>
          ) : hasVulns ? (
            <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
              {comp.vulnerability_count} finding{comp.vulnerability_count !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
              clean
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {comp.scan_entries_count} file{comp.scan_entries_count !== 1 ? "s" : ""} scanned
          </span>
          <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-3 py-2.5 space-y-2">
          {comp.component_ref && (
            <p className="text-xs text-muted-foreground font-mono">ref: {comp.component_ref}</p>
          )}
          {hasError && (
            <p className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-800">
              {comp.error}
            </p>
          )}
          {hasVulns ? (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {sortedFindings(comp.vulnerabilities).map((f, i) => (
                <FindingRow key={i} f={f} />
              ))}
            </div>
          ) : !hasError ? (
            <p className="text-xs text-emerald-600">No findings from any scanner.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function VulnScanPanel() {
  const [file, setFile]           = useState<File[]>([]);
  const [hfToken, setHfToken]     = useState("");
  const [timeout, setTimeout]     = useState(30);
  const [enrich, setEnrich]       = useState(false);
  const { data, error, isPending, execute } = useApiCall<VulnScanResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (file.length === 0) { toast.error("Select a BOM file first."); return; }
    await execute(() =>
      api.vulnScan(file[0], {
        hf_token:        hfToken || undefined,
        timeout_seconds: timeout,
        enrich,
      })
    );
  }

  const firstModelId = data?.components?.[0]?.model_id ?? "aibom";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker
        id="vulnscan-bom"
        label="AIBOM file (JSON or XML)"
        files={file}
        onChange={setFile}
      />

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vs-hf-token">
            HF Token <span className="text-muted-foreground">(optional, for private models)</span>
          </Label>
          <Input
            id="vs-hf-token"
            type="password"
            placeholder="hf_..."
            value={hfToken}
            onChange={(e) => setHfToken(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vs-timeout">Timeout (seconds)</Label>
          <Input
            id="vs-timeout"
            type="number"
            min={5}
            max={120}
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enrich}
          onChange={(e) => setEnrich(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Inject findings into the BOM as CycloneDX Vulnerabilities (download enriched BOM)
      </label>

      <Button type="submit" disabled={isPending || file.length === 0} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Scanning…" : "Run Vulnerability Scan"}
      </Button>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {data && !error && (
        <>
          <Separator />

          {/* Summary row */}
          <div className="flex flex-wrap items-center gap-3">
            {data.total_vulnerabilities === 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                No findings across {data.components.length} component{data.components.length !== 1 ? "s" : ""}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                <ShieldAlert className="h-4 w-4" />
                {data.total_vulnerabilities} finding{data.total_vulnerabilities !== 1 ? "s" : ""} across {data.components.length} component{data.components.length !== 1 ? "s" : ""}
              </div>
            )}

            {data.enriched_bom && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5"
                onClick={() => downloadEnriched(data.enriched_bom!, firstModelId)}
              >
                <Download className="h-4 w-4" />
                Download enriched BOM
              </Button>
            )}
          </div>

          {/* Per-component cards */}
          <div className="max-h-[36rem] overflow-y-auto space-y-2 pr-1">
            {data.components.map((comp, i) => (
              <ComponentCard key={i} comp={comp} />
            ))}
          </div>
        </>
      )}
    </form>
  );
}
