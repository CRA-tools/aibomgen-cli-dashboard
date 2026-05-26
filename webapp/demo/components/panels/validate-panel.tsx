"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FilePicker } from "@/components/file-picker";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { ValidateResponse } from "@/lib/types";
import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

function SimpleScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const colour = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ValidatePanel() {
  const [file, setFile] = useState<File[]>([]);
  const [strictMode, setStrictMode] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [checkModelCard, setCheckModelCard] = useState(false);
  const { data, error, isPending, execute } = useApiCall<ValidateResponse>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (file.length === 0) { toast.error("Select a BOM file first."); return; }
    await execute(() =>
      api.validate(file[0], {
        strict_mode: strictMode,
        min_completeness_score: minScore > 0 ? minScore / 100 : undefined,
        check_model_card: checkModelCard,
      })
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FilePicker id="validate-bom" label="BOM file (JSON or XML)" files={file} onChange={setFile} />

      <Separator />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Validation options</p>

        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Strict mode (flags missing required fields as errors)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkModelCard}
              onChange={(e) => setCheckModelCard(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Check model card
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="min-score">Min completeness score (%)</Label>
          <Input
            id="min-score"
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || file.length === 0} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Validating…" : "Validate BOM"}
      </Button>

      {(data || error) && (
        <>
          <Separator />
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          {data && (
            <div className="space-y-4">
              {/* Valid / Invalid status */}
              <div className="flex items-center gap-2">
                {data.valid ? (
                  <><CheckCircle2 className="h-5 w-5 text-emerald-500" /><span className="font-semibold text-emerald-600">Valid</span></>
                ) : (
                  <><XCircle className="h-5 w-5 text-destructive" /><span className="font-semibold text-destructive">Invalid</span></>
                )}
                {data.model_id && (
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{data.model_id}</span>
                )}
              </div>

              {/* Structural checks summary */}
              <StructuralChecks errors={data.errors} />
              <div className="rounded-md border p-3 space-y-3">
                <p className="text-xs font-medium">Completeness scores</p>
                <SimpleScoreBar label={data.model_id } score={data.completeness_score} />
                {data.dataset_results && Object.keys(data.dataset_results).length > 0 && (
                  Object.entries(data.dataset_results).map(([ref, dr]) => (
                    <SimpleScoreBar
                      key={ref}
                      label={dr.dataset_ref || ref}
                      score={dr.completeness_score}
                    />
                  ))
                )}
              </div>

              {/* Errors */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Errors</p>
                {(() => {
                  const dsErrors = Object.entries(data.dataset_results ?? {}).flatMap(([, dr]) =>
                    dr.errors.map((e) => `[${dr.dataset_ref || "dataset"}] ${e}`)
                  );
                  const allErrors = [...data.errors, ...dsErrors];
                  return allErrors.length === 0 ? (
                    <p className="text-xs text-emerald-600 px-1">No errors</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/10 p-2">
                      <ul className="space-y-1">
                        {allErrors.map((m, i) => (
                          <li key={i} className="text-xs text-destructive">{m}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              {/* Warnings */}
              {(() => {
                const dsWarnings = Object.entries(data.dataset_results ?? {}).flatMap(([, dr]) =>
                  dr.warnings.map((w) => `[${dr.dataset_ref || "dataset"}] ${w}`)
                );
                const allWarnings = [...data.warnings, ...dsWarnings];
                return allWarnings.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Warnings</p>
                    <div className="max-h-32 overflow-y-auto rounded-md bg-amber-50 dark:bg-amber-950/30 p-2">
                      <ul className="space-y-1">
                        {allWarnings.map((m, i) => (
                          <li key={i} className="text-xs text-amber-700">{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Hint */}
              <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                For a detailed missing-field breakdown, use the{" "}
                <span className="font-medium text-foreground mx-0.5">Completeness</span> tab.
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}

const STRUCTURAL_CHECKS: { label: string; errorSubstrings: string[] }[] = [
  { label: "Structural validity", errorSubstrings: ["BOM is nil"] },
  { label: "Metadata component", errorSubstrings: ["BOM missing metadata.component"] },
  { label: "Spec version", errorSubstrings: ["BOM missing spec version", "invalid or unsupported spec version", "predates ML-BOM support"] },
];

function StructuralChecks({ errors }: { errors: string[] }) {
  return (
    <div className="rounded-md border p-3 space-y-1.5">
      <p className="text-xs font-medium mb-2">Structural checks</p>
      {STRUCTURAL_CHECKS.map(({ label, errorSubstrings }) => {
        const failed = errors.some((e) => errorSubstrings.some((s) => e.includes(s)));
        return (
          <div key={label} className="flex items-center gap-2">
            {failed
              ? <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
            <span className={`text-xs ${failed ? "text-destructive" : "text-muted-foreground"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
