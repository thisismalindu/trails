import { describe, expect, it } from "vitest";
import { sampleProgress, sampleQuiz, sampleRoadmap } from "@/lib/mock-data";
import {
  buildLearningPrompt,
  getProgressStats,
  getQuizScore,
  normalizeResourceTags,
} from "@/lib/roadmap-utils";
import { progressSchema, quizSchema } from "@/lib/schemas";
import { getProgressCelebration, isStrongQuizResult } from "@/lib/celebration-utils";

describe("roadmap utilities", () => {
  it("calculates progress and quiz score", () => {
    expect(getProgressStats(sampleProgress)).toEqual({
      complete: 2,
      total: 5,
      percent: 40,
    });
    const answeredQuiz = {
      ...sampleQuiz,
      questions: sampleQuiz.questions.map((question, index) => ({
        ...question,
        selectedAnswerID: index === 0 ? "quiz-1b" : "quiz-2b",
      })),
    };
    expect(getQuizScore(answeredQuiz)).toBe(1);
  });

  it("builds prompts from the objective and resources", () => {
    const prompt = buildLearningPrompt("progress", sampleRoadmap);
    expect(prompt).toContain(sampleRoadmap.title);
    expect(prompt).toContain(sampleRoadmap.objective);
    expect(prompt).toContain(sampleRoadmap.resources[0].title);
  });

  it("describes the four-answer quiz contract in the generated prompt", () => {
    const prompt = buildLearningPrompt("quiz", sampleRoadmap);
    expect(prompt).toContain("selectedAnswerID");
    expect(prompt).toContain("exactly four answers");
    expect(prompt).toContain("exactly one correct answer");
    expect(prompt).toContain("Vary the position of the correct answer");
  });

  it("normalizes duplicate tags", () => {
    expect(normalizeResourceTags("react, testing, react, ")).toEqual([
      "react",
      "testing",
    ]);
  });

  it("rejects malformed progress and quiz imports", () => {
    expect(progressSchema.safeParse({ sections: [{ title: "Missing ids" }] }).success).toBe(false);
    expect(
      quizSchema.safeParse({
        title: "Invalid quiz",
        questions: [
          {
            id: "q",
            question: "Question?",
            hint: "Hint",
            selectedAnswerID: null,
            answers: [
              { id: "a", text: "A", correct: true, explanation: "Correct" },
              { id: "b", text: "B", correct: true, explanation: "Wrong" },
              { id: "c", text: "C", correct: false, explanation: "Wrong" },
              { id: "d", text: "D", correct: false, explanation: "Wrong" },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts exactly four unique answers with one correct answer", () => {
    expect(quizSchema.safeParse(sampleQuiz).success).toBe(true);
    const duplicatedAcrossQuestions = structuredClone(sampleQuiz);
    duplicatedAcrossQuestions.questions[1].answers[0].id = duplicatedAcrossQuestions.questions[0].answers[0].id;
    expect(quizSchema.safeParse(duplicatedAcrossQuestions).success).toBe(false);
  });

  it("celebrates only newly completed sections and gives roadmap completion priority", () => {
    expect(getProgressCelebration(sampleProgress, "section-1", "progress-3")).toBe("section-complete");
    expect(getProgressCelebration(sampleProgress, "section-1", "progress-1")).toBeNull();

    const oneStepAway = {
      ...sampleProgress,
      sections: sampleProgress.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, status: item.id === "progress-3" ? "not-started" as const : "complete" as const })),
      })),
    };
    expect(getProgressCelebration(oneStepAway, "section-1", "progress-3")).toBe("roadmap-complete");
  });

  it("recognizes strong quiz results at 80 percent or higher", () => {
    expect(isStrongQuizResult(sampleQuiz, 2)).toBe(true);
    expect(isStrongQuizResult(sampleQuiz, 1)).toBe(false);
  });
});
