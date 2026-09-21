"use client";

import { AlertCircle, Check, Clipboard, Download, FileJson, Upload } from "lucide-react";
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { readTextFile } from "@/lib/roadmap-utils";
import { downloadImportExample } from "@/lib/import-examples";

type JsonImportPanelProps<T> = {
  kind: "progress" | "quiz";
  prompt: string;
  schema: ZodType<T>;
  onConfirm: (data: T) => void;
  summary: (data: T) => ReactNode;
  mode?: "replace" | "create";
};

export function JsonImportPanel<T>({ kind, prompt, schema, onConfirm, summary, mode = "replace" }: JsonImportPanelProps<T>) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<T | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const validate = (value: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("This is not valid JSON. Check commas, quotes, and brackets.");
      return;
    }
    const result = schema.safeParse(parsed);
    if (!result.success) {
      const issue = result.error.issues[0];
      setError(issue ? `${issue.path.join(".") || "File"}: ${issue.message}` : `This file does not match the ${kind} format.`);
      return;
    }
    setError("");
    setPreview(result.data);
    setImportOpen(false);
    setPreviewOpen(true);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("Choose a JSON file smaller than 1 MB.");
      return;
    }
    setReadingFile(true);
    try {
      const contents = await readTextFile(file);
      setText(contents);
      validate(contents);
    } catch {
      setError("The selected file could not be read. Try another JSON file.");
    } finally {
      setReadingFile(false);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2_000);
      toast.success("Prompt copied");
    } catch {
      toast.error("Copy failed. Try again from a browser with clipboard access.");
    }
  };

  const confirm = () => {
    if (!preview) return;
    onConfirm(preview);
    setPreviewOpen(false);
    setText("");
    setPreview(null);
    toast.success(`${kind === "progress" ? "Progress plan" : "Quiz"} imported`);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-border/80 bg-surface-raised/55 px-3 py-2">
        <p className="text-xs text-muted-foreground">Schema v1 · {mode === "create" ? `Importing creates a new ${kind}.` : `Importing replaces the current ${kind} document.`}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" aria-live="polite" onClick={copyPrompt}>
            {copied ? <Check /> : <Clipboard />}
            {copied ? "Copied" : "Copy prompt"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadImportExample(kind)}><Download /> Example</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><FileJson /> Import JSON</Button>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pr-12">
            <DialogTitle>Import {kind} JSON</DialogTitle>
            <DialogDescription>Paste schema v1 JSON or upload a file. Nothing changes until preview and confirmation.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-6">
            <Textarea className="h-[min(50dvh,28rem)] min-h-32 max-h-none resize-none overflow-auto bg-surface-inset/45 font-mono text-xs leading-5 sm:min-h-48" value={text} onChange={(event) => setText(event.target.value)} placeholder={`Paste ${kind} JSON here…`} aria-label={`Paste ${kind} JSON`} aria-invalid={Boolean(error)} />
            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle /><AlertTitle>Import could not be previewed</AlertTitle><AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} hidden />
          <DialogFooter className="border-t px-6 py-4 sm:justify-between">
            <Button variant="ghost" disabled={readingFile} onClick={() => fileRef.current?.click()}><Upload /> {readingFile ? "Reading…" : "Upload file"}</Button>
            <Button disabled={!text.trim() || readingFile} onClick={() => validate(text)}><FileJson /> Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review {kind} import</DialogTitle>
            <DialogDescription>{mode === "create" ? `Confirming adds this as a new ${kind} in the current preview.` : `Confirming permanently replaces the current ${kind} document in this preview. This cannot be merged or undone.`}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 p-4">{preview ? summary(preview) : null}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewOpen(false); setImportOpen(true); }}>Go back</Button>
            <Button onClick={confirm}><Check /> Confirm import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
