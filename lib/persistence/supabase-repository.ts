import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/persistence/database.types";
import {
  hydrateWorkspace,
  serializeAttempt,
  serializeQuiz,
  serializeResources,
  serializeRoadmap,
  roadmapRowSchema,
  resourceRowSchema,
  quizRowSchema,
  quizAttemptRowSchema,
  type PersistedWorkspace,
  type RoadmapRow,
} from "@/lib/persistence/contracts";
import type { QuizAttempt, RoadmapSummary, RoadmapWorkspace, SavedQuiz } from "@/lib/types";

export type TrailsRepositoryErrorKind = "unauthorized" | "not-found" | "invalid" | "conflict" | "network";

export class TrailsRepositoryError extends Error {
  constructor(readonly kind: TrailsRepositoryErrorKind, message: string) {
    super(message);
    this.name = "TrailsRepositoryError";
  }
}

type Client = SupabaseClient<Database>;
const countSchema = z.union([
  z.number().int().nonnegative().safe(),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().nonnegative().safe()),
]);
const roadmapSummaryRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  objective: z.string(),
  updated_at: z.string().datetime({ offset: true }),
  archived_at: z.string().datetime({ offset: true }).nullable(),
  revision: countSchema.pipe(z.number().int().positive()),
  progress_complete: countSchema,
  progress_total: countSchema,
  resource_count: countSchema,
}).superRefine((row, context) => {
  if (row.progress_complete > row.progress_total) {
    context.addIssue({ code: "custom", path: ["progress_complete"], message: "Completed progress cannot exceed the total." });
  }
});

export interface TrailsRepository {
  listRoadmaps(): Promise<RoadmapSummary[]>;
  loadWorkspaceBySlug(slug: string): Promise<RoadmapWorkspace | null>;
  persistRoadmapSummaryTransition(before: RoadmapSummary | undefined, after: RoadmapSummary | undefined, newWorkspace?: RoadmapWorkspace): Promise<void>;
  persistWorkspaceTransition(before: RoadmapWorkspace | undefined, after: RoadmapWorkspace | undefined, attempt?: { quizId: string; value: QuizAttempt }): Promise<void>;
}

function throwDatabaseError(error: { code?: string; message: string }) {
  if (error.code === "42501" || error.code === "PGRST301") throw new TrailsRepositoryError("unauthorized", "Your session is no longer valid. Sign in again.");
  if (error.code === "40001" || error.code === "23505") throw new TrailsRepositoryError("conflict", "This data changed elsewhere. Refresh and try again.");
  if (error.code === "23514" || error.code === "22023" || error.code === "22P02") throw new TrailsRepositoryError("invalid", error.message);
  throw new TrailsRepositoryError("network", "Trails could not reach Supabase. Check your connection and retry.");
}

function unwrap<T>(result: { data: T | null; error: { code?: string; message: string } | null }): T {
  if (result.error) throwDatabaseError(result.error);
  if (result.data === null) throw new TrailsRepositoryError("not-found", "The requested record no longer exists.");
  return result.data;
}

function assembleWorkspace(
  roadmap: RoadmapRow,
  resources: PersistedWorkspace["resources"],
  quizzes: PersistedWorkspace["quizzes"],
) {
  return hydrateWorkspace({ roadmap, resources, quizzes });
}

export async function loadWorkspaces(client: Client): Promise<RoadmapWorkspace[]> {
  const [roadmapsResult, resourcesResult, quizzesResult, attemptsResult] = await Promise.all([
    client.from("roadmaps").select("*").order("updated_at", { ascending: false }),
    client.from("resources").select("*").order("position", { ascending: true }),
    client.from("quizzes").select("*").order("updated_at", { ascending: false }),
    client.from("quiz_attempts").select("*").order("completed_at", { ascending: false }),
  ]);
  const roadmaps = unwrap(roadmapsResult).map((row) => roadmapRowSchema.parse(row));
  const resources = unwrap(resourcesResult).map((row) => resourceRowSchema.parse(row));
  const quizzes = unwrap(quizzesResult).map((row) => quizRowSchema.parse(row));
  const attempts = unwrap(attemptsResult).map((row) => quizAttemptRowSchema.parse(row));
  return roadmaps.map((roadmap) => assembleWorkspace(
    roadmap,
    resources.filter((resource) => resource.roadmap_id === roadmap.id),
    quizzes.filter((quiz) => quiz.roadmap_id === roadmap.id).map((quiz) => ({
      ...quiz,
      attempts: attempts.filter((attempt) => attempt.quiz_id === quiz.id),
    })),
  ));
}

