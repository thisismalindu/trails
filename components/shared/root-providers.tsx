"use client";

import type { ReactNode } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import { NavigationTransitionProvider } from "./navigation-transition";

export function RootProviders({ children }: { children: ReactNode }) {
  return <NavigationTransitionProvider><SkeletonTheme baseColor="var(--surface-inset)" highlightColor="var(--surface-raised)" borderRadius="6px">{children}</SkeletonTheme></NavigationTransitionProvider>;
}
