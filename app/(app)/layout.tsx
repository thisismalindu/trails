import type { ReactNode } from "react";
import { ApplicationShell } from "@/components/layout/application-shell";
import { Toaster } from "@/components/ui/sonner";
import { RoadmapsProvider } from "@/state/roadmap-store";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return (
    <RoadmapsProvider>
      <ApplicationShell>{children}</ApplicationShell>
      <Toaster position="bottom-right" richColors closeButton />
    </RoadmapsProvider>
  );
}