export async function loadRoadmapSummaries(client: Client): Promise<RoadmapSummary[]> {
  const rows = unwrap(await client.rpc("list_roadmap_summaries"));
  return rows.map((rawRow) => {
    const parsed = roadmapSummaryRowSchema.safeParse(rawRow);
    if (!parsed.success) throw new TrailsRepositoryError("invalid", "Supabase returned a roadmap summary in an unexpected format.");
    const row = parsed.data;
    const total = row.progress_total;
    const complete = row.progress_complete;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      objective: row.objective,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
      revision: row.revision,
      progress: { complete, total, percent: total ? Math.round((complete / total) * 100) : 0 },
      resourceCount: row.resource_count,
    };
  });
}

export async function persistRoadmapSummaryTransition(
  client: Client,
  ownerId: string,
  before: RoadmapSummary | undefined,
  after: RoadmapSummary | undefined,
  newWorkspace?: RoadmapWorkspace,
) {
  if (!after) {
    if (before) unwrap(await client.from("roadmaps").delete().eq("id", before.id).select("id").maybeSingle());
    return;
  }
  if (!before) {
    if (!newWorkspace) throw new TrailsRepositoryError("invalid", "A new roadmap workspace is required.");
    unwrap(await client.from("roadmaps").insert(serializeRoadmap(newWorkspace, ownerId)).select("id").single());
    return;
  }
  const { data, error } = await client.from("roadmaps").update({
    slug: after.slug,
    title: after.title,
    objective: after.objective,
    archived_at: after.archivedAt,
  }).eq("id", before.id).eq("revision", before.revision).select("id").maybeSingle();
  if (error) throwDatabaseError(error);
  if (!data) throw new TrailsRepositoryError("conflict", "This roadmap changed elsewhere. Refresh and try again.");
}

