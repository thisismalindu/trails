import { z } from "zod";
import { progressSchema } from "@/lib/schemas";
import type { QuizAttempt, QuizDefinition, QuizSession, Resource, RoadmapWorkspace, SavedQuiz } from "@/lib/types";

const uuidSchema = z.string().uuid();
const timestampSchema = z.string().datetime({ offset: true });
const revisionSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^\d+$/).transform(Number),
]).pipe(z.number().int().positive().safe());
const provenanceSourceSchema = z.enum(["manual", "json", "sample"]);

export const roadmapRowSchema = z.object({
  id: uuidSchema,
  owner_id: uuidSchema,
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  progress_plan: progressSchema,
  progress_import_source: provenanceSourceSchema,
  progress_imported_at: timestampSchema.nullable(),
  revision: revisionSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
  archived_at: timestampSchema.nullable(),
}).superRefine((row, context) => {
  if (row.progress_import_source === "json" && row.progress_imported_at === null) {
    context.addIssue({ code: "custom", path: ["progress_imported_at"], message: "JSON imports require an import timestamp." });
  }
});

export const resourceRowSchema = z.object({
  id: uuidSchema,
  roadmap_id: uuidSchema,
  owner_id: uuidSchema,
  type: z.enum(["article", "video", "note"]),
  title: z.string().trim().min(1),
  url: z.string().url().nullable(),
  notes: z.string(),
  tags: z.array(z.string()),
  position: z.number().int().nonnegative(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
}).superRefine((row, context) => {
  if (row.type !== "note" && row.url === null) {
    context.addIssue({ code: "custom", path: ["url"], message: "Articles and videos require a URL." });
  }
});

export const quizDefinitionRowSchema = z.object({
  questions: z.array(z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    hint: z.string().min(1),
    answers: z.array(z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      correct: z.boolean(),
      explanation: z.string().min(1),
    })).length(4),
  }).superRefine((question, context) => {
    if (new Set(question.answers.map((answer) => answer.id)).size !== 4) {
      context.addIssue({ code: "custom", path: ["answers"], message: "Answer IDs must be unique per question." });
    }
    if (question.answers.filter((answer) => answer.correct).length !== 1) {
      context.addIssue({ code: "custom", path: ["answers"], message: "Every question must have exactly one correct answer." });
    }
  })),
}).superRefine((definition, context) => {
  const questionIds = definition.questions.map((question) => question.id);
  if (new Set(questionIds).size !== questionIds.length) {
    context.addIssue({ code: "custom", path: ["questions"], message: "Question IDs must be unique." });
  }
  const answerIds = definition.questions.flatMap((question) => question.answers.map((answer) => answer.id));
  if (new Set(answerIds).size !== answerIds.length) {
    context.addIssue({ code: "custom", path: ["questions"], message: "Answer IDs must be unique across the quiz." });
  }
});

export const quizSessionSchema: z.ZodType<QuizSession | null> = z.object({
  currentIndex: z.number().int().nonnegative(),
  selectedAnswers: z.record(z.string(), z.string()),
  checkedQuestionIds: z.array(z.string()),
  hintQuestionIds: z.array(z.string()),
  view: z.enum(["taking", "results", "review"]),
  startedAt: timestampSchema,
}).nullable();

