interface ScoreBarProps {
  score: number; // 0–1
  passed: number;
  total: number;
}

export function ScoreBar({ score, passed, total }: ScoreBarProps) {
  const pct = Math.round(score * 100);
  const colour =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{pct}% complete</span>
        <span className="text-muted-foreground">
          {passed}/{total} fields
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
