import { Progress } from "@/components/ui/progress";
import type { ProgressStats } from "@/lib/types";

export function ProgressSummary({ stats }: { stats: ProgressStats }) {
  return (
    <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 border-y border-border/80 bg-surface-raised/45 px-3 py-3 max-sm:grid-cols-[auto_1fr]">
      <div>
        <strong className="text-xl font-semibold tabular-nums tracking-[-0.03em] text-primary">
          {stats.percent}%
        </strong>
        <p className="text-[11px] text-muted-foreground">complete</p>
      </div>
      <Progress value={stats.percent} aria-label={`${stats.percent}% complete`} />
      <span className="font-mono text-[10px] text-muted-foreground max-sm:col-span-2">
        {stats.complete} of {stats.total} steps
      </span>
    </div>
  );
}
