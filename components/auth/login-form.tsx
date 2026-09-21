"use client";

import { GitBranch, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { useNavigationProgress } from "@/components/shared/navigation-transition";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const { beginNavigation } = useNavigationProgress();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startGitHubLogin = async () => {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/roadmaps` },
      });
      if (authError) throw authError;
      beginNavigation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "GitHub sign-in could not be started.");
      setPending(false);
    }
  };

  return (
    <main className="min-h-svh bg-shell text-shell-foreground">
      <div className="border-b border-shell-border px-5">
        <Brand href="/login" />
      </div>
      <div className="mx-auto flex min-h-[calc(100svh-3.05rem)] w-full max-w-sm items-center px-5 py-10">
        <div className="relative w-full rounded-lg border border-shell-border bg-shell-input/45 p-5 sm:p-6">
          <div aria-hidden="true" className="trail-route-line absolute -top-px right-6 left-6 h-px opacity-80" />
          <h1 className="text-xl font-semibold tracking-[-0.025em]">Sign in to Trails</h1>
          <p className="mt-1 text-sm text-shell-muted">Use your GitHub account to access your learning roadmaps.</p>
          <Button type="button" disabled={pending} onClick={startGitHubLogin} className="mt-6 w-full bg-ember text-white hover:bg-[#af523c] active:bg-[#934632]">
            {pending ? <LoaderCircle className="animate-spin" /> : <GitBranch />} Continue with GitHub
          </Button>
          {error && <p role="alert" className="mt-3 text-xs text-ember-light">{error}</p>}
        </div>
      </div>
    </main>
  );
}
