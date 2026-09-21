import { Route } from "lucide-react";
import { TransitionLink } from "@/components/shared/navigation-transition";

export function Brand({ href = "/roadmaps" }: { href?: string }) {
  return (
    <TransitionLink
      href={href}
      className="flex h-12 items-center gap-2 font-semibold tracking-[-0.02em] text-shell-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Route className="size-4 text-ember" strokeWidth={2.4} />
      <span>trails</span>
    </TransitionLink>
  );
}
