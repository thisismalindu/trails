"use client";

import { CheckCircle2, CircleAlert, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

export function QuestionCard({
  question,
  index,
  selected,
  checked,
  onSelect,
  hintVisible: controlledHintVisible,
  onHintChange,
}: {
  question: QuizQuestion;
  index: number;
  selected: string | null;
  checked: boolean;
  onSelect: (answerId: string) => void;
  hintVisible?: boolean;
  onHintChange?: (visible: boolean) => void;
}) {
  const [localHintVisible, setLocalHintVisible] = useState(false);
  const hintVisible = controlledHintVisible ?? localHintVisible;
  const setHintVisible = (visible: boolean) => onHintChange ? onHintChange(visible) : setLocalHintVisible(visible);
  const selectedAnswer = question.answers.find((answer) => answer.id === selected);
  const correctAnswer = question.answers.find((answer) => answer.correct)!;
  const isCorrect = Boolean(checked && selectedAnswer?.correct);
  const questionLabelId = `question-${question.id}`;

  return (
    <Card className="gap-3 border-border bg-surface-raised py-4 shadow-none">
      <CardHeader className="grid grid-cols-[1.5rem_1fr] gap-2 px-4">
        <span className="pt-1 font-mono text-xs text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <CardTitle id={questionLabelId} className="text-base leading-6">{question.question}</CardTitle>
          {!checked && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="mt-1 -ml-2 text-muted-foreground"
              aria-expanded={hintVisible}
              onClick={() => setHintVisible(!hintVisible)}
            >
              <Lightbulb /> {hintVisible ? "Hide hint" : "Show hint"}
            </Button>
          )}
          {hintVisible && !checked && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{question.hint}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pl-12 pr-4 max-sm:pl-4">
        <RadioGroup
          value={selected ?? ""}
          onValueChange={onSelect}
          disabled={checked}
          aria-labelledby={questionLabelId}
          className="gap-2"
        >
          {question.answers.map((answer) => {
            const correctOption = checked && answer.correct;
            const wrongSelection = checked && selected === answer.id && !answer.correct;
            return (
              <Label
                key={answer.id}
                htmlFor={answer.id}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-150 hover:border-primary/55 hover:bg-secondary/35",
                  selected === answer.id && "border-primary bg-secondary/80 text-secondary-foreground",
                  correctOption && "border-primary/60 bg-secondary text-secondary-foreground",
                  wrongSelection && "border-destructive/60 bg-destructive/8 text-destructive",
                  checked && "cursor-default hover:bg-background",
                )}
              >
                <RadioGroupItem id={answer.id} value={answer.id} />
                {answer.text}
              </Label>
            );
          })}
        </RadioGroup>

        {checked && (
          <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
            {isCorrect ? <CheckCircle2 /> : <CircleAlert />}
            <AlertTitle>
              {isCorrect
                ? "Correct"
                : selectedAnswer
                  ? `Correct answer: ${correctAnswer.text}`
                  : `No answer selected. Correct answer: ${correctAnswer.text}`}
            </AlertTitle>
            <AlertDescription className="space-y-1.5">
              {selectedAnswer && !selectedAnswer.correct && (
                <p><strong>Your answer:</strong> {selectedAnswer.explanation}</p>
              )}
              <p>{correctAnswer.explanation}</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
