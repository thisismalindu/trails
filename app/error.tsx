"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-ember/10 text-ember">
          <AlertTriangle aria-hidden="true" className="size-4" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Trails could not load your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your data is still safe. Check your connection, then try loading it again.
        </p>
        <Button className="mt-4" onClick={reset}>
          <RotateCw aria-hidden="true" /> Try again
        </Button>
      </section>
    </main>
  );
}