export const quizRowSchema = z.object({
  id: uuidSchema,
  roadmap_id: uuidSchema,
  owner_id: uuidSchema,
  title: z.string().trim().min(1),
  schema_version: z.literal(1),
  definition: quizDefinitionRowSchema,
  definition_revision: z.number().int().positive(),
  current_session: quizSessionSchema,
  import_source: provenanceSourceSchema,
  imported_at: timestampSchema.nullable(),
  revision: revisionSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
}).superRefine((row, context) => {
  if (row.import_source === "json" && row.imported_at === null) {
    context.addIssue({ code: "custom", path: ["imported_at"], message: "JSON imports require an import timestamp." });
  }
  const questionIds = new Set(row.definition.questions.map((question) => question.id));
  const session = row.current_session;
  if (!session) return;
  if (session.currentIndex >= row.definition.questions.length && row.definition.questions.length > 0) {
    context.addIssue({ code: "custom", path: ["current_session", "currentIndex"], message: "Current question index is outside the definition." });
  }
  for (const [questionId, answerId] of Object.entries(session.selectedAnswers)) {
    const question = row.definition.questions.find((item) => item.id === questionId);
    if (!question || !question.answers.some((answer) => answer.id === answerId)) {
      context.addIssue({ code: "custom", path: ["current_session", "selectedAnswers", questionId], message: "Session answer is outside the definition." });
    }
  }
  for (const questionId of [...session.checkedQuestionIds, ...session.hintQuestionIds]) {
    if (!questionIds.has(questionId)) {
      context.addIssue({ code: "custom", path: ["current_session"], message: "Session references a question outside the definition." });
    }
  }
});

export const quizAttemptRowSchema = z.object({
  id: uuidSchema,
  quiz_id: uuidSchema,
  owner_id: uuidSchema,
  definition_revision: z.number().int().positive(),
  selected_answers: z.record(z.string(), z.string()),
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  unanswered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  percent: z.number().int().min(0).max(100),
  completed_at: timestampSchema,
}).superRefine((attempt, context) => {
  if (attempt.total !== attempt.correct + attempt.incorrect + attempt.unanswered) {
    context.addIssue({ code: "custom", path: ["total"], message: "Attempt counts must add up to total." });
  }
  const expected = attempt.total ? Math.round((attempt.correct / attempt.total) * 100) : 0;
  if (attempt.percent !== expected) {
    context.addIssue({ code: "custom", path: ["percent"], message: "Percent must match the correct answer count." });
  }
});

export type RoadmapRow = z.infer<typeof roadmapRowSchema>;
export type ResourceRow = z.infer<typeof resourceRowSchema>;
export type QuizRow = z.infer<typeof quizRowSchema>;
export type QuizAttemptRow = z.infer<typeof quizAttemptRowSchema>;
export type PersistedWorkspace = {
  roadmap: RoadmapRow;
  resources: ResourceRow[];
  quizzes: Array<QuizRow & { attempts: QuizAttemptRow[] }>;
};
export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; kind: "invalid" | "stale" | "unauthorized" | "network"; message: string };

export function serializeRoadmap(workspace: RoadmapWorkspace, ownerId: string): RoadmapRow {
  const roadmap = workspace.roadmap;
  return roadmapRowSchema.parse({
    id: roadmap.id,
    owner_id: ownerId,
    slug: roadmap.slug,
    title: roadmap.title,
    objective: roadmap.objective,
    progress_plan: workspace.progress,
    progress_import_source: workspace.progressImport.source === "json" ? "json" : workspace.progressImport.source === "sample" ? "sample" : "manual",
    progress_imported_at: workspace.progressImport.importedAt,
    revision: roadmap.revision,
    created_at: roadmap.createdAt,
    updated_at: roadmap.updatedAt,
    archived_at: roadmap.archivedAt,
  });
}

export function serializeResources(resources: Resource[], roadmapId: string, ownerId: string): ResourceRow[] {
  return resources.map((resource, index) => resourceRowSchema.parse({
    id: resource.id,
    roadmap_id: roadmapId,
    owner_id: ownerId,
    type: resource.type,
    title: resource.title,
    url: resource.url || null,
    notes: resource.notes,
    tags: resource.tags,
    position: resource.position ?? index,
    created_at: resource.createdAt,
    updated_at: resource.updatedAt,
  }));
}

export function serializeQuiz(quiz: SavedQuiz, roadmapId: string, ownerId: string): QuizRow {
  const { version: _version, title: _title, ...definition } = quiz.definition;
  return quizRowSchema.parse({
    id: quiz.id,
    roadmap_id: roadmapId,
    owner_id: ownerId,
    title: quiz.definition.title,
    schema_version: 1,
    definition,
    definition_revision: quiz.definitionRevision,
    current_session: quiz.session,
    import_source: quiz.importProvenance.source === "json" ? "json" : quiz.importProvenance.source === "sample" ? "sample" : "manual",
    imported_at: quiz.importProvenance.importedAt,
    revision: quiz.revision,
    created_at: quiz.createdAt,
    updated_at: quiz.updatedAt,
  });
}

