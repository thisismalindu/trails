import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RoadmapWorkspaceShell } from "@/components/layout/roadmap-workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { createTrailsRepository } from "@/lib/persistence/supabase-repository";

export default async function RoadmapLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ roadmapSlug: string }>;
}) {
  const { roadmapSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const workspace = await createTrailsRepository(supabase, userId).loadWorkspaceBySlug(roadmapSlug);
  return <RoadmapWorkspaceShell slug={roadmapSlug} initialWorkspace={workspace}>{children}</RoadmapWorkspaceShell>;
}
