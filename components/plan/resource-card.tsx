"use client";

import {
  BookOpen,
  Ellipsis,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getHostname } from "@/lib/roadmap-utils";
import type { Resource, ResourceType } from "@/lib/types";
import { TransitionLink } from "@/components/shared/navigation-transition";

const typeMeta: Record<
  ResourceType,
  { label: string; icon: typeof BookOpen; accent: string; tint: string }
> = {
  article: { label: "Article", icon: BookOpen, accent: "bg-coral", tint: "bg-[#f8ece6] text-[#874532]" },
  video: { label: "Video", icon: Video, accent: "bg-primary", tint: "bg-secondary text-secondary-foreground" },
  note: { label: "Note", icon: FileText, accent: "bg-gold", tint: "bg-[#f7f0de] text-[#775515]" },
};

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  href,
}: {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  href: string;
}) {
  const meta = typeMeta[resource.type];
  const Icon = meta.icon;

  return (
    <Card className="relative min-h-0 gap-0 overflow-hidden border-border bg-surface-raised py-0 shadow-none transition-[border-color,background-color] duration-150 hover:border-border-strong">
      <span className={cn("absolute inset-x-0 top-0 h-0.5", meta.accent)} />
      <CardHeader className="px-4 pt-4 pb-0">
        <Badge variant="secondary" className={cn("gap-1.5 border-transparent font-mono text-[10px]", meta.tint)}>
          <Icon className="size-3" />
          {meta.label}
        </Badge>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${resource.title}`}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-4 pt-4 pb-4">
        <TransitionLink href={href} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><h3 className="text-sm font-semibold leading-5 tracking-[-0.01em] text-foreground hover:text-primary">
          {resource.title}
        </h3></TransitionLink>
        {resource.url && (
          <a
            className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-[#244f45] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={resource.url}
            target="_blank"
            rel="noreferrer"
          >
            {getHostname(resource.url)}
            <ExternalLink className="size-3" />
          </a>
        )}
        <TransitionLink href={href} className="mt-3 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><p className="line-clamp-3 text-xs leading-5 text-muted-foreground">
          {resource.notes || "No note yet. Add a thought while it is fresh."}
        </p></TransitionLink>
        {resource.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {resource.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