export function serializeAttempt(attempt: QuizAttempt, quizId: string, ownerId: string): QuizAttemptRow {
  return quizAttemptRowSchema.parse({
    id: attempt.id,
    quiz_id: quizId,
    owner_id: ownerId,
    definition_revision: attempt.definitionRevision,
    selected_answers: attempt.selectedAnswers,
    correct: attempt.correct,
    incorrect: attempt.incorrect,
    unanswered: attempt.unanswered,
    total: attempt.total,
    percent: attempt.percent,
    completed_at: attempt.completedAt,
  });
}

export function hydrateWorkspace(input: PersistedWorkspace): RoadmapWorkspace {
  const roadmap = roadmapRowSchema.parse(input.roadmap);
  const resources = input.resources.map((row) => resourceRowSchema.parse(row));
  if (resources.some((resource) => resource.roadmap_id !== roadmap.id || resource.owner_id !== roadmap.owner_id)) {
    throw new Error("Persisted resource belongs to a different roadmap or owner.");
  }
  const quizzes = input.quizzes.map((rawQuiz) => {
    const { attempts: rawAttempts, ...quizData } = rawQuiz;
    const quiz = quizRowSchema.parse(quizData);
    if (quiz.roadmap_id !== roadmap.id || quiz.owner_id !== roadmap.owner_id) {
      throw new Error("Persisted quiz belongs to a different roadmap or owner.");
    }
    const attempts = rawAttempts.map((attempt) => quizAttemptRowSchema.parse(attempt));
    if (attempts.some((attempt) => attempt.quiz_id !== quiz.id || attempt.owner_id !== roadmap.owner_id)) {
      throw new Error("Persisted attempt belongs to a different quiz or owner.");
    }
    const definition: QuizDefinition = { version: 1, title: quiz.title, questions: quiz.definition.questions };
    const savedQuiz: SavedQuiz = {
      id: quiz.id,
      definition,
      definitionRevision: quiz.definition_revision,
      revision: quiz.revision,
      createdAt: quiz.created_at,
      updatedAt: quiz.updated_at,
      importProvenance: {
        source: quiz.import_source,
        schemaVersion: quiz.schema_version,
        importedAt: quiz.imported_at,
      },
      session: quiz.current_session,
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        definitionRevision: attempt.definition_revision,
        completedAt: attempt.completed_at,
        selectedAnswers: attempt.selected_answers,
        correct: attempt.correct,
        incorrect: attempt.incorrect,
        unanswered: attempt.unanswered,
        total: attempt.total,
        percent: attempt.percent,
      })),
    };
    return savedQuiz;
  });

  return {
    roadmap: {
      id: roadmap.id,
      slug: roadmap.slug,
      title: roadmap.title,
      objective: roadmap.objective,
      createdAt: roadmap.created_at,
      updatedAt: roadmap.updated_at,
      archivedAt: roadmap.archived_at,
      revision: roadmap.revision,
      resources: resources.map((resource) => ({
        id: resource.id,
        type: resource.type,
        title: resource.title,
        url: resource.url ?? "",
        notes: resource.notes,
        tags: resource.tags,
        position: resource.position,
        createdAt: resource.created_at,
        updatedAt: resource.updated_at,
      })),
    },
    progress: roadmap.progress_plan,
    progressImport: {
      source: roadmap.progress_import_source,
      schemaVersion: 1,
      importedAt: roadmap.progress_imported_at,
    },
    quizzes,
  };
}

export function checkOptimisticVersion(expected: number, actual: number): SaveResult {
  return expected === actual
    ? { ok: true, version: actual + 1 }
    : { ok: false, kind: "stale", message: "This roadmap changed elsewhere. Refresh before saving again." };
}
