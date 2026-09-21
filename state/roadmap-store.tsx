"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { emptyProgress, sampleWorkspaces } from "@/lib/mock-data";
import type { ProgressData, ProgressItem, ProgressSection, ProgressStatus, QuizAttempt, QuizDefinition, QuizSession, Resource, RoadmapWorkspace, SavedQuiz, SyncState } from "@/lib/types";

export type RoadmapState = { workspaces: RoadmapWorkspace[]; sync: SyncState };
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
type InternalAction = RoadmapAction | { type: "SYNC"; payload: SyncState } | { type: "RESTORE_STATE"; payload: RoadmapState };

export const initialRoadmapState: RoadmapState = { workspaces: sampleWorkspaces, sync: { status: "idle" } };
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
    case "FINISH_QUIZ": return { ...current, quizzes: current.quizzes.map((quiz) => quiz.id === action.payload.quizId ? { ...quiz, session: action.payload.session, attempts: [action.payload.attempt, ...quiz.attempts], revision: quiz.revision + 1, updatedAt: now() } : quiz) };
  }
}

export function roadmapReducer(state: RoadmapState, action: InternalAction): RoadmapState {
  if (action.type === "SYNC") return { ...state, sync: action.payload };
  if (action.type === "RESTORE_STATE") return { ...action.payload, sync: { status: "error", message: "Changes were rolled back. Try again." } };
  if (action.type === "CREATE_ROADMAP") return { ...state, workspaces: [action.payload, ...state.workspaces] };
  if (action.type === "DELETE_ROADMAP") return { ...state, workspaces: state.workspaces.filter((item) => item.roadmap.id !== action.roadmapId) };
  if (action.type === "UPDATE_ROADMAP") return { ...state, workspaces: state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? { ...touch(item), roadmap: { ...touch(item).roadmap, ...action.payload } } : item) };
  if (action.type === "ARCHIVE_ROADMAP" || action.type === "RESTORE_ROADMAP") return { ...state, workspaces: state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? { ...touch(item), roadmap: { ...touch(item).roadmap, archivedAt: action.type === "ARCHIVE_ROADMAP" ? now() : null } } : item) };
  if (action.type === "WORKSPACE_ACTION") return { ...state, workspaces: state.workspaces.map((item) => item.roadmap.id === action.roadmapId ? updateWorkspace(item, action.action) : item) };
  return state;
}

type ContextValue = { state: RoadmapState; dispatch: (action: RoadmapAction) => void; retry: () => void; simulateFailure: (kind: "error" | "unauthorized") => void };
const RoadmapsContext = createContext<ContextValue | null>(null); const WorkspaceContext = createContext<string | null>(null);
export function RoadmapsProvider({ children }: { children: ReactNode }) { const [state, baseDispatch] = useReducer(roadmapReducer, initialRoadmapState); const stateRef = useRef(state); stateRef.current = state; const failureRef = useRef<"error" | "unauthorized" | null>(null); const dispatch = useCallback((action: RoadmapAction) => { const before = stateRef.current; baseDispatch(action); baseDispatch({ type: "SYNC", payload: { status: "saving" } }); window.setTimeout(() => { const failure = failureRef.current; failureRef.current = null; if (failure === "unauthorized") baseDispatch({ type: "SYNC", payload: { status: "unauthorized", message: "Your preview session expired. Sign in again." } }); else if (failure === "error") baseDispatch({ type: "RESTORE_STATE", payload: before }); else baseDispatch({ type: "SYNC", payload: { status: "saved" } }); }, 180); }, []); const value = useMemo(() => ({ state, dispatch, retry: () => baseDispatch({ type: "SYNC", payload: { status: "saved" } }), simulateFailure: (kind: "error" | "unauthorized") => { failureRef.current = kind; } }), [state, dispatch]); return <RoadmapsContext.Provider value={value}>{children}</RoadmapsContext.Provider>; }
export function useRoadmaps() { const value = useContext(RoadmapsContext); if (!value) throw new Error("useRoadmaps must be used inside RoadmapsProvider"); return value; }
export function useWorkspaceBySlug(slug: string) { return useRoadmaps().state.workspaces.find((item) => item.roadmap.slug === slug); }
export function WorkspaceProvider({ roadmapId, children }: { roadmapId: string; children: ReactNode }) { return <WorkspaceContext.Provider value={roadmapId}>{children}</WorkspaceContext.Provider>; }
export function useRoadmap() { const roadmapId = useContext(WorkspaceContext); const context = useRoadmaps(); if (!roadmapId) throw new Error("useRoadmap must be used inside WorkspaceProvider"); const workspace = context.state.workspaces.find((item) => item.roadmap.id === roadmapId); if (!workspace) throw new Error("Roadmap workspace was not found"); return { state: workspace, dispatch: (action: WorkspaceAction) => context.dispatch({ type: "WORKSPACE_ACTION", roadmapId, action }) }; }
export function createEmptyWorkspace({ id, slug, title, objective }: { id: string; slug: string; title: string; objective: string }): RoadmapWorkspace { const timestamp = now(); return { roadmap: { id, slug, title, objective, createdAt: timestamp, updatedAt: timestamp, archivedAt: null, revision: 1, resources: [] }, progress: emptyProgress, quizzes: [], progressImport: { source: "manual", schemaVersion: 1, importedAt: null } }; }
