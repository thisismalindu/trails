"use client";

import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Resource } from "@/lib/types";

export function DeleteResourceDialog({
  resource,
  open,
  onOpenChange,
  onConfirm,
}: {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <Trash2 className="size-4" />
          </div>
          <AlertDialogTitle>Remove this resource?</AlertDialogTitle>
          <AlertDialogDescription>
            “{resource?.title}” will be removed from this temporary roadmap. This
            cannot be undone during the current session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep resource</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete resource
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
