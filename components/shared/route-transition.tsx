"use client";

import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Snapshot = { key: string; children: ReactNode };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function framesFor(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      incoming: [{ opacity: 0.35 }, { opacity: 1 }],
      outgoing: [{ opacity: 1 }, { opacity: 0 }],
    };
  }
  return {
    incoming: [
      { opacity: 0.2, transform: "translate3d(14px, 0, 0)" },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ],
    outgoing: [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(-8px, 0, 0)" },
    ],
  };
}

export function PresenceSwap({
  children,
  transitionKey,
}: {
  children: ReactNode;
  transitionKey: string;
}) {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState<Snapshot>({ key: transitionKey, children });
  const [outgoing, setOutgoing] = useState<Snapshot | null>(null);
  const currentRef = useRef(current);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentElementRef = useRef<HTMLDivElement>(null);
  const outgoingElementRef = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<Animation[]>([]);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);

  currentRef.current = current;

  const clearAnimation = () => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
    const container = containerRef.current;
    if (container) {
      container.style.height = "";
      container.style.overflow = "";
    }
  };

  useLayoutEffect(() => {
    if (currentRef.current.key === transitionKey) {
      if (currentRef.current.children !== children) {
        const next = { key: transitionKey, children };
        currentRef.current = next;
        setCurrent(next);
      }
      return;
    }

    clearAnimation();
    sequenceRef.current += 1;
    const previous = currentRef.current;
    const next = { key: transitionKey, children };
    currentRef.current = next;
    setOutgoing(previous);
    setCurrent(next);
  }, [children, transitionKey]);

  useLayoutEffect(() => {
    if (!outgoing) return;
    const sequence = sequenceRef.current;
    const container = containerRef.current;
    const incomingElement = currentElementRef.current;
    const outgoingElement = outgoingElementRef.current;
    if (!container || !incomingElement || !outgoingElement) return;

    const finish = () => {
      if (sequence !== sequenceRef.current) return;
      clearAnimation();
      setOutgoing(null);
    };

    const duration = reducedMotion ? 110 : 240;
    const frames = framesFor(reducedMotion);
    const fromHeight = outgoingElement.getBoundingClientRect().height;
    const toHeight = incomingElement.getBoundingClientRect().height;
    const easing = "cubic-bezier(0.16, 1, 0.3, 1)";

    container.style.height = `${fromHeight}px`;
    container.style.overflow = "clip";

    if (typeof incomingElement.animate !== "function") {
      fallbackTimerRef.current = setTimeout(finish, duration);
      return;
    }

    const incomingAnimation = incomingElement.animate(frames.incoming, { duration, easing, fill: "both" });
    const outgoingAnimation = outgoingElement.animate(frames.outgoing, {
      duration: Math.round(duration * 0.72),
      easing,
      fill: "both",
    });
    const heightAnimation = container.animate(
      [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
      { duration, easing, fill: "both" },
    );
    animationsRef.current = [incomingAnimation, outgoingAnimation, heightAnimation];
    Promise.allSettled(animationsRef.current.map((animation) => animation.finished)).then(finish);

    return () => {
      if (sequence !== sequenceRef.current) clearAnimation();
    };
  }, [outgoing, reducedMotion]);

  useEffect(() => () => {
    sequenceRef.current += 1;
    clearAnimation();
  }, []);

  return (
    <div ref={containerRef} className="presence-swap">
      {outgoing && (
        <div
          ref={outgoingElementRef}
          key={`outgoing-${outgoing.key}`}
          className="presence-swap__outgoing"
          aria-hidden="true"
          inert
        >
          {outgoing.children}
        </div>
      )}
      <div ref={currentElementRef} key={current.key} className="presence-swap__current">
        {current.children}
      </div>
    </div>
  );
}
