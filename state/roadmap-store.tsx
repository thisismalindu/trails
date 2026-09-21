"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { emptyProgress } from "@/lib/mock-data";
import type { ProgressData, ProgressItem, ProgressSection, ProgressStatus, QuizAttempt, QuizDefinition, QuizSession, Resource, RoadmapSummary, RoadmapWorkspace, SavedQuiz, SyncState } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { createTrailsRepository } from "@/lib/persistence/supabase-repository";

export type RoadmapState = { roadmaps: RoadmapSummary[]; workspaces: RoadmapWorkspace[]; sync: SyncState };
export type WorkspaceAction =
  | { type: "SAVE_RESOURCE"; payload: Resource }
  | { type: "DELETE_RESOURCE"; payload: string }
  | { type: "IMPORT_PROGRESS"; payload: ProgressData }
  | { type: "SET_PROGRESS_STATUS"; payload: { sectionId: string; itemId: string; status: ProgressStatus } }
  | { type: "ADD_PROGRESS_SECTION"; payload: ProgressSection }
  | { type: "UPDATE_PROGRESS_SECTION"; payload: { sectionId: string; title: string } }
  | { type: "DELETE_PROGRESS_SECTION"; payload: { sectionId: string } }
  | { type: "MOVE_PROGRESS_SECTION"; payload: { sectionId: string; direction: -1 | 1 } }
  | { type: "ADD_PROGRESS_ITEM"; payload: { sectionId: string; item: ProgressItem } }
  | { type: "UPDATE_PROGRESS_ITEM"; payload: { sectionId: string; itemId: string; label: string } }
  | { type: "DELETE_PROGRESS_ITEM"; payload: { sectionId: string; itemId: string } }
  | { type: "MOVE_PROGRESS_ITEM"; payload: { sectionId: string; itemId: string; direction: -1 | 1 } }
  | { type: "CREATE_QUIZ"; payload: SavedQuiz }
  | { type: "UPDATE_QUIZ"; payload: { quizId: string; definition: QuizDefinition } }
  | { type: "DELETE_QUIZ"; payload: { quizId: string } }
  | { type: "DUPLICATE_QUIZ"; payload: { quizId: string; duplicate: SavedQuiz } }
  | { type: "SET_QUIZ_SESSION"; payload: { quizId: string; session: QuizSession | null } }
  | { type: "FINISH_QUIZ"; payload: { quizId: string; attempt: QuizAttempt; session: QuizSession } };
export type RoadmapAction =
  | { type: "CREATE_ROADMAP"; payload: RoadmapWorkspace }
  | { type: "UPDATE_ROADMAP"; roadmapId: string; payload: { title: string; objective: string } }
  | { type: "ARCHIVE_ROADMAP" | "RESTORE_ROADMAP" | "DELETE_ROADMAP"; roadmapId: string }
  | { type: "WORKSPACE_ACTION"; roadmapId: string; action: WorkspaceAction };
type InternalAction = RoadmapAction | { type: "SYNC"; payload: SyncState } | { type: "RESTORE_STATE"; payload: RoadmapState } | { type: "HYDRATE_STATE"; payload: RoadmapState } | { type: "HYDRATE_WORKSPACE"; payload: RoadmapWorkspace };

