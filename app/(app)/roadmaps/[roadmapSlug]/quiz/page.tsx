import type { Metadata } from "next";
import { QuizView } from "@/components/quiz/quiz-view";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage() {
  return <QuizView />;
}
