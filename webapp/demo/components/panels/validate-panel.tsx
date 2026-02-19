"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePicker } from "@/components/file-picker";
import { ScoreBar } from "@/components/score-bar";
import { useApiCall } from "@/hooks/use-api-call";
import { api } from "@/lib/api";
import type { ValidateResponse } from "@/lib/types";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

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
        <p className="text-sm font-medium">Validation options</p>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Strict mode
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

      <Button type="submit" disabled={isPending} className="w-full">
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

              <ScoreBar
                score={data.completeness_score}
                passed={data.missing_required.length === 0 ? data.missing_required.length : 0}
                total={data.missing_required.length + data.missing_optional.length}
              />

              {data.errors.length > 0 && (
                <MessageList title="Errors" messages={data.errors} colour="text-destructive" bg="bg-destructive/10" />
              )}
              {data.warnings.length > 0 && (
                <MessageList title="Warnings" messages={data.warnings} colour="text-amber-700" bg="bg-amber-50 dark:bg-amber-950/30" />
              )}
              {data.missing_required.length > 0 && (
                <FieldBadgeList title="Missing Required" fields={data.missing_required} variant="destructive" />
              )}
              {data.missing_optional.length > 0 && (
                <FieldBadgeList title="Missing Optional" fields={data.missing_optional} variant="outline" />
              )}
            </div>
          )}
        </>
      )}
    </form>
  );
}

function MessageList({
  title,
  messages,
  colour,
  bg,
}: {
  title: string;
  messages: string[];
  colour: string;
  bg: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ScrollArea className="max-h-32">
        <ul className={`rounded-md ${bg} p-2 space-y-1`}>
          {messages.map((m, i) => (
            <li key={i} className={`text-xs ${colour}`}>{m}</li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function FieldBadgeList({
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
      <div className="flex flex-wrap gap-1.5">
        {fields.map((f) => (
          <Badge key={f} variant={variant} className="text-xs font-mono font-normal">{f}</Badge>
        ))}
      </div>
    </div>
  );
}
