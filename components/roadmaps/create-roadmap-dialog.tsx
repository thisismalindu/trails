"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uniqueRoadmapSlug } from "@/lib/roadmap-utils";
import { onboardingSchema } from "@/lib/schemas";
import { createEmptyWorkspace, useRoadmaps } from "@/state/roadmap-store";
import { useNavigationProgress } from "@/components/shared/navigation-transition";

type RoadmapValues = z.infer<typeof onboardingSchema>;

export function CreateRoadmapDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { beginNavigation } = useNavigationProgress();
  const { state, dispatch } = useRoadmaps();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoadmapValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { title: "", objective: "" },
  });

  const submit = async (values: RoadmapValues) => {
    const slug = uniqueRoadmapSlug(values.title, state.roadmaps.map((item) => item.slug));
    const workspace = createEmptyWorkspace({
      id: crypto.randomUUID(),
      slug,
      title: values.title,
      objective: values.objective,
    });
    const saved = await dispatch({ type: "CREATE_ROADMAP", payload: workspace });
    if (!saved) { toast.error("Could not create roadmap", { description: "Check your connection and try again." }); return; }
    reset();
    onOpenChange(false);
    toast.success("Roadmap created");
    beginNavigation(); router.push(`/roadmaps/${slug}/plan`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create roadmap</DialogTitle>
          <DialogDescription>Give this learning path a clear outcome. It will be saved to your account.</DialogDescription>
        </DialogHeader>
        <form id="create-roadmap-form" className="space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="space-y-1.5">
            <Label htmlFor="roadmap-title">Title</Label>
            <Input id="roadmap-title" autoFocus placeholder="Software architecture fundamentals" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "roadmap-title-error" : undefined} {...register("title")} />
            {errors.title && <p id="roadmap-title-error" className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roadmap-objective">Learning objective</Label>
            <Textarea id="roadmap-objective" className="min-h-24" placeholder="What should you be able to explain or build?" aria-invalid={Boolean(errors.objective)} aria-describedby={errors.objective ? "roadmap-objective-error" : undefined} {...register("objective")} />
            {errors.objective && <p id="roadmap-objective-error" className="text-xs text-destructive">{errors.objective.message}</p>}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="create-roadmap-form" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Create roadmap"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
