"use client";

import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransitionLink, useNavigationProgress } from "@/components/shared/navigation-transition";
import { getHostname } from "@/lib/roadmap-utils";
import { useRoadmap } from "@/state/roadmap-store";
import { DeleteResourceDialog } from "./delete-resource-dialog";
import { ResourceFormDialog } from "./resource-form-dialog";

const date = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
export function ResourceDetail({ resourceId }: { resourceId: string }) {
  const { state, dispatch } = useRoadmap(); const router = useRouter(); const { beginNavigation } = useNavigationProgress(); const resource = state.roadmap.resources.find((item) => item.id === resourceId); const [editing, setEditing] = useState(false); const [deleting, setDeleting] = useState(false);
  if (!resource) return <div className="mx-auto max-w-xl py-16 text-center"><h2 className="text-lg font-semibold">Resource not found</h2><p className="mt-2 text-sm text-muted-foreground">It may have been removed or belonged to an earlier preview session.</p><TransitionLink className="mt-4 inline-flex text-sm font-medium text-primary hover:underline" href={`/roadmaps/${state.roadmap.slug}/plan`}>Back to resources</TransitionLink></div>;
  const back = `/roadmaps/${state.roadmap.slug}/plan`;
  return <article className="mx-auto max-w-4xl"><div className="mb-4 flex items-center justify-between"><TransitionLink href={back} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft /> Resources</TransitionLink><div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button><Button variant="outline" onClick={() => setDeleting(true)}><Trash2 /> Delete</Button></div></div><div className="rounded-lg border bg-surface-raised p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="capitalize">{resource.type}</Badge>{resource.tags.map((tag) => <span key={tag} className="font-mono text-[10px] text-muted-foreground">#{tag}</span>)}</div><h2 className="mt-4 text-2xl font-semibold tracking-[-0.025em] break-words">{resource.title}</h2>{resource.url && <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">{getHostname(resource.url)} <ExternalLink className="size-3.5" /></a>}<div className="mt-6 border-t pt-5"><h3 className="text-sm font-semibold">Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/85">{resource.notes || "No notes have been added."}</p></div><dl className="mt-7 grid grid-cols-2 gap-4 border-t pt-4 text-xs text-muted-foreground"><div><dt>Created</dt><dd className="mt-1 text-foreground">{date.format(new Date(resource.createdAt))}</dd></div><div><dt>Updated</dt><dd className="mt-1 text-foreground">{date.format(new Date(resource.updatedAt))}</dd></div></dl></div><ResourceFormDialog resource={resource} open={editing} onOpenChange={setEditing} /><DeleteResourceDialog resource={resource} open={deleting} onOpenChange={setDeleting} onConfirm={() => { dispatch({ type: "DELETE_RESOURCE", payload: resource.id }); beginNavigation(); router.push(back); }} /></article>;
}
