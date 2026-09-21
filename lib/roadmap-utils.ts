import type { ProgressData, ProgressStats, QuizData, Resource, Roadmap } from "@/lib/types";

export const emptyRoadmap = (): Roadmap => ({
  id: "",
  slug: "",
  title: "",
  objective: "",
  createdAt: "",
  updatedAt: "",
  archivedAt: null,
  revision: 1,
  resources: [],
});

export function slugifyRoadmapTitle(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "roadmap"
  );
}

export function uniqueRoadmapSlug(title: string, existing: string[]) {
  const base = slugifyRoadmapTitle(title);
  if (!existing.includes(base)) return base;
  let suffix = 2;
  while (existing.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function getProgressStats(progress: ProgressData): ProgressStats {
  const items = progress.sections.flatMap((section) => section.items);
  const complete = items.filter((item) => item.status === "complete").length;
  return {
    complete,
    total: items.length,
    percent: items.length ? Math.round((complete / items.length) * 100) : 0,
  };
}

export function getQuizScore(quiz: QuizData) {
  return quiz.questions.filter((question) =>
    question.answers.some(
      (answer) => answer.id === question.selectedAnswerID && answer.correct,
    ),
  ).length;
}

export function buildLearningPrompt(
  kind: "progress" | "quiz",
  roadmap: Roadmap,
) {
  const resources = roadmap.resources.length
    ? roadmap.resources
        .map((resource) => `- ${resource.title} (${resource.url || "personal note"})`)
        .join("\n")
    : "- No resources have been added yet.";

  if (kind === "progress") {
    return `Create a practical learning progress plan for “${roadmap.title}”.\nObjective: ${roadmap.objective}\n\nUse these resources:\n${resources}\n\nReturn only schema version 1 JSON: { "version": 1, "sections": [...] }. Every section needs a globally unique id, title, and items. Every item needs a globally unique id, label, and status using exactly one of: not-started, in-progress, complete.`;
  }

  return `Create a concise multiple-choice quiz for “${roadmap.title}”.\nObjective: ${roadmap.objective}\n\nBase it on these resources:\n${resources}\n\nReturn only schema version 1 JSON with this structure: { "version": 1, "title": string, "questions": [{ "id": string, "question": string, "hint": string, "selectedAnswerID": null, "answers": [{ "id": string, "text": string, "correct": boolean, "explanation": string }] }] }. Every question must have exactly four answers and exactly one correct answer. Give every question and answer a unique ID. The hint must help without revealing the answer. Explain why each answer is right or wrong. Vary the position of the correct answer across questions.`;
}

export function getHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export function normalizeResourceTags(tags: string) {
  return [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

export function resourceToFormValues(resource?: Resource) {
  return {
    type: resource?.type ?? ("article" as const),
    title: resource?.title ?? "",
    url: resource?.url ?? "",
    notes: resource?.notes ?? "",
    tags: resource?.tags.join(", ") ?? "",
  };
}

export async function readTextFile(file: File) {
  return file.text();
}
