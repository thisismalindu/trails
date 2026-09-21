import { z } from "zod";

export const onboardingSchema = z.object({
  title: z.string().trim().min(3, "Give your roadmap a descriptive title."),
  objective: z.string().trim().min(10, "Describe the outcome you want to reach."),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter any email or username."),
  password: z.string().min(1, "Enter any password."),
});

export const resourceSchema = z.object({
  type: z.enum(["article", "video", "note"]),
  title: z.string().trim().min(2, "Add a title for this resource."),
  url: z
    .string()
    .trim()
    .refine((value) => !value || URL.canParse(value), "Enter a complete URL, including https://."),
  notes: z.string().trim(),
  tags: z.string(),
}).superRefine((resource, context) => {
  if (resource.type !== "note" && !resource.url) {
    context.addIssue({ code: "custom", path: ["url"], message: "Articles and videos require a URL." });
  }
});

export const progressSchema = z.object({
  version: z.literal(1, { error: "Only schema version 1 is supported." }),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string().min(1),
          status: z.enum(["not-started", "in-progress", "complete"]),
        }),
      ),
    }),
  ),
}).superRefine((plan, context) => {
  const sectionIds = new Set<string>();
  const itemIds = new Set<string>();
  plan.sections.forEach((section, sectionIndex) => {
    if (sectionIds.has(section.id)) context.addIssue({ code: "custom", path: ["sections", sectionIndex, "id"], message: "Section IDs must be unique." });
    sectionIds.add(section.id);
    section.items.forEach((item, itemIndex) => {
      if (itemIds.has(item.id)) context.addIssue({ code: "custom", path: ["sections", sectionIndex, "items", itemIndex, "id"], message: "Item IDs must be unique." });
      itemIds.add(item.id);
    });
  });
});

export const quizSchema = z.object({
  version: z.literal(1, { error: "Only schema version 1 is supported." }),
  title: z.string().min(1),
  questions: z.array(
    z
      .object({
        id: z.string().min(1),
        question: z.string().min(1),
        hint: z.string().min(1),
        selectedAnswerID: z.string().min(1).nullable(),
        answers: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(1),
              correct: z.boolean(),
              explanation: z.string().min(1),
            }),
          )
          .length(4, "Every question must have exactly four answers."),
      })
      .refine((item) => new Set(item.answers.map((answer) => answer.id)).size === 4, {
        message: "Answer IDs must be unique within each question.",
        path: ["answers"],
      })
      .refine((item) => item.answers.filter((answer) => answer.correct).length === 1, {
        message: "Every question must have exactly one correct answer.",
        path: ["answers"],
      })
      .refine(
        (item) =>
          item.selectedAnswerID === null ||
          item.answers.some((answer) => answer.id === item.selectedAnswerID),
        {
          message: "selectedAnswerID must be null or match an answer ID.",
          path: ["selectedAnswerID"],
        },
      ),
  ).superRefine((questions, context) => {
    const ids = new Set<string>();
    const answerIds = new Set<string>();
    questions.forEach((question, index) => {
      if (ids.has(question.id)) {
        context.addIssue({
          code: "custom",
          message: "Question IDs must be unique.",
          path: [index, "id"],
        });
      }
      ids.add(question.id);
      question.answers.forEach((answer, answerIndex) => {
        if (answerIds.has(answer.id)) {
          context.addIssue({
            code: "custom",
            message: "Answer IDs must be unique across the quiz.",
            path: [index, "answers", answerIndex, "id"],
          });
        }
        answerIds.add(answer.id);
      });
    });
  }),
});
