"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/schemas";
import { useNavigationProgress } from "@/components/shared/navigation-transition";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { beginNavigation } = useNavigationProgress();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <main className="min-h-svh bg-shell text-shell-foreground">
      <div className="border-b border-shell-border px-5">
        <Brand href="/login" />
      </div>
      <div className="mx-auto flex min-h-[calc(100svh-3.05rem)] w-full max-w-sm items-center px-5 py-10">
        <div className="relative w-full rounded-lg border border-shell-border bg-shell-input/45 p-5 sm:p-6">
          <div aria-hidden="true" className="trail-route-line absolute -top-px right-6 left-6 h-px opacity-80" />
          <h1 className="text-xl font-semibold tracking-[-0.025em]">Sign in to Trails</h1>
          <p className="mt-1 text-sm text-shell-muted">Frontend preview. No credentials are stored or sent.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(() => { beginNavigation(); router.push("/roadmaps"); })}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-shell-foreground">Email or username</Label>
              <Input id="email" autoFocus autoComplete="username" className="border-shell-border bg-shell-input text-shell-foreground placeholder:text-shell-muted" placeholder="Anything works" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
              {errors.email && <p id="email-error" className="text-xs text-ember-light">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-shell-foreground">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" className="border-shell-border bg-shell-input text-shell-foreground placeholder:text-shell-muted" placeholder="Enter anything" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} {...register("password")} />
              {errors.password && <p id="password-error" className="text-xs text-ember-light">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-ember text-white hover:bg-[#af523c] active:bg-[#934632]">
              Continue <ArrowRight />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
