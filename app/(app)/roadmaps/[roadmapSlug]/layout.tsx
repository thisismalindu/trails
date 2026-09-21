import type { ReactNode } from "react";
import { RoadmapWorkspaceShell } from "@/components/layout/roadmap-workspace-shell";

export default async function RoadmapLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ roadmapSlug: string }>;
}) {
  const { roadmapSlug } = await params;
  return <RoadmapWorkspaceShell slug={roadmapSlug}>{children}</RoadmapWorkspaceShell>;
}