export const initialRoadmapState: RoadmapState = { roadmaps: [], workspaces: [], sync: { status: "idle" } };
const now = () => new Date().toISOString();
const move = <T,>(values: T[], index: number, direction: -1 | 1) => { const next = [...values]; const target = index + direction; if (index < 0 || target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; };
const touch = (workspace: RoadmapWorkspace): RoadmapWorkspace => ({ ...workspace, roadmap: { ...workspace.roadmap, updatedAt: now(), revision: workspace.roadmap.revision + 1 } });

function updateWorkspace(workspace: RoadmapWorkspace, action: WorkspaceAction): RoadmapWorkspace {
  const current = touch(workspace);
  const mapSection = (sectionId: string, fn: (section: ProgressSection) => ProgressSection) => current.progress.sections.map((section) => section.id === sectionId ? fn(section) : section);
  switch (action.type) {
    case "SAVE_RESOURCE": { const exists = current.roadmap.resources.some((item) => item.id === action.payload.id); return { ...current, roadmap: { ...current.roadmap, resources: exists ? current.roadmap.resources.map((item) => item.id === action.payload.id ? action.payload : item) : [action.payload, ...current.roadmap.resources] } }; }
    case "DELETE_RESOURCE": return { ...current, roadmap: { ...current.roadmap, resources: current.roadmap.resources.filter((item) => item.id !== action.payload) } };
    case "IMPORT_PROGRESS": return { ...current, progress: action.payload, progressImport: { source: "json", schemaVersion: 1, importedAt: now() } };
    case "SET_PROGRESS_STATUS": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, items: section.items.map((item) => item.id === action.payload.itemId ? { ...item, status: action.payload.status } : item) })) } };
    case "ADD_PROGRESS_SECTION": return { ...current, progress: { ...current.progress, sections: [...current.progress.sections, action.payload] } };
    case "UPDATE_PROGRESS_SECTION": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, title: action.payload.title })) } };
    case "DELETE_PROGRESS_SECTION": return { ...current, progress: { ...current.progress, sections: current.progress.sections.filter((section) => section.id !== action.payload.sectionId) } };
    case "MOVE_PROGRESS_SECTION": { const index = current.progress.sections.findIndex((section) => section.id === action.payload.sectionId); return { ...current, progress: { ...current.progress, sections: move(current.progress.sections, index, action.payload.direction) } }; }
    case "ADD_PROGRESS_ITEM": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, items: [...section.items, action.payload.item] })) } };
    case "UPDATE_PROGRESS_ITEM": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, items: section.items.map((item) => item.id === action.payload.itemId ? { ...item, label: action.payload.label } : item) })) } };
    case "DELETE_PROGRESS_ITEM": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, items: section.items.filter((item) => item.id !== action.payload.itemId) })) } };
    case "MOVE_PROGRESS_ITEM": return { ...current, progress: { ...current.progress, sections: mapSection(action.payload.sectionId, (section) => ({ ...section, items: move(section.items, section.items.findIndex((item) => item.id === action.payload.itemId), action.payload.direction) })) } };
    case "CREATE_QUIZ": return { ...current, quizzes: [action.payload, ...current.quizzes] };
    case "UPDATE_QUIZ": return { ...current, quizzes: current.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, definition: action.payload.definition, definitionRevision: quiz.definitionRevision + 1, revision: quiz.revision + 1, updatedAt: now(), session: null } : quiz) };
    case "DELETE_QUIZ": return { ...current, quizzes: current.quizzes.filter((quiz) => quiz.id !== action.payload.quizId) };
    case "DUPLICATE_QUIZ": return { ...current, quizzes: [action.payload.duplicate, ...current.quizzes] };
    case "SET_QUIZ_SESSION": return { ...current, quizzes: current.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, session: action.payload.session, revision: quiz.revision + 1, updatedAt: now() } : quiz) };
    case "FINISH_QUIZ": return { ...current, roadmap: { ...current.roadmap, revision: current.roadmap.revision + 1 }, quizzes: current.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, session: action.payload.session, attempts: [action.payload.attempt, ...quiz.attempts], revision: quiz.revision + 2, updatedAt: now() } : quiz) };
  }
}

function summarize(workspace: RoadmapWorkspace): RoadmapSummary {
  const items = workspace.progress.sections.flatMap((section) => section.items);
  const complete = items.filter((item) => item.status === "complete").length;
  return {
    id: workspace.roadmap.id,
    slug: workspace.roadmap.slug,
    title: workspace.roadmap.title,
    objective: workspace.roadmap.objective,
    updatedAt: workspace.roadmap.updatedAt,
    archivedAt: workspace.roadmap.archivedAt,
    revision: workspace.roadmap.revision,
    progress: { complete, total: items.length, percent: items.length ? Math.round((complete / items.length) * 100) : 0 },
    resourceCount: workspace.roadmap.resources.length,
  };
}

