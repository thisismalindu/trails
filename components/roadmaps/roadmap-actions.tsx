"use client";

import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { onboardingSchema } from "@/lib/schemas";
import type { RoadmapSummary } from "@/lib/types";
import { useRoadmaps } from "@/state/roadmap-store";

type Values = z.infer<typeof onboardingSchema>;
export function RoadmapActions({ roadmap }: { roadmap: RoadmapSummary }) {
  const { dispatch } = useRoadmaps();
  const [editOpen, setEditOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false);
  const { register, reset, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(onboardingSchema), defaultValues: { title: roadmap.title, objective: roadmap.objective } });
  useEffect(() => { if (editOpen) reset({ title: roadmap.title, objective: roadmap.objective }); }, [editOpen, reset, roadmap]);
  const update = (values: Values) => { dispatch({ type: "UPDATE_ROADMAP", roadmapId: roadmap.id, payload: values }); setEditOpen(false); toast.success("Roadmap updated"); };
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${roadmap.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setEditOpen(true)}><Pencil /> Edit details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => dispatch({ type: roadmap.archivedAt ? "RESTORE_ROADMAP" : "ARCHIVE_ROADMAP", roadmapId: roadmap.id })}>{roadmap.archivedAt ? <RotateCcw /> : <Archive />}{roadmap.archivedAt ? "Restore" : "Archive"}</DropdownMenuItem>
        <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 /> Delete permanently</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu>
    <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent><DialogHeader><DialogTitle>Edit roadmap</DialogTitle><DialogDescription>Update the name and learning outcome without changing its URL.</DialogDescription></DialogHeader>
      <form id={`edit-${roadmap.id}`} className="space-y-4" onSubmit={handleSubmit(update)}><div className="space-y-1.5"><Label htmlFor={`title-${roadmap.id}`}>Title</Label><Input id={`title-${roadmap.id}`} aria-invalid={!!errors.title} aria-describedby={errors.title ? `title-error-${roadmap.id}` : undefined} {...register("title")} />{errors.title && <p id={`title-error-${roadmap.id}`} className="text-xs text-destructive">{errors.title.message}</p>}</div>
        <div className="space-y-1.5"><Label htmlFor={`objective-${roadmap.id}`}>Objective</Label><Textarea id={`objective-${roadmap.id}`} aria-invalid={!!errors.objective} aria-describedby={errors.objective ? `objective-error-${roadmap.id}` : undefined} {...register("objective")} />{errors.objective && <p id={`objective-error-${roadmap.id}`} className="text-xs text-destructive">{errors.objective.message}</p>}</div></form>
      <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" form={`edit-${roadmap.id}`}>Save changes</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete “{roadmap.title}”?</AlertDialogTitle><AlertDialogDescription>This permanently removes the roadmap, its resources, progress, quizzes, and quiz attempts from your account.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => dispatch({ type: "DELETE_ROADMAP", roadmapId: roadmap.id })}>Delete roadmap</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
