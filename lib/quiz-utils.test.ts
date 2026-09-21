import { describe, expect, it } from "vitest";
import { sampleQuiz } from "@/lib/mock-data";
import { createAttempt, createQuizSession, createSavedQuiz, quizDefinitionFromImport, scoreQuiz } from "./quiz-utils";

describe("quiz workspace utilities", () => {
  it("turns imported JSON into a clean saved definition", () => {
    const saved = createSavedQuiz(quizDefinitionFromImport(sampleQuiz), "json", "saved-quiz");
    expect(saved.id).toBe("saved-quiz");
    expect(saved.importProvenance.source).toBe("json");
    expect(saved.definition.questions[0]).not.toHaveProperty("selectedAnswerID");
    expect(saved.session).toBeNull();
  });

  it("scores finished sessions and records unanswered questions", () => {
    const saved = createSavedQuiz(quizDefinitionFromImport(sampleQuiz));
    const session = { ...createQuizSession(), selectedAnswers: { "quiz-1": "quiz-1b" } };
    expect(scoreQuiz(saved, session)).toMatchObject({ correct: 1, incorrect: 0, unanswered: 1, total: 2, percent: 50 });
    expect(createAttempt(saved, session)).toMatchObject({ definitionRevision: 1, percent: 50 });
  });
});