export function roadmapReducer(state: RoadmapState, action: InternalAction): RoadmapState {
  if (action.type === "SYNC") return { ...state, sync: action.payload };
  if (action.type === "RESTORE_STATE") return { ...action.payload, sync: { status: "error", message: "Changes were rolled back. Try again." } };
  if (action.type === "HYDRATE_STATE") return action.payload;
  if (action.type === "HYDRATE_WORKSPACE") return state.workspaces.some((item) => item.roadmap.id === action.payload.roadmap.id) ? state : { ...state, workspaces: [...state.workspaces, action.payload] };
  if (action.type === "CREATE_ROADMAP") return { ...state, roadmaps: [summarize(action.payload), ...state.roadmaps], workspaces: [action.payload, ...state.workspaces] };
  if (action.type === "DELETE_ROADMAP") return { ...state, roadmaps: state.roadmaps.filter((item) => item.id !== action.roadmapId), workspaces: state.workspaces.filter((item) => item.roadmap.id !== action.roadmapId) };
  if (action.type === "UPDATE_ROADMAP") {
    const workspace = state.workspaces.find((item) => item.roadmap.id === action.roadmapId);
    const updatedWorkspace = workspace ? { ...touch(workspace), roadmap: { ...touch(workspace).roadmap, ...action.payload } } : undefined;
    return {
      ...state,
      roadmaps: state.roadmaps.map((item) => item.id === action.roadmapId ? { ...item, ...action.payload, updatedAt: now(), revision: item.revision + 1 } : item),
      workspaces: updatedWorkspace ? state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? updatedWorkspace : item) : state.workspaces,
    };
  }
  if (action.type === "ARCHIVE_ROADMAP" || action.type === "RESTORE_ROADMAP") {
    const archivedAt = action.type === "ARCHIVE_ROADMAP" ? now() : null;
    return {
      ...state,
      roadmaps: state.roadmaps.map((item) => item.id === action.roadmapId ? { ...item, archivedAt, updatedAt: now(), revision: item.revision + 1 } : item),
      workspaces: state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? { ...touch(item), roadmap: { ...touch(item).roadmap, archivedAt } } : item),
    };
  }
  if (action.type === "WORKSPACE_ACTION") {
    const workspaces = state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? updateWorkspace(item, action.action) : item);
    const workspace = workspaces.find((item) => item.roadmap.id === action.roadmapId);
    return { ...state, workspaces, roadmaps: workspace ? state.roadmaps.map((item) => item.id === action.roadmapId ? summarize(workspace) : item) : state.roadmaps };
  }
  return state;
}

