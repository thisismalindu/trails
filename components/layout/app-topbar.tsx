"use client";

import { BookOpen, Check, CircleAlert, CircleUserRound, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { TransitionLink } from "@/components/shared/navigation-transition";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRoadmaps } from "@/state/roadmap-store";
import { Brand } from "./brand";

export function AppTopbar() {
  const { state, retry } = useRoadmaps();
  const status = state.sync.status;
  return (
    <header className="sticky top-0 z-40 h-12 border-b border-shell-border bg-shell text-shell-foreground">
      <div className="mx-auto flex h-full max-w-[1440px] items-center px-4 sm:px-5">
        <Brand />
        <nav aria-label="Global navigation" className="ml-7 h-full">
          <TransitionLink
            href="/roadmaps"
            className="flex h-full items-center gap-2 border-b-2 border-ember px-2 text-xs font-medium text-shell-foreground transition-colors duration-150 hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember"
          >
            <BookOpen className="size-3.5" /> Roadmaps
          </TransitionLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-[11px] text-shell-muted sm:flex" role="status" aria-live="polite">
            {status === "saving" && <><LoaderCircle className="size-3 animate-spin" /> Saving…</>}
            {status === "saved" && <><Check className="size-3" /> Saved</>}
            {(status === "error" || status === "unauthorized") && <><CircleAlert className="size-3 text-ember" /> {status === "error" ? "Save failed" : "Session expired"}<Button size="xs" variant="ghost" className="h-7 text-shell-foreground" onClick={retry}><RefreshCw /> Retry</Button></>}
          </div>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-9 gap-2 text-shell-muted hover:bg-white/6 hover:text-shell-foreground"><span className="hidden sm:inline">malindu@example.com</span><CircleUserRound className="size-5 text-shell-foreground" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><span className="block text-xs text-muted-foreground">Signed in as</span><span className="block truncate">malindu@example.com</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><TransitionLink href="/login"><LogOut /> Sign out</TransitionLink></DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
