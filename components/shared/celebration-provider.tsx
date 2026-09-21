"use client";

import { CheckCircle2 } from "lucide-react";
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CelebrationEvent =
  | { id?: number; kind: "section-complete"; sectionTitle: string; roadmapTitle: string }
  | { id?: number; kind: "roadmap-complete"; roadmapTitle: string }
  | { id?: number; kind: "quiz-win"; quizTitle: string; score: number; total: number };

export type CelebrationEventInput =
  | { kind: "section-complete"; sectionTitle: string; roadmapTitle: string }
  | { kind: "roadmap-complete"; roadmapTitle: string }
  | { kind: "quiz-win"; quizTitle: string; score: number; total: number };

type CelebrationContextValue = { celebrate: (event: CelebrationEventInput) => void };

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; spin: number };

function createParticles(event: CelebrationEvent, width: number, height: number): Particle[] {
  const count = event.kind === "roadmap-complete" ? 72 : 46;
  const colors = ["#2f6d5e", "#c96247", "#c49336", "#dde6df"];
  const originX = width / 2;
  const originY = Math.max(110, Math.min(height * 0.34, 260));

  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI * (1.08 + Math.random() * 0.84);
    const velocity = 3.4 + Math.random() * 4.8;
    return {
      x: originX + (Math.random() - 0.5) * 46,
      y: originY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 2.5,
      size: 4 + Math.random() * 4,
      color: colors[index % colors.length],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.25,
    };
  });
}

function CelebrationCanvas({ event, open }: { event: CelebrationEvent | null; open: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!event || !open || !canvasRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const startTimer = setTimeout(() => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      const ratio = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.scale(ratio, ratio);

      const particles = createParticles(event, width, height);
      const startedAt = performance.now();
      const draw = (time: number) => {
        const elapsed = time - startedAt;
        context.clearRect(0, 0, width, height);
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.12;
          particle.vx *= 0.988;
          particle.rotation += particle.spin;
          context.save();
          context.globalAlpha = Math.max(0, 1 - elapsed / 900);
          context.translate(particle.x, particle.y);
          context.rotate(particle.rotation);
          context.fillStyle = particle.color;
          context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
          context.restore();
        });
        if (elapsed < 900) frame = requestAnimationFrame(draw);
        else context.clearRect(0, 0, width, height);
      };
      frame = requestAnimationFrame(draw);
    }, 80);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(frame);
    };
  }, [event, open]);

  return <canvas ref={canvasRef} aria-hidden="true" className="celebration-canvas" />;
}

function getCopy(event: CelebrationEvent) {
  if (event.kind === "section-complete") {
    return {
      title: "Section complete",
      description: `${event.sectionTitle} is complete in ${event.roadmapTitle}.`,
    };
  }
  if (event.kind === "roadmap-complete") {
    return {
      title: "Roadmap complete",
      description: `You completed every tracked step in ${event.roadmapTitle}.`,
    };
  }
  const percent = Math.round((event.score / event.total) * 100);
  return {
    title: "Quiz complete",
    description: `${event.score} of ${event.total} correct — ${percent}%.`,
  };
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [remaining, setRemaining] = useState(3_000);
  const eventId = useRef(0);
  const remainingRef = useRef(3_000);
  const startedAt = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const lastInput = useRef<"keyboard" | "pointer">("pointer");
  const paused = hovered || keyboardFocused || hidden;

  const close = useCallback(() => {
    if (openFrame.current !== null) {
      cancelAnimationFrame(openFrame.current);
      openFrame.current = null;
    }
    setOpen(false);
    setEvent(null);
  }, []);

  const celebrate = useCallback((nextEvent: CelebrationEventInput) => {
    eventId.current += 1;
    setEvent({ ...nextEvent, id: eventId.current } as CelebrationEvent);
    remainingRef.current = 3_000;
    startedAt.current = null;
    setRemaining(3_000);
    if (openFrame.current !== null) cancelAnimationFrame(openFrame.current);
    // Opening on the next paint prevents the click that completed the item
    // from being interpreted as an outside interaction by the dialog layer.
    openFrame.current = requestAnimationFrame(() => {
      openFrame.current = null;
      setOpen(true);
    });
  }, []);

  useEffect(() => () => {
    if (openFrame.current !== null) cancelAnimationFrame(openFrame.current);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const noteKeyboardInput = () => {
      lastInput.current = "keyboard";
    };
    const notePointerInput = () => {
      lastInput.current = "pointer";
      setKeyboardFocused(false);
    };
    window.addEventListener("keydown", noteKeyboardInput, true);
    window.addEventListener("pointerdown", notePointerInput, true);
    return () => {
      window.removeEventListener("keydown", noteKeyboardInput, true);
      window.removeEventListener("pointerdown", notePointerInput, true);
    };
  }, []);

  useEffect(() => {
    if (!open || !event) return;

    if (paused) {
      if (startedAt.current !== null) {
        remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAt.current));
        setRemaining(remainingRef.current);
        startedAt.current = null;
      }
      return;
    }

    startedAt.current = performance.now();
    const interval = setInterval(() => {
      if (startedAt.current === null) return;
      const nextRemaining = Math.max(0, remainingRef.current - (performance.now() - startedAt.current));
      setRemaining(nextRemaining);
      if (nextRemaining === 0) close();
    }, 100);

    return () => {
      clearInterval(interval);
      if (startedAt.current !== null) {
        remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAt.current));
        startedAt.current = null;
      }
    };
  }, [close, event?.id, open, paused]);

  const copy = event ? getCopy(event) : null;
  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <CelebrationCanvas event={event} open={open} />
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
        {copy && (
          <DialogContent
            className="completion-dialog z-[60] max-w-sm border-primary/35 bg-surface-raised p-0"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocusCapture={() => {
              if (lastInput.current === "keyboard") setKeyboardFocused(true);
            }}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboardFocused(false);
            }}
          >
            <DialogHeader className="px-6 pt-6">
              <div className="mb-1 grid size-9 place-items-center rounded-md bg-secondary text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="border-t bg-surface-inset/45 px-6 py-4 sm:justify-between">
              <span className="text-xs text-muted-foreground">Closing automatically</span>
              <Button onClick={close}>Continue</Button>
            </DialogFooter>
            <span
              className="completion-dialog__timer"
              style={{ "--completion-progress": Math.max(0, remaining / 3_000) } as CSSProperties}
              aria-hidden="true"
            />
          </DialogContent>
        )}
      </Dialog>
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error("useCelebration must be used inside CelebrationProvider");
  return context;
}