type ContextValue = { state: RoadmapState; dispatch: (action: RoadmapAction) => Promise<boolean>; retry: () => void; userId: string; userEmail: string };
type WorkspaceContextValue = { roadmapId: string; initialWorkspace: RoadmapWorkspace };
const RoadmapsContext = createContext<(ContextValue & { hydrateWorkspace: (workspace: RoadmapWorkspace) => void }) | null>(null); const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function RoadmapsProvider({ children, initialRoadmaps, userId, userEmail }: { children: ReactNode; initialRoadmaps: RoadmapSummary[]; userId: string; userEmail: string }) {
  const [state, baseDispatch] = useReducer(roadmapReducer, { ...initialRoadmapState, roadmaps: initialRoadmaps });
  const stateRef = useRef(state);
  stateRef.current = state;
  const hydrateWorkspace = useCallback((workspace: RoadmapWorkspace) => {
    if (stateRef.current.workspaces.some((item) => item.roadmap.id === workspace.roadmap.id)) return;
    const next = roadmapReducer(stateRef.current, { type: "HYDRATE_WORKSPACE", payload: workspace });
    stateRef.current = next;
    baseDispatch({ type: "HYDRATE_WORKSPACE", payload: workspace });
  }, []);
  const dispatch = useCallback((action: RoadmapAction): Promise<boolean> => {
    const beforeState = stateRef.current;
    const afterState = roadmapReducer(beforeState, action);
    stateRef.current = afterState;
    baseDispatch(action);
    baseDispatch({ type: "SYNC", payload: { status: "saving" } });

    const roadmapId = "roadmapId" in action ? action.roadmapId : action.type === "CREATE_ROADMAP" ? action.payload.roadmap.id : undefined;
    if (!roadmapId) {
      baseDispatch({ type: "SYNC", payload: { status: "error", message: "Could not identify the roadmap to save." } });
      return Promise.resolve(false);
    }
    const before = beforeState.workspaces.find((item) => item.roadmap.id === roadmapId);
    const after = afterState.workspaces.find((item) => item.roadmap.id === roadmapId);
    const attempt = action.type === "WORKSPACE_ACTION" && action.action.type === "FINISH_QUIZ"
      ? { quizId: action.action.payload.quizId, value: action.action.payload.attempt }
      : undefined;

    const summaryAction = action.type === "CREATE_ROADMAP" || action.type === "UPDATE_ROADMAP" || action.type === "ARCHIVE_ROADMAP" || action.type === "RESTORE_ROADMAP" || action.type === "DELETE_ROADMAP";
    const beforeSummary = beforeState.roadmaps.find((item) => item.id === roadmapId);
    const afterSummary = afterState.roadmaps.find((item) => item.id === roadmapId);
    const save = Promise.resolve().then(() => {
      const repository = createTrailsRepository(createClient(), userId);
      return summaryAction
        ? repository.persistRoadmapSummaryTransition(beforeSummary, afterSummary, action.type === "CREATE_ROADMAP" ? action.payload : undefined)
        : repository.persistWorkspaceTransition(before, after, attempt);
    });
    return save
      .then(() => { baseDispatch({ type: "SYNC", payload: { status: "saved" } }); return true; })
      .catch((error: unknown) => {
        stateRef.current = beforeState;
        baseDispatch({ type: "RESTORE_STATE", payload: beforeState });
        baseDispatch({ type: "SYNC", payload: { status: error instanceof Error && "kind" in error && error.kind === "unauthorized" ? "unauthorized" : "error", message: error instanceof Error ? error.message : "Save failed. Try again." } });
        return false;
      });
  }, [userId]);
  const retry = useCallback(() => {
    window.location.reload();
  }, []);
  const value = useMemo(() => ({ state, dispatch, retry, hydrateWorkspace, userId, userEmail }), [state, dispatch, retry, hydrateWorkspace, userId, userEmail]);
  return <RoadmapsContext.Provider value={value}>{children}</RoadmapsContext.Provider>;
}
export function useRoadmaps() { const value = useContext(RoadmapsContext); if (!value) throw new Error("useRoadmaps must be used inside RoadmapsProvider"); return value; }
export function useWorkspaceBySlug(slug: string) { return useRoadmaps().state.workspaces.find((item) => item.roadmap.slug === slug); }
export function WorkspaceProvider({ roadmapId, initialWorkspace, children }: { roadmapId: string; initialWorkspace: RoadmapWorkspace; children: ReactNode }) {
  const { hydrateWorkspace } = useRoadmaps();
  useEffect(() => hydrateWorkspace(initialWorkspace), [hydrateWorkspace, initialWorkspace]);
  return <WorkspaceContext.Provider value={{ roadmapId, initialWorkspace }}>{children}</WorkspaceContext.Provider>;
}
export function useRoadmap() {
  const scope = useContext(WorkspaceContext);
  const context = useRoadmaps();
  if (!scope) throw new Error("useRoadmap must be used inside WorkspaceProvider");
  const workspace = context.state.workspaces.find((item) => item.roadmap.id === scope.roadmapId) ?? scope.initialWorkspace;
  return { state: workspace, dispatch: (action: WorkspaceAction) => { context.hydrateWorkspace(scope.initialWorkspace); return context.dispatch({ type: "WORKSPACE_ACTION", roadmapId: scope.roadmapId, action }); } };
}
export function createEmptyWorkspace({ id, slug, title, objective }: { id: string; slug: string; title: string; objective: string }): RoadmapWorkspace { const timestamp = now(); return { roadmap: { id, slug, title, objective, createdAt: timestamp, updatedAt: timestamp, archivedAt: null, revision: 1, resources: [] }, progress: emptyProgress, quizzes: [], progressImport: { source: "manual", schemaVersion: 1, importedAt: null } }; }
