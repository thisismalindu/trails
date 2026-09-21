import { describe, expect, it } from "vitest";
import { sampleProgress } from "@/lib/mock-data";
import { uniqueRoadmapSlug } from "@/lib/roadmap-utils";
import {
  createEmptyWorkspace,
  initialRoadmapState,
  roadmapReducer,
} from "@/state/roadmap-store";

const firstId = initialRoadmapState.workspaces[0].roadmap.id;

describe("roadmapReducer", () => {
  it("creates a blank roadmap and generates collision-safe slugs", () => {
    const slug = uniqueRoadmapSlug("Modern Web Architecture", ["modern-web-architecture"]);
    const workspace = createEmptyWorkspace({
      id: "roadmap-test",
      slug,
      title: "Modern Web Architecture",
      objective: "Build reliable modern applications.",
    });
    const state = roadmapReducer(initialRoadmapState, {
      type: "CREATE_ROADMAP",
      payload: workspace,
    });
    expect(slug).toBe("modern-web-architecture-2");
    expect(state.workspaces[0].roadmap.resources).toEqual([]);
    expect(state.workspaces).toHaveLength(initialRoadmapState.workspaces.length + 1);
  });

  it("scopes resource mutations to one roadmap", () => {
    const resource = {
      id: "resource-test",
      type: "article" as const,
      title: "Original",
      url: "https://example.com",
      notes: "Useful",
      tags: ["test"],
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    const added = roadmapReducer(initialRoadmapState, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "SAVE_RESOURCE", payload: resource },
    });
    const deleted = roadmapReducer(added, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "DELETE_RESOURCE", payload: resource.id },
    });
    expect(added.workspaces[0].roadmap.resources[0]).toEqual(resource);
    expect(added.workspaces[1]).toBe(initialRoadmapState.workspaces[1]);
    expect(deleted.workspaces[0].roadmap.resources).not.toContainEqual(resource);
  });

  it("imports progress, updates a step, and manages quiz sessions", () => {
    const imported = roadmapReducer(initialRoadmapState, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "IMPORT_PROGRESS", payload: sampleProgress },
    });
    const toggled = roadmapReducer(imported, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "SET_PROGRESS_STATUS", payload: { sectionId: "section-1", itemId: "progress-3", status: "complete" } },
    });
    const quizId = toggled.workspaces[0].quizzes[0].id;
    const answered = roadmapReducer(toggled, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "SET_QUIZ_SESSION", payload: { quizId, session: { currentIndex: 0, selectedAnswers: { "quiz-1": "quiz-1b" }, checkedQuestionIds: [], hintQuestionIds: [], view: "taking", startedAt: "2026-09-01T00:00:00.000Z" } } },
    });
    const reset = roadmapReducer(answered, {
      type: "WORKSPACE_ACTION",
      roadmapId: firstId,
      action: { type: "SET_QUIZ_SESSION", payload: { quizId, session: null } },
    });
    expect(toggled.workspaces[0].progress.sections[0].items[2].status).toBe("complete");
    expect(answered.workspaces[0].quizzes[0].session?.selectedAnswers["quiz-1"]).toBe("quiz-1b");
    expect(answered.workspaces[0].quizzes[0].revision).toBe(initialRoadmapState.workspaces[0].quizzes[0].revision + 1);
    expect(reset.workspaces[0].quizzes[0].session).toBeNull();
  });

  it("supports rename, archive, restore, and permanent deletion", () => {
    const renamed = roadmapReducer(initialRoadmapState, { type: "UPDATE_ROADMAP", roadmapId: firstId, payload: { title: "Renamed", objective: "A sufficiently detailed new objective." } });
    expect(renamed.workspaces[0].roadmap.title).toBe("Renamed");
    expect(renamed.workspaces[0].roadmap.revision).toBe(initialRoadmapState.workspaces[0].roadmap.revision + 1);
    const archived = roadmapReducer(renamed, { type: "ARCHIVE_ROADMAP", roadmapId: firstId });
    expect(archived.workspaces[0].roadmap.archivedAt).not.toBeNull();
    const restored = roadmapReducer(archived, { type: "RESTORE_ROADMAP", roadmapId: firstId });
    expect(restored.workspaces[0].roadmap.archivedAt).toBeNull();
    const deleted = roadmapReducer(restored, { type: "DELETE_ROADMAP", roadmapId: firstId });
    expect(deleted.workspaces.some((item) => item.roadmap.id === firstId)).toBe(false);
  });

  it("adds, edits, moves, and removes progress structure", () => {
    const section = { id: "new-section", title: "New section", items: [] };
    const added = roadmapReducer(initialRoadmapState, { type: "WORKSPACE_ACTION", roadmapId: firstId, action: { type: "ADD_PROGRESS_SECTION", payload: section } });
    const withItem = roadmapReducer(added, { type: "WORKSPACE_ACTION", roadmapId: firstId, action: { type: "ADD_PROGRESS_ITEM", payload: { sectionId: section.id, item: { id: "new-item", label: "First label", status: "not-started" } } } });
    const edited = roadmapReducer(withItem, { type: "WORKSPACE_ACTION", roadmapId: firstId, action: { type: "UPDATE_PROGRESS_ITEM", payload: { sectionId: section.id, itemId: "new-item", label: "Edited label" } } });
    expect(edited.workspaces[0].progress.sections.at(-1)?.items[0].label).toBe("Edited label");
    const removed = roadmapReducer(edited, { type: "WORKSPACE_ACTION", roadmapId: firstId, action: { type: "DELETE_PROGRESS_SECTION", payload: { sectionId: section.id } } });
    expect(removed.workspaces[0].progress.sections.some((item) => item.id === section.id)).toBe(false);
  });
});
