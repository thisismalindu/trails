// Database shape for the initial migration in supabase/migrations.
// Regenerate from the linked Supabase project with `supabase gen types typescript` once one exists.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;
type Revision = number;
type ProgressPlan = { version: 1; sections: Array<{ id: string; title: string; items: Array<{ id: string; label: string; status: "not-started" | "in-progress" | "complete" }> }> };
type QuizDefinition = { questions: Array<{ id: string; question: string; hint: string; answers: Array<{ id: string; text: string; correct: boolean; explanation: string }> }> };
type QuizSession = { currentIndex: number; selectedAnswers: Record<string, string>; checkedQuestionIds: string[]; hintQuestionIds: string[]; view: "taking" | "results" | "review"; startedAt: Timestamp } | null;

export type Database = {
  public: {
    Tables: {
      roadmaps: {
        Row: { id: string; owner_id: string; slug: string; title: string; objective: string; progress_plan: ProgressPlan; progress_import_source: "manual" | "json" | "sample"; progress_imported_at: Timestamp | null; revision: Revision; created_at: Timestamp; updated_at: Timestamp; archived_at: Timestamp | null };
        Insert: { id?: string; owner_id: string; slug: string; title: string; objective: string; progress_plan?: ProgressPlan; progress_import_source?: "manual" | "json" | "sample"; progress_imported_at?: Timestamp | null; revision?: Revision; created_at?: Timestamp; updated_at?: Timestamp; archived_at?: Timestamp | null };
        Update: { id?: string; owner_id?: string; slug?: string; title?: string; objective?: string; progress_plan?: ProgressPlan; progress_import_source?: "manual" | "json" | "sample"; progress_imported_at?: Timestamp | null; revision?: Revision; created_at?: Timestamp; updated_at?: Timestamp; archived_at?: Timestamp | null };
        Relationships: [];
      };
      resources: {
        Row: { id: string; roadmap_id: string; owner_id: string; type: "article" | "video" | "note"; title: string; url: string | null; notes: string; tags: string[]; position: number; created_at: Timestamp; updated_at: Timestamp };
        Insert: { id?: string; roadmap_id: string; owner_id: string; type: "article" | "video" | "note"; title: string; url?: string | null; notes?: string; tags?: string[]; position?: number; created_at?: Timestamp; updated_at?: Timestamp };
        Update: { id?: string; roadmap_id?: string; owner_id?: string; type?: "article" | "video" | "note"; title?: string; url?: string | null; notes?: string; tags?: string[]; position?: number; created_at?: Timestamp; updated_at?: Timestamp };
        Relationships: [{ foreignKeyName: "resources_roadmap_owner_fk"; columns: ["roadmap_id", "owner_id"]; isOneToOne: false; referencedRelation: "roadmaps"; referencedColumns: ["id", "owner_id"] }];
      };
      quizzes: {
        Row: { id: string; roadmap_id: string; owner_id: string; title: string; schema_version: 1; definition: QuizDefinition; definition_revision: number; current_session: QuizSession; import_source: "manual" | "json" | "sample"; imported_at: Timestamp | null; revision: Revision; created_at: Timestamp; updated_at: Timestamp };
        Insert: { id?: string; roadmap_id: string; owner_id: string; title: string; schema_version?: 1; definition?: QuizDefinition; definition_revision?: number; current_session?: QuizSession; import_source?: "manual" | "json" | "sample"; imported_at?: Timestamp | null; revision?: Revision; created_at?: Timestamp; updated_at?: Timestamp };
        Update: { id?: string; roadmap_id?: string; owner_id?: string; title?: string; schema_version?: 1; definition?: QuizDefinition; definition_revision?: number; current_session?: QuizSession; import_source?: "manual" | "json" | "sample"; imported_at?: Timestamp | null; revision?: Revision; created_at?: Timestamp; updated_at?: Timestamp };
        Relationships: [{ foreignKeyName: "quizzes_roadmap_owner_fk"; columns: ["roadmap_id", "owner_id"]; isOneToOne: false; referencedRelation: "roadmaps"; referencedColumns: ["id", "owner_id"] }];
      };
      quiz_attempts: {
        Row: { id: string; quiz_id: string; owner_id: string; definition_revision: number; selected_answers: Record<string, string>; correct: number; incorrect: number; unanswered: number; total: number; percent: number; completed_at: Timestamp };
        Insert: { id?: string; quiz_id: string; owner_id: string; definition_revision: number; selected_answers?: Record<string, string>; correct: number; incorrect: number; unanswered: number; total: number; percent: number; completed_at?: Timestamp };
        Update: never;
        Relationships: [{ foreignKeyName: "quiz_attempts_quiz_owner_fk"; columns: ["quiz_id", "owner_id"]; isOneToOne: false; referencedRelation: "quizzes"; referencedColumns: ["id", "owner_id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_valid_progress_plan: { Args: { document: Json }; Returns: boolean };
      is_valid_quiz_definition: { Args: { document: Json }; Returns: boolean };
      is_valid_quiz_session: { Args: { session: Json; definition: Json }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
