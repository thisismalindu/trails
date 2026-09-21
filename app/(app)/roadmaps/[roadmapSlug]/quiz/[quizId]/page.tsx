import type { Metadata } from "next";
import { QuizRunner } from "@/components/quiz/quiz-runner";
export const metadata: Metadata = { title: "Take quiz" };
export default async function Page({ params }: { params: Promise<{ quizId: string }> }) { const { quizId } = await params; return <QuizRunner quizId={quizId} />; }
