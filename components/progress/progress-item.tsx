"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProgressItem as ProgressItemType, ProgressStatus } from "@/lib/types";

const statusLabel = {
  "not-started": "Up next",
  "in-progress": "In progress",
  complete: "Done",
} as const;

export function ProgressItem({
  item,
  onStatusChange,
}: {
  item: ProgressItemType;
  onStatusChange: (status: ProgressStatus) => void;
}) {
  return (
    <div className={cn("flex min-h-11 items-center gap-3 border-t py-2 transition-colors duration-150 first:border-t-0 hover:bg-secondary/30", item.status === "complete" && "bg-secondary/20") }>
      <span
        className={cn(
          "flex-1 text-sm font-medium transition-colors duration-150",
          item.status === "complete" && "text-foreground/70",
        )}
      >
        {item.label}
      </span>
      {item.status !== "complete" && <Select value={item.status} onValueChange={(value) => onStatusChange(value as ProgressStatus)}><SelectTrigger className="h-9 w-28 text-xs max-sm:h-11" aria-label={`Status for ${item.label}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not-started">Up next</SelectItem><SelectItem value="in-progress">In progress</SelectItem></SelectContent></Select>}
      <Button size="sm" variant={item.status === "complete" ? "secondary" : "outline"} aria-pressed={item.status === "complete"} aria-label={item.status === "complete" ? `Reopen ${item.label}` : `Mark ${item.label} complete`} onClick={() => onStatusChange(item.status === "complete" ? "in-progress" : "complete")}>
        {item.status === "complete" ? <CheckCircle2 /> : <Check />}{item.status === "complete" ? "Complete" : "Mark complete"}
      </Button>
    </div>
  );
}
