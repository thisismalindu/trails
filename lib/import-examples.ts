export const progressImportExample = {
  version: 1,
  sections: [{ id: "foundations", title: "Foundations", items: [{ id: "read-overview", label: "Read the overview", status: "not-started" }] }],
};

export const quizImportExample = {
  version: 1,
  title: "Knowledge check",
  questions: [{
    id: "q1", question: "Question text", hint: "A useful hint", selectedAnswerID: null,
    answers: [
      { id: "q1a", text: "Answer A", correct: false, explanation: "Why this is wrong" },
      { id: "q1b", text: "Answer B", correct: true, explanation: "Why this is correct" },
      { id: "q1c", text: "Answer C", correct: false, explanation: "Why this is wrong" },
      { id: "q1d", text: "Answer D", correct: false, explanation: "Why this is wrong" },
    ],
  }],
};

export function downloadImportExample(kind: "progress" | "quiz") {
  const value = kind === "progress" ? progressImportExample : quizImportExample;
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `trails-${kind}-v1.example.json`; anchor.click();
  URL.revokeObjectURL(url);
}
