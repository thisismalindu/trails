import { describe, expect, it } from "vitest";
import { sampleWorkspaces } from "@/lib/mock-data";
import { createAttempt, createQuizSession } from "@/lib/quiz-utils";
import {
  checkOptimisticVersion,
  hydrateWorkspace,
  quizAttemptRowSchema,
  quizRowSchema,
  resourceRowSchema,
  roadmapRowSchema,
  serializeAttempt,
  serializeQuiz,
  serializeResources,
  serializeRoadmap,
} from "./contracts";

const ownerId = "7b6f9478-53a3-4f1d-a79c-99ad2f945453";
const roadmapId = "55d45eda-d522-4c6a-b2d0-594a76da346f";
const quizId = "7547e31a-518b-4ffb-bc9c-344a183485f8";

function persistedSample() {
  const workspace = structuredClone(sampleWorkspaces[0]);
  workspace.roadmap.id = roadmapId;
  workspace.roadmap.resources = workspace.roadmap.resources.map((resource, index) => ({
    ...resource,
    id: `00000000-0000-4000-8000-00000000000${index}`,
  }));
  workspace.quizzes[0].id = quizId;
  const roadmap = serializeRoadmap(workspace, ownerId);
  const resources = serializeResources(workspace.roadmap.resources, roadmapId, ownerId);
  const quiz = serializeQuiz(workspace.quizzes[0], roadmapId, ownerId);
  return { workspace, roadmap, resources, quiz };
}

describe("persistence contracts", () => {
  it("serializes the relational workspace rows and hydrates them back to view models", () => {
    const { workspace, roadmap, resources, quiz } = persistedSample();
    expect(roadmapRowSchema.safeParse(roadmap).success).toBe(true);
    expect(resources.find((row) => row.type === "note")?.url).toBeNull();
    expect(resources.every((row) => resourceRowSchema.safeParse(row).success)).toBe(true);
    expect(quizRowSchema.safeParse(quiz).success).toBe(true);
    expect(quiz).not.toHaveProperty("attempts");

    const hydrated = hydrateWorkspace({
      roadmap,
      resources,
      quizzes: [{ ...quiz, attempts: [] }],
    });
    expect(hydrated.roadmap.id).toBe(workspace.roadmap.id);
    expect(hydrated.roadmap.resources).toHaveLength(workspace.roadmap.resources.length);
    expect(hydrated.progress).toEqual(workspace.progress);
    expect(hydrated.quizzes[0].definition).toEqual(workspace.quizzes[0].definition);
    expect(hydrated.quizzes[0].revision).toBe(workspace.quizzes[0].revision);
  });

  it("round trips a saved attempt and validates its summary fields", () => {
    const { workspace } = persistedSample();
    const quiz = workspace.quizzes[0];
    const session = {
      ...createQuizSession(),
      selectedAnswers: { [quiz.definition.questions[0].id]: quiz.definition.questions[0].answers.find((answer) => answer.correct)!.id },
    };
    const attempt = createAttempt(quiz, session);
    const row = serializeAttempt(attempt, quizId, ownerId);
    expect(quizAttemptRowSchema.safeParse(row).success).toBe(true);

    const { roadmap, resources, quiz: quizRow } = persistedSample();
    const hydrated = hydrateWorkspace({ roadmap, resources, quizzes: [{ ...quizRow, attempts: [row] }] });
    expect(hydrated.quizzes[0].attempts).toEqual([attempt]);

    const invalid = { ...row, total: row.total + 1 };
    expect(quizAttemptRowSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects invalid resource rows and identifies stale writes", () => {
    expect(resourceRowSchema.safeParse({ id: crypto.randomUUID(), roadmap_id: crypto.randomUUID(), owner_id: ownerId, type: "video", title: "Video", url: null, notes: "", tags: [], position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).success).toBe(false);
    expect(checkOptimisticVersion(2, 3)).toMatchObject({ ok: false, kind: "stale" });
    expect(checkOptimisticVersion(3, 3)).toEqual({ ok: true, version: 4 });
  });
});
