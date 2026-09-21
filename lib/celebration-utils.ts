import type { ProgressData, QuizData } from "@/lib/types";

export type ProgressCelebration = "section-complete" | "roadmap-complete" | null;

export function getProgressCelebration(
  progress: ProgressData,
  sectionId: string,
  itemId: string,
): ProgressCelebration {
  const targetSection = progress.sections.find((section) => section.id === sectionId);
  const targetItem = targetSection?.items.find((item) => item.id === itemId);
  if (!targetSection || !targetItem || targetItem.status === "complete") return null;

  const isCompleteAfterToggle = (section: ProgressData["sections"][number], item: ProgressData["sections"][number]["items"][number]) =>
    item.status === "complete" || (section.id === sectionId && item.id === itemId);

  const roadmapComplete = progress.sections.every((section) =>
    section.items.every((item) => isCompleteAfterToggle(section, item)),
  );
  if (roadmapComplete) return "roadmap-complete";

  return targetSection.items.every((item) => isCompleteAfterToggle(targetSection, item))
    ? "section-complete"
    : null;
}

export function isStrongQuizResult(quiz: QuizData, score: number) {
  return quiz.questions.length > 0 && score / quiz.questions.length >= 0.8;
}
