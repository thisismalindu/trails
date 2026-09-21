"use client";

import type { ReactNode } from "react";
import { CelebrationProvider } from "@/components/shared/celebration-provider";
import { AppTopbar } from "./app-topbar";

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
      <CelebrationProvider>
        <AppTopbar />
        {children}
      </CelebrationProvider>
  );
}
