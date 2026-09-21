import type { ReactNode } from "react";
import { RoadmapsTransitionShell } from "@/components/layout/roadmaps-transition-shell";

export default function RoadmapsLayout({ children }: { children: ReactNode }) {
  return <RoadmapsTransitionShell>{children}</RoadmapsTransitionShell>;
}