export async function loadWorkspaceBySlug(client: Client, slug: string): Promise<RoadmapWorkspace | null> {
  const roadmapResult = await client.from("roadmaps").select("*").eq("slug", slug).maybeSingle();
  if (roadmapResult.error) throwDatabaseError(roadmapResult.error);
  if (!roadmapResult.data) return null;
  const roadmap = roadmapRowSchema.parse(roadmapResult.data);
  const [resourcesResult, quizzesResult] = await Promise.all([
    client.from("resources").select("*").eq("roadmap_id", roadmap.id).order("position", { ascending: true }),
    client.from("quizzes").select("*").eq("roadmap_id", roadmap.id).order("updated_at", { ascending: false }),
  ]);
  const resources = unwrap(resourcesResult).map((row) => resourceRowSchema.parse(row));
  const quizzes = unwrap(quizzesResult).map((row) => quizRowSchema.parse(row));
  const quizIds = quizzes.map((quiz) => quiz.id);
  let attempts: PersistedWorkspace["quizzes"][number]["attempts"] = [];
  if (quizIds.length) {
    const attemptsResult = await client.from("quiz_attempts").select("*").in("quiz_id", quizIds).order("completed_at", { ascending: false });
    attempts = unwrap(attemptsResult).map((row) => quizAttemptRowSchema.parse(row));
  }
  return assembleWorkspace(roadmap, resources, quizzes.map((quiz) => ({
    ...quiz,
    attempts: attempts.filter((attempt) => attempt.quiz_id === quiz.id),
  })));
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function without<T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> {
  const result = { ...value };
  keys.forEach((key) => delete result[key]);
  return result;
}

async function writeQuiz(client: Client, ownerId: string, roadmapId: string, quiz: SavedQuiz, previous?: SavedQuiz) {
  const row = serializeQuiz(quiz, roadmapId, ownerId);
  if (previous) {
    const expectedRevision = previous.revision;
    const { data, error } = await client.from("quizzes")
      .update(without(row, ["id", "roadmap_id", "owner_id", "created_at", "revision", "definition_revision"]))
      .eq("id", quiz.id).eq("revision", expectedRevision).select("id").maybeSingle();
    if (error) throwDatabaseError(error);
    if (!data) throw new TrailsRepositoryError("conflict", "This quiz changed elsewhere. Refresh and try again.");
  } else {
    unwrap(await client.from("quizzes").insert(row).select("id").single());
  }
}

export async function persistWorkspaceTransition(
  client: Client,
  ownerId: string,
  before: RoadmapWorkspace | undefined,
  after: RoadmapWorkspace | undefined,
  attempt?: { quizId: string; value: QuizAttempt },
) {
  if (!after) {
    if (before) unwrap(await client.from("roadmaps").delete().eq("id", before.roadmap.id).select("id").maybeSingle());
    return;
  }

  const row = serializeRoadmap(after, ownerId);
  if (!before) {
    unwrap(await client.from("roadmaps").insert(row).select("id").single());
  } else {
    const changed = ["slug", "title", "objective", "progress_plan", "progress_import_source", "progress_imported_at", "archived_at"]
      .some((key) => !same((row as unknown as Record<string, unknown>)[key], (serializeRoadmap(before, ownerId) as unknown as Record<string, unknown>)[key]));
    if (changed) {
      const update = without(row, ["id", "owner_id", "created_at", "revision", "updated_at"]);
      const { data, error } = await client.from("roadmaps").update(update)
        .eq("id", after.roadmap.id).eq("revision", before.roadmap.revision).select("id").maybeSingle();
      if (error) throwDatabaseError(error);
      if (!data) throw new TrailsRepositoryError("conflict", "This roadmap changed elsewhere. Refresh and try again.");
    }
  }

  const previousResources = new Map((before?.roadmap.resources ?? []).map((resource) => [resource.id, resource]));
  const resourcesToWrite = after.roadmap.resources.filter((resource) => !same(resource, previousResources.get(resource.id)));
  if (resourcesToWrite.length) {
    unwrap(await client.from("resources").upsert(serializeResources(resourcesToWrite, after.roadmap.id, ownerId), { onConflict: "id" }).select("id"));
  }
  const nextResourceIds = after.roadmap.resources.map((resource) => resource.id);
  const removedResourceIds = [...previousResources.keys()].filter((id) => !nextResourceIds.includes(id));
  if (removedResourceIds.length) unwrap(await client.from("resources").delete().in("id", removedResourceIds).select("id"));

  const previousQuizzes = new Map((before?.quizzes ?? []).map((quiz) => [quiz.id, quiz]));
  for (const quiz of after.quizzes) {
    const previous = previousQuizzes.get(quiz.id);
    if (attempt?.quizId === quiz.id) continue;
    if (!previous || !same(quiz, previous)) await writeQuiz(client, ownerId, after.roadmap.id, quiz, previous);
  }
  const nextQuizIds = after.quizzes.map((quiz) => quiz.id);
  const removedQuizIds = [...previousQuizzes.keys()].filter((id) => !nextQuizIds.includes(id));
  if (removedQuizIds.length) unwrap(await client.from("quizzes").delete().in("id", removedQuizIds).select("id"));

  if (attempt) {
    const quiz = after.quizzes.find((candidate) => candidate.id === attempt.quizId);
    if (!quiz) throw new TrailsRepositoryError("not-found", "Quiz not found.");
    const { error } = await client.rpc("finish_quiz_attempt", {
      p_quiz_id: quiz.id,
      p_expected_definition_revision: quiz.definitionRevision,
      p_selected_answers: attempt.value.selectedAnswers,
      p_final_session: quiz.session,
    });
    if (error) throwDatabaseError(error);
  } else if (before) {
    for (const quiz of after.quizzes) {
      const previous = previousQuizzes.get(quiz.id);
      if (!previous) continue;
      const newAttempts = quiz.attempts.filter((item) => !previous.attempts.some((old) => old.id === item.id));
      for (const value of newAttempts) {
        const attemptRow = serializeAttempt(value, quiz.id, ownerId);
        unwrap(await client.from("quiz_attempts").insert(attemptRow).select("id").single());
      }
    }
  }
}

export function createTrailsRepository(client: Client, ownerId: string): TrailsRepository {
  return {
    listRoadmaps: () => loadRoadmapSummaries(client),
    loadWorkspaceBySlug: (slug) => loadWorkspaceBySlug(client, slug),
    persistRoadmapSummaryTransition: (before, after, newWorkspace) => persistRoadmapSummaryTransition(client, ownerId, before, after, newWorkspace),
    persistWorkspaceTransition: (before, after, attempt) => persistWorkspaceTransition(client, ownerId, before, after, attempt),
  };
}
