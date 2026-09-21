"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { TransitionLink } from "@/components/shared/navigation-transition";
import { PresenceSwap } from "@/components/shared/route-transition";
import { cn } from "@/lib/utils";
import { useWorkspaceBySlug, WorkspaceProvider } from "@/state/roadmap-store";
import type { RoadmapWorkspace } from "@/lib/types";

const sections = ["plan", "progress", "quiz"] as const;

export function RoadmapWorkspaceShell({ slug, initialWorkspace, children }: { slug: string; initialWorkspace: RoadmapWorkspace | null; children: ReactNode }) {
  const pathname = usePathname();
  const activeSegment = useSelectedLayoutSegment();
  const workspace = useWorkspaceBySlug(slug) ?? initialWorkspace;

  if (!workspace) {
    return (
      <main className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-xl place-content-center px-5 text-center">
        <h1 className="text-xl font-semibold">Roadmap not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          It may have been deleted or you may not have access to it.
        </p>
        <TransitionLink className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline" href="/roadmaps">
          <ArrowLeft className="size-4" /> Back to roadmaps
        </TransitionLink>
      </main>
    );
  }

  return (
    <WorkspaceProvider roadmapId={workspace.roadmap.id} initialWorkspace={workspace}>
      <div className="sticky top-12 z-30 border-b bg-surface-raised">
        <div className="mx-auto grid h-10 max-w-[1440px] grid-cols-1 items-center px-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:px-5">
          <TransitionLink href="/roadmaps" className="hidden truncate pr-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block" title={workspace.roadmap.title}>
            {workspace.roadmap.title}
          </TransitionLink>
          <nav aria-label="Roadmap sections" className="grid h-full w-full grid-cols-3 items-center sm:flex sm:w-auto">
            {sections.map((section) => {
              const href = `/roadmaps/${slug}/${section}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <TransitionLink
                  key={section}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-full min-w-20 items-center justify-center px-3 text-xs font-medium capitalize text-muted-foreground transition-colors duration-150 hover:bg-accent/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    active && "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:bg-primary after:transition-transform after:duration-200",
                  )}
                >
                  {section}
                </TransitionLink>
              );
            })}
          </nav>
          <span className="hidden sm:block" aria-hidden="true" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-5 sm:py-6">
        <div className="mb-5 min-w-0 border-b border-border/75 pb-4">
          <h1 className="text-xl font-semibold tracking-[-0.025em] sm:truncate sm:text-2xl">{workspace.roadmap.title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{workspace.roadmap.objective}</p>
        </div>
        <PresenceSwap
          transitionKey={activeSegment ?? "workspace"}
        >
          {children}
        </PresenceSwap>
      </main>
    </WorkspaceProvider>
  );
}
