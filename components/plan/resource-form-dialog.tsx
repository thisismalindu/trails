"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FileText, Video } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeResourceTags,
  resourceToFormValues,
} from "@/lib/roadmap-utils";
import { resourceSchema } from "@/lib/schemas";
import type { Resource, ResourceType } from "@/lib/types";
import { useRoadmap } from "@/state/roadmap-store";

type ResourceFormValues = z.infer<typeof resourceSchema>;

const resourceTypes = [
  { value: "article", label: "Article", icon: BookOpen },
  { value: "video", label: "Video", icon: Video },
  { value: "note", label: "Note", icon: FileText },
] as const;

export function ResourceFormDialog({
  resource,
  open,
  onOpenChange,
  defaultType = "article",
}: {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: ResourceType;
}) {
  const { dispatch } = useRoadmap();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { ...resourceToFormValues(resource ?? undefined), type: resource?.type ?? defaultType },
  });

  useEffect(() => {
    if (open) reset({ ...resourceToFormValues(resource ?? undefined), type: resource?.type ?? defaultType });
  }, [open, reset, resource, defaultType]);

  const onSubmit = (values: ResourceFormValues) => {
    const timestamp = new Date().toISOString();
    dispatch({
      type: "SAVE_RESOURCE",
      payload: {
        id: resource?.id ?? crypto.randomUUID(),
        type: values.type,
        title: values.title.trim(),
        url: values.url.trim(),
        notes: values.notes.trim(),
        tags: normalizeResourceTags(values.tags),
        createdAt: resource?.createdAt ?? timestamp,
        updatedAt: timestamp,
      },
    });
    toast.success(resource ? "Resource updated" : "Resource added");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {resource ? "Edit resource" : "Add something worth returning to"}
          </DialogTitle>
          <DialogDescription>
            Save the link and the thought that made it useful.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="resource-type">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="resource-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(({ value, label, icon: Icon }) => (
                        <SelectItem key={value} value={value}>
                          <Icon className="size-3.5" />
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input
                id="resource-title"
                autoFocus
                placeholder="A useful title"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "resource-title-error" : undefined}
                {...register("title")}
              />
              {errors.title && (
                <p id="resource-title-error" className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              type="url"
              placeholder="https://"
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? "resource-url-error" : undefined}
              {...register("url")}
            />
            {errors.url && (
              <p id="resource-url-error" className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-notes">Notes</Label>
            <Textarea
              id="resource-notes"
              rows={4}
              placeholder="Why is this useful? What should you remember?"
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-tags">Tags</Label>
            <Input
              id="resource-tags"
              placeholder="foundations, practice"
              {...register("tags")}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save resource</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
