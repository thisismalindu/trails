export type ResourceType = "article" | "video" | "note";
export type RoadmapTab = "plan" | "progress" | "quiz";
export type ResourceFilter = "all" | ResourceType;

export type Resource = {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  notes: string;
  tags: string[];
  position?: number;
  createdAt: string;
  updatedAt: string;
};

export type Roadmap = {
  id: string;
  slug: string;
  title: string;
  objective: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  revision: number;
  resources: Resource[];
};

export type RoadmapSummary = {
  id: string;
  slug: string;
  title: string;
  objective: string;
  updatedAt: string;
  archivedAt: string | null;
  revision: number;
  progress: ProgressStats;
  resourceCount: number;
};

export type ProgressStatus = "not-started" | "in-progress" | "complete";

export type ProgressItem = {
  id: string;
  label: string;
  status: ProgressStatus;
};

export type ProgressSection = {
  id: string;
  title: string;
  items: ProgressItem[];
};

export type ProgressData = {
  version: 1;
  sections: ProgressSection[];
};

export type QuizAnswer = {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  hint: string;
  selectedAnswerID: string | null;
  answers: QuizAnswer[];
};

export type QuizData = {
  version: 1;
  title: string;
  questions: QuizQuestion[];
};

export type QuizDefinitionQuestion = Omit<QuizQuestion, "selectedAnswerID">;
export type QuizDefinition = {
  version: 1;
  title: string;
  questions: QuizDefinitionQuestion[];
};

export type QuizDefinitionRevision = number;

export type QuizSession = {
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  checkedQuestionIds: string[];
  hintQuestionIds: string[];
  view: "taking" | "results" | "review";
  startedAt: string;
};

export type QuizAttempt = {
  id: string;
  definitionRevision: QuizDefinitionRevision;
  completedAt: string;
  selectedAnswers: Record<string, string>;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  percent: number;
};

export type SavedQuiz = {
  id: string;
  definition: QuizDefinition;
  definitionRevision: QuizDefinitionRevision;
  revision: number;
  createdAt: string;
  updatedAt: string;
  importProvenance: ImportProvenance;
  session: QuizSession | null;
  attempts: QuizAttempt[];
};

export type ImportProvenance = {
  source: "manual" | "sample" | "json";
  schemaVersion: 1;
  importedAt: string | null;
};

export type RoadmapWorkspace = {
  roadmap: Roadmap;
  progress: ProgressData;
  quizzes: SavedQuiz[];
  progressImport: ImportProvenance;
};

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "unauthorized";
export type SyncState = { status: SyncStatus; message?: string };

export type ProgressStats = {
  complete: number;
  total: number;
  percent: number;
};
