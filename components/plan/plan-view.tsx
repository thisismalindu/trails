"use client";

import { BookOpen, ChevronDown, FileText, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Resource, ResourceFilter, ResourceType } from "@/lib/types";
import { useRoadmap } from "@/state/roadmap-store";
import { SectionHeader } from "@/components/shared/section-header";
import { DeleteResourceDialog } from "./delete-resource-dialog";
import { EmptyState } from "./empty-state";
import { ResourceCard } from "./resource-card";
import { ResourceFormDialog } from "./resource-form-dialog";

const filters: Array<{ value: ResourceFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "video", label: "Videos" },
  { value: "note", label: "Notes" },
];

export function PlanView() {
  const { state, dispatch } = useRoadmap();
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createType, setCreateType] = useState<ResourceType>("article");
  const [deleting, setDeleting] = useState<Resource | null>(null);

  const filteredResources = useMemo(
    () =>
      state.roadmap.resources.filter(
        (resource) => filter === "all" || resource.type === filter,
      ),
    [filter, state.roadmap.resources],
  );

  const topicCount = new Set(
    state.roadmap.resources.flatMap((resource) => resource.tags),
  ).size;

  const openCreate = (type: ResourceType = "article") => {
    setEditing(null);
    setCreateType(type);
    setFormOpen(true);
  };

  const openEdit = (resource: Resource) => {
    setEditing(resource);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    dispatch({ type: "DELETE_RESOURCE", payload: deleting.id });
    toast.success("Resource removed");
    setDeleting(null);
  };

  return (
    <section aria-labelledby="plan-title">
      <SectionHeader
        title="Resources"
        description="Articles, videos, and working notes for this roadmap."
        action={
          <DropdownMenu><DropdownMenuTrigger asChild><Button>Add resource <ChevronDown /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openCreate("article")}><BookOpen /> Article</DropdownMenuItem><DropdownMenuItem onSelect={() => openCreate("video")}><Video /> Video</DropdownMenuItem><DropdownMenuItem onSelect={() => openCreate("note")}><FileText /> Note</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-border/80 bg-surface-raised/45 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{state.roadmap.resources.length} saved</Badge>
          <Badge variant="outline">{topicCount} topics</Badge>
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Filter resources">
          {filters.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={filter === item.value ? "default" : "ghost"}
              aria-pressed={filter === item.value}
              className={cn("rounded-md text-xs", filter !== item.value && "text-muted-foreground")}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="resource-grid grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              href={`/roadmaps/${state.roadmap.slug}/plan/${resource.id}`}
              onEdit={() => openEdit(resource)}
              onDelete={() => setDeleting(resource)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            filter === "all"
              ? "Your board is waiting."
              : `No ${filters.find((item) => item.value === filter)?.label.toLowerCase()} yet.`
          }
          description="Save a reference, a note, or a question and it will land here."
          onAction={() => openCreate("article")}
        />
      )}

      <ResourceFormDialog
        resource={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType={createType}
      />
      <DeleteResourceDialog
        resource={deleting}
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
