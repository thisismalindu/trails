import { Badge } from "@/components/ui/badge";

export function ScoreSummary({ score, total }: { score: number; total: number }) {
  return (
    <Badge className="gap-2 border-primary/20 bg-primary px-3 py-2 text-sm shadow-none">
      <strong className="tabular-nums">{score}/{total}</strong>
      <span className="font-normal opacity-80">correct</span>
    </Badge>
  );
}
