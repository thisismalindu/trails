import type {
  ProgressData,
  QuizData,
  Resource,
  Roadmap,
  RoadmapWorkspace,
} from "./types";

export const sampleResources: Resource[] = [
  {
    id: "resource-1",
    type: "article",
    title: "The architecture of a modern web app",
    url: "https://www.patterns.dev/",
    notes: "A useful overview of how the pieces fit together.",
    tags: ["foundations", "architecture"],
    createdAt: "2026-09-01T09:30:00.000Z",
    updatedAt: "2026-09-16T09:30:00.000Z",
  },
  {
    id: "resource-2",
    type: "video",
    title: "React Server Components, explained",
    url: "https://www.youtube.com/watch?v=example",
    notes: "Watch up to the first demo and write down the mental model.",
    tags: ["react", "next.js"],
    createdAt: "2026-09-03T09:30:00.000Z",
    updatedAt: "2026-09-14T09:30:00.000Z",
  },
  {
    id: "resource-3",
    type: "note",
    title: "Questions to answer this week",
    url: "",
    notes: "When should state live on the client? What belongs at the edge?",
    tags: ["reflection"],
    createdAt: "2026-09-04T09:30:00.000Z",
    updatedAt: "2026-09-12T09:30:00.000Z",
  },
];

export const sampleRoadmap: Roadmap = {
  id: "roadmap-web-architecture",
  slug: "modern-web-architecture",
  title: "Become fluent in modern web architecture",
  objective: "Build and explain small production-ready web apps with confidence.",
  createdAt: "2026-09-01T09:30:00.000Z",
  updatedAt: "2026-09-16T09:30:00.000Z",
  archivedAt: null,
  revision: 3,
  resources: sampleResources,
};

export const sampleProgress: ProgressData = {
  version: 1,
  sections: [
    {
      id: "section-1",
      title: "Foundations",
      items: [
        { id: "progress-1", label: "Describe the request lifecycle", status: "complete" },
        { id: "progress-2", label: "Map the client, server, and data layers", status: "complete" },
        { id: "progress-3", label: "Explain caching in your own words", status: "in-progress" },
      ],
    },
    {
      id: "section-2",
      title: "Build and review",
      items: [
        { id: "progress-4", label: "Ship a small full-stack feature", status: "in-progress" },
        { id: "progress-5", label: "Write a short architecture decision record", status: "not-started" },
      ],
    },
  ],
};

export const sampleQuiz: QuizData = {
  version: 1,
  title: "Architecture check-in",
  questions: [
    {
      id: "quiz-1",
      question: "Which layer should own a reusable display-only component?",
      hint: "Think about which layer is responsible for presentation rather than data or infrastructure.",
      selectedAnswerID: null,
      answers: [
        { id: "quiz-1a", text: "The database", correct: false, explanation: "The database stores and queries data; it should not own presentation components." },
        { id: "quiz-1b", text: "The UI layer", correct: true, explanation: "Display-only components belong close to the UI so they remain easy to compose and test." },
        { id: "quiz-1c", text: "The network edge", correct: false, explanation: "The network edge handles delivery concerns, not reusable interface composition." },
        { id: "quiz-1d", text: "The deployment pipeline", correct: false, explanation: "A deployment pipeline builds and ships software; it does not own runtime UI components." },
      ],
    },
    {
      id: "quiz-2",
      question: "What is a good first response to a slow page?",
      hint: "Start by replacing assumptions with evidence.",
      selectedAnswerID: null,
      answers: [
        { id: "quiz-2a", text: "Measure the critical path", correct: true, explanation: "A performance trace identifies which part of the critical path actually deserves attention." },
        { id: "quiz-2b", text: "Add more dependencies", correct: false, explanation: "Additional dependencies may increase the work a slow page already performs." },
        { id: "quiz-2c", text: "Rewrite everything", correct: false, explanation: "A rewrite is expensive and premature before the bottleneck is measured." },
        { id: "quiz-2d", text: "Hide the loading state", correct: false, explanation: "Hiding feedback does not improve the underlying performance problem." },
      ],
    },
  ],
};

const systemsRoadmap: Roadmap = {
  id: "roadmap-distributed-systems",
  slug: "distributed-systems-foundations",
  title: "Distributed systems foundations",
  objective: "Reason about reliable services, consistency, queues, and failure modes.",
  createdAt: "2026-09-02T14:10:00.000Z",
  updatedAt: "2026-09-12T14:10:00.000Z",
  archivedAt: null,
  revision: 2,
  resources: [
    {
      id: "systems-resource-1",
      type: "article",
      title: "Designing data-intensive applications notes",
      url: "https://dataintensive.net/",
      notes: "Track the trade-offs behind replication and partitioning.",
      tags: ["reliability", "data"],
      createdAt: "2026-09-02T14:10:00.000Z",
      updatedAt: "2026-09-12T14:10:00.000Z",
    },
    {
      id: "systems-resource-2",
      type: "note",
      title: "Failure modes to revisit",
      url: "",
      notes: "Network partitions, retries, idempotency, and split brain.",
      tags: ["review"],
      createdAt: "2026-09-04T14:10:00.000Z",
      updatedAt: "2026-09-11T14:10:00.000Z",
    },
  ],
};

const systemsProgress: ProgressData = {
  version: 1,
  sections: [
    {
      id: "systems-section-1",
      title: "Core models",
      items: [
        { id: "systems-progress-1", label: "Explain partial failure", status: "complete" },
        { id: "systems-progress-2", label: "Compare consistency models", status: "in-progress" },
        { id: "systems-progress-3", label: "Model an idempotent consumer", status: "not-started" },
      ],
    },
  ],
};

const platformRoadmap: Roadmap = {
  id: "roadmap-platform-engineering",
  slug: "platform-engineering-basics",
  title: "Platform engineering basics",
  objective: "Understand the building blocks of a useful internal developer platform.",
  createdAt: "2026-09-08T07:45:00.000Z",
  updatedAt: "2026-09-08T07:45:00.000Z",
  archivedAt: null,
  revision: 1,
  resources: [],
};

export const emptyProgress: ProgressData = { version: 1, sections: [] };
export const emptyQuiz: QuizData = {
  version: 1,
  title: "Knowledge check",
  questions: [],
};

const sampleSavedQuiz = {
  id: "quiz-architecture-check-in",
  definition: {
    version: 1 as const,
    title: sampleQuiz.title,
    questions: sampleQuiz.questions.map(({ selectedAnswerID: _selected, ...question }) => question),
  },
  definitionRevision: 1,
  revision: 1,
  createdAt: "2026-09-10T09:30:00.000Z",
  updatedAt: "2026-09-16T09:30:00.000Z",
  importProvenance: { source: "sample" as const, schemaVersion: 1 as const, importedAt: null },
  session: null,
  attempts: [],
};

export const sampleWorkspaces: RoadmapWorkspace[] = [
  {
    roadmap: sampleRoadmap,
    progress: sampleProgress,
    quizzes: [sampleSavedQuiz],
    progressImport: { source: "sample", schemaVersion: 1, importedAt: null },
  },
  {
    roadmap: systemsRoadmap,
    progress: systemsProgress,
    quizzes: [],
    progressImport: { source: "sample", schemaVersion: 1, importedAt: null },
  },
  {
    roadmap: platformRoadmap,
    progress: emptyProgress,
    quizzes: [],
    progressImport: { source: "sample", schemaVersion: 1, importedAt: null },
  },
];
