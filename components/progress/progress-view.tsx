"use client";

import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { progressSchema } from "@/lib/schemas";
import { getProgressCelebration } from "@/lib/celebration-utils";
import { buildLearningPrompt, getProgressStats } from "@/lib/roadmap-utils";
import type { ProgressData, ProgressStatus } from "@/lib/types";
import { useRoadmap } from "@/state/roadmap-store";
import { JsonImportPanel } from "@/components/shared/json-import-panel";
import { SectionHeader } from "@/components/shared/section-header";
import { useCelebration } from "@/components/shared/celebration-provider";
import { ProgressSection } from "./progress-section";
import { ProgressSummary } from "./progress-summary";

export function ProgressView() {
  const { state, dispatch } = useRoadmap();
  const { celebrate } = useCelebration();
  const stats = getProgressStats(state.progress);
  const [editor, setEditor] = useState<{ kind: "section" | "item"; sectionId?: string; itemId?: string; value: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "section" | "item"; sectionId: string; itemId?: string } | null>(null);

  const setProgressStatus = (sectionId: string, itemId: string, status: ProgressStatus) => {
    const celebration = status === "complete" ? getProgressCelebration(state.progress, sectionId, itemId) : null;
    dispatch({ type: "SET_PROGRESS_STATUS", payload: { sectionId, itemId, status } });
    if (celebration === "roadmap-complete") {
      celebrate({ kind: "roadmap-complete", roadmapTitle: state.roadmap.title });
    } else if (celebration === "section-complete") {
      const section = state.progress.sections.find((entry) => entry.id === sectionId);
      if (section) {
        celebrate({
          kind: "section-complete",
          sectionTitle: section.title,
          roadmapTitle: state.roadmap.title,
        });
      }
    }
  };

  return (
    <section aria-labelledby="progress-title">
      <SectionHeader
        title="Progress"
        description="Track the steps generated from your objective and saved resources."
        action={<div className="flex items-center gap-2"><Badge variant="secondary">
            {state.progressImport.source === "json" ? "Imported plan" : state.progressImport.source === "sample" ? "Sample plan" : "Plan"}
          </Badge><Button size="sm" onClick={() => setEditor({ kind: "section", value: "" })}><Plus /> Add section</Button></div>}
      />

      <JsonImportPanel<ProgressData>
        kind="progress"
        prompt={buildLearningPrompt("progress", state.roadmap)}
        schema={progressSchema}
        onConfirm={(data) => dispatch({ type: "IMPORT_PROGRESS", payload: data })}
        summary={(data) => {
          const itemCount = data.sections.reduce(
            (total, section) => total + section.items.length,
            0,
          );
          return (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{data.sections.length} sections</p>
              <p className="text-muted-foreground">{itemCount} trackable learning steps</p>
            </div>
          );
        }}
      />

      {state.progress.sections.length > 0 ? (
        <>
          <ProgressSummary stats={stats} />
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {state.progress.sections.map((section) => (
          <ProgressSection
            key={section.id}
            section={section}
            onStatusChange={(itemId, status) => setProgressStatus(section.id, itemId, status)}
            onAddItem={() => setEditor({ kind: "item", sectionId: section.id, value: "" })}
            onEdit={() => setEditor({ kind: "section", sectionId: section.id, value: section.title })}
            onDelete={() => setPendingDelete({ kind: "section", sectionId: section.id })}
            onMove={(direction) => dispatch({ type: "MOVE_PROGRESS_SECTION", payload: { sectionId: section.id, direction } })}
            onEditItem={(itemId) => setEditor({ kind: "item", sectionId: section.id, itemId, value: section.items.find((item) => item.id === itemId)?.label ?? "" })}
            onDeleteItem={(itemId) => setPendingDelete({ kind: "item", sectionId: section.id, itemId })}
            onMoveItem={(itemId, direction) => dispatch({ type: "MOVE_PROGRESS_ITEM", payload: { sectionId: section.id, itemId, direction } })}
          />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed px-5 py-10 text-center">
          <h3 className="text-sm font-semibold">No progress plan yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Copy the prompt or import progress JSON to begin tracking this roadmap.</p>
        </div>
      )}
      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}><DialogContent><DialogHeader><DialogTitle>{editor?.itemId || editor?.sectionId ? "Edit" : "Add"} {editor?.kind}</DialogTitle><DialogDescription>Keep the milestone specific and achievable.</DialogDescription></DialogHeader><div className="space-y-1.5"><Label htmlFor="progress-label">{editor?.kind === "section" ? "Section title" : "Item label"}</Label><Input id="progress-label" autoFocus value={editor?.value ?? ""} onChange={(event) => editor && setEditor({ ...editor, value: event.target.value })} /></div><DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button disabled={!editor?.value.trim()} onClick={() => { if (!editor) return; if (editor.kind === "section") { if (editor.sectionId) dispatch({ type: "UPDATE_PROGRESS_SECTION", payload: { sectionId: editor.sectionId, title: editor.value.trim() } }); else dispatch({ type: "ADD_PROGRESS_SECTION", payload: { id: crypto.randomUUID(), title: editor.value.trim(), items: [] } }); } else if (editor.sectionId) { if (editor.itemId) dispatch({ type: "UPDATE_PROGRESS_ITEM", payload: { sectionId: editor.sectionId, itemId: editor.itemId, label: editor.value.trim() } }); else dispatch({ type: "ADD_PROGRESS_ITEM", payload: { sectionId: editor.sectionId, item: { id: crypto.randomUUID(), label: editor.value.trim(), status: "not-started" } } }); } setEditor(null); }}>Save</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this {pendingDelete?.kind}?</AlertDialogTitle><AlertDialogDescription>{pendingDelete?.kind === "section" ? "Every item in this section will also be removed." : "This milestone will be removed from the plan."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (!pendingDelete) return; if (pendingDelete.kind === "section") dispatch({ type: "DELETE_PROGRESS_SECTION", payload: { sectionId: pendingDelete.sectionId } }); else if (pendingDelete.itemId) dispatch({ type: "DELETE_PROGRESS_ITEM", payload: { sectionId: pendingDelete.sectionId, itemId: pendingDelete.itemId } }); setPendingDelete(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </section>
  );
}
