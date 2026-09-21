"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { PresenceSwap } from "@/components/shared/route-transition";

export function RoadmapsTransitionShell({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  return (
    <PresenceSwap transitionKey={segment ?? "chooser"}>
      {children}
    </PresenceSwap>
  );
}
