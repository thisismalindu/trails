import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApplicationShell } from "@/components/layout/application-shell";
import { Toaster } from "@/components/ui/sonner";
import { RoadmapsProvider } from "@/state/roadmap-store";
import { createClient } from "@/lib/supabase/server";
import { createTrailsRepository } from "@/lib/persistence/supabase-repository";

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  if (!userId) redirect("/login");
  const userEmail = typeof claims.email === "string" ? claims.email : "GitHub account";
  const initialRoadmaps = await createTrailsRepository(supabase, userId).listRoadmaps();

  return (
    <RoadmapsProvider initialRoadmaps={initialRoadmaps} userId={userId} userEmail={userEmail}>
      <ApplicationShell>{children}</ApplicationShell>
      <Toaster position="bottom-right" richColors closeButton />
    </RoadmapsProvider>
  );
}
