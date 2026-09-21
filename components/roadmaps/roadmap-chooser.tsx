"use client";

import { ArrowRight, Archive, Plus } from "lucide-react";
import { useState } from "react";
import { TransitionLink } from "@/components/shared/navigation-transition";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProgressStats } from "@/lib/roadmap-utils";
import { useRoadmaps } from "@/state/roadmap-store";
import { CreateRoadmapDialog } from "./create-roadmap-dialog";
import { RoadmapActions } from "./roadmap-actions";

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

export function RoadmapChooser() {
  const { state } = useRoadmaps();
  const [createOpen, setCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const visible = state.workspaces.filter((item) => Boolean(item.roadmap.archivedAt) === showArchived);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">Roadmaps</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a learning path or start a new one.</p>
        </div>
        <div className="flex gap-2"><Button size="sm" variant="ghost" aria-pressed={showArchived} className="max-sm:h-10" onClick={() => setShowArchived((value) => !value)}><Archive /> {showArchived ? "Active" : "Archived"}</Button><Button size="sm" className="max-sm:h-10" onClick={() => setCreateOpen(true)}><Plus /> New roadmap</Button></div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
        <div className="hidden grid-cols-[minmax(0,1fr)_9rem_7rem_9rem_2rem] gap-4 border-b bg-surface-inset/65 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
          <span>Roadmap</span><span>Progress</span><span>Resources</span><span>Updated</span><span />
        </div>
        <div className="divide-y">
          {visible.map((workspace) => {
            const stats = getProgressStats(workspace.progress);
            return (
              <div key={workspace.roadmap.id} className="group grid gap-3 px-4 py-3 transition-colors hover:bg-secondary/45 md:grid-cols-[minmax(0,1fr)_9rem_7rem_9rem_2rem] md:items-center md:gap-4">
                <div className="min-w-0">
                  <TransitionLink href={`/roadmaps/${workspace.roadmap.slug}/plan`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><h2 className="truncate text-sm font-semibold tracking-[-0.01em] group-hover:text-primary">{workspace.roadmap.title}</h2></TransitionLink>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{workspace.roadmap.objective}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={stats.percent} className="h-1.5 flex-1" />
                  <span className="w-8 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{stats.percent}%</span>
                </div>
                <span className="text-xs text-muted-foreground">{workspace.roadmap.resources.length} saved</span>
                <span className="text-xs text-muted-foreground">{dateFormatter.format(new Date(workspace.roadmap.updatedAt))}</span>
                <div className="flex items-center"><ArrowRight className="hidden size-4 text-muted-foreground md:block" /><RoadmapActions roadmap={workspace.roadmap} /></div>
              </div>
            );
          })}
        </div>
        {visible.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted-foreground">{showArchived ? "No archived roadmaps." : "No active roadmaps. Create one to begin."}</div>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Preview data resets when this page reloads.</p>
      <CreateRoadmapDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
