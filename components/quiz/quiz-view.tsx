"use client";

import { Copy, Ellipsis, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { JsonImportPanel } from "@/components/shared/json-import-panel";
import { SectionHeader } from "@/components/shared/section-header";
import { TransitionLink } from "@/components/shared/navigation-transition";
import { buildLearningPrompt } from "@/lib/roadmap-utils";
import { createSavedQuiz, getBestAttempt, quizDefinitionFromImport } from "@/lib/quiz-utils";
import { quizSchema } from "@/lib/schemas";
import type { QuizData, SavedQuiz } from "@/lib/types";
import { useRoadmap } from "@/state/roadmap-store";
import { QuizEditorDialog } from "./quiz-editor-dialog";

const format = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
export function QuizView() {
  const { state, dispatch } = useRoadmap();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SavedQuiz | null>(null);
  const openCreate = () => { setEditing(null); setEditorOpen(true); };

  return <section aria-labelledby="quiz-title">
    <SectionHeader title="Quizzes" description="Build reusable checks, resume unfinished runs, and compare attempts." action={<Button onClick={openCreate}><Plus /> New quiz</Button>} />
    <JsonImportPanel<QuizData> kind="quiz" mode="create" prompt={buildLearningPrompt("quiz", state.roadmap)} schema={quizSchema} onConfirm={(data) => dispatch({ type: "CREATE_QUIZ", payload: createSavedQuiz(quizDefinitionFromImport(data), "json") })} summary={(data) => <div className="text-sm"><p className="font-semibold">{data.title}</p><p className="text-muted-foreground">Creates a new quiz with {data.questions.length} questions</p></div>} />
    {state.quizzes.length ? <div className="overflow-hidden rounded-lg border bg-surface-raised">
      <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_8rem_2rem] gap-4 border-b bg-surface-inset/65 px-4 py-2 text-xs font-medium text-muted-foreground md:grid"><span>Quiz</span><span>Questions</span><span>Best</span><span>Latest</span><span /></div>
      {state.quizzes.map((quiz) => {
        const best = getBestAttempt(quiz); const latest = quiz.attempts[0];
        return <div key={quiz.id} className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1fr)_7rem_7rem_8rem_2rem] md:items-center md:gap-4">
          <div className="min-w-0"><TransitionLink href={`/roadmaps/${state.roadmap.slug}/quiz/${quiz.id}`} className="font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{quiz.definition.title}</TransitionLink><p className="mt-0.5 text-xs text-muted-foreground">{quiz.session && quiz.session.view === "taking" ? `Resume at question ${quiz.session.currentIndex + 1}` : `${quiz.attempts.length} attempt${quiz.attempts.length === 1 ? "" : "s"}`}</p></div>
          <div className="col-span-2 grid grid-cols-3 gap-3 border-t pt-3 md:contents md:border-0 md:pt-0"><span className="text-xs text-muted-foreground"><span className="block md:hidden">Questions</span><span className="font-mono text-foreground">{quiz.definition.questions.length}</span></span><span className="text-xs text-muted-foreground"><span className="block md:hidden">Best</span><span className="font-mono text-foreground">{best ? `${best.percent}%` : "—"}</span></span><span className="text-xs text-muted-foreground"><span className="block md:hidden">Latest</span>{latest ? `${latest.percent}% · ${format.format(new Date(latest.completedAt))}` : "Not taken"}</span></div>
          <DropdownMenu><DropdownMenuTrigger asChild><Button className="absolute right-4 md:static" variant="ghost" size="icon-sm" aria-label={`Actions for ${quiz.definition.title}`}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><TransitionLink href={`/roadmaps/${state.roadmap.slug}/quiz/${quiz.id}`}><Play /> {quiz.session ? "Resume" : "Start"}</TransitionLink></DropdownMenuItem><DropdownMenuItem onSelect={() => { setEditing(quiz); setEditorOpen(true); }}><Pencil /> Edit</DropdownMenuItem><DropdownMenuItem onSelect={() => { const duplicate = createSavedQuiz({ ...quiz.definition, title: `${quiz.definition.title} copy`, questions: quiz.definition.questions.map((question) => ({ ...question, id: crypto.randomUUID(), answers: question.answers.map((answer) => ({ ...answer, id: crypto.randomUUID() })) })) }); dispatch({ type: "DUPLICATE_QUIZ", payload: { quizId: quiz.id, duplicate } }); toast.success("Quiz duplicated"); }}><Copy /> Duplicate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => dispatch({ type: "DELETE_QUIZ", payload: { quizId: quiz.id } })}><Trash2 /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>;
      })}
    </div> : <div className="rounded-lg border border-dashed px-5 py-10 text-center"><h3 className="text-sm font-semibold">No quizzes yet</h3><p className="mt-1 text-sm text-muted-foreground">Create one manually or import schema-v1 JSON.</p></div>}
    <QuizEditorDialog open={editorOpen} onOpenChange={setEditorOpen} quiz={editing} onSave={(definition) => editing ? dispatch({ type: "UPDATE_QUIZ", payload: { quizId: editing.id, definition } }) : dispatch({ type: "CREATE_QUIZ", payload: createSavedQuiz(definition) })} />
  </section>;
}
