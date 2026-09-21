"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type ComponentProps, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type NavigationContextValue = { beginNavigation: () => void; registerRouteLoading: () => () => void };
const NavigationContext = createContext<NavigationContextValue | null>(null);
const MIN_CYCLE = 280;
const COMPLETE_FADE = 170;

export function NavigationTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(8);
  const [visible, setVisible] = useState(true);
  const startedAt = useRef(0);
  const active = useRef(true);
  const routeCommitted = useRef(false);
  const loadingBoundaries = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => { if (interval.current) clearInterval(interval.current); if (completionTimer.current) clearTimeout(completionTimer.current); if (hideTimer.current) clearTimeout(hideTimer.current); if (failsafeTimer.current) clearTimeout(failsafeTimer.current); interval.current = null; completionTimer.current = null; hideTimer.current = null; failsafeTimer.current = null; }, []);
  const beginNavigation = useCallback(() => {
    clearTimers(); active.current = true; routeCommitted.current = false; startedAt.current = performance.now(); setProgress(8); setVisible(true);
    interval.current = setInterval(() => setProgress((value) => Math.min(92, value + Math.max(0.8, (92 - value) * 0.12))), 120);
    failsafeTimer.current = setTimeout(() => { clearTimers(); active.current = false; setVisible(false); }, 10_000);
  }, [clearTimers]);
  const completeWhenReady = useCallback(() => {
    if (completionTimer.current) clearTimeout(completionTimer.current); completionTimer.current = null;
    if (!active.current || !routeCommitted.current || loadingBoundaries.current > 0) return;
    completionTimer.current = setTimeout(() => {
      if (!active.current || !routeCommitted.current || loadingBoundaries.current > 0) return;
      if (interval.current) clearInterval(interval.current); if (failsafeTimer.current) clearTimeout(failsafeTimer.current); interval.current = null; failsafeTimer.current = null;
      const remaining = Math.max(0, MIN_CYCLE - (performance.now() - startedAt.current));
      completionTimer.current = setTimeout(() => { setProgress(100); hideTimer.current = setTimeout(() => { active.current = false; setVisible(false); }, COMPLETE_FADE); }, remaining);
    }, 0);
  }, []);
  const registerRouteLoading = useCallback(() => {
    if (completionTimer.current) clearTimeout(completionTimer.current); completionTimer.current = null;
    loadingBoundaries.current += 1;
    if (!active.current) beginNavigation();
    let registered = true;
    return () => { if (!registered) return; registered = false; loadingBoundaries.current = Math.max(0, loadingBoundaries.current - 1); completeWhenReady(); };
  }, [beginNavigation, completeWhenReady]);

  useEffect(() => {
    if (!startedAt.current) beginNavigation();
    routeCommitted.current = true;
    completeWhenReady();
  }, [pathname, beginNavigation, completeWhenReady]);
  useEffect(() => {
    const onPopState = () => beginNavigation();
    const onClick = (event: MouseEvent) => { const anchor = (event.target as Element | null)?.closest("a"); if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.download) return; const url = new URL(anchor.href, location.href); if (url.origin === location.origin && `${url.pathname}${url.search}` !== `${location.pathname}${location.search}`) beginNavigation(); };
    addEventListener("popstate", onPopState); document.addEventListener("click", onClick, true);
    return () => { removeEventListener("popstate", onPopState); document.removeEventListener("click", onClick, true); clearTimers(); };
  }, [beginNavigation, clearTimers]);

  const value = useMemo(() => ({ beginNavigation, registerRouteLoading }), [beginNavigation, registerRouteLoading]);
  return <NavigationContext.Provider value={value}>{children}<span className={`navigation-tracer${visible ? " navigation-tracer--visible" : ""}`} style={{ "--navigation-progress": progress / 100 } as React.CSSProperties} aria-hidden="true" /></NavigationContext.Provider>;
}

export function useNavigationProgress() { return useContext(NavigationContext) ?? { beginNavigation: () => undefined, registerRouteLoading: () => () => undefined }; }
export function useRouteLoadingSignal() { const { registerRouteLoading } = useNavigationProgress(); useLayoutEffect(() => registerRouteLoading(), [registerRouteLoading]); }
export function TransitionLink({ onClick, href, target, ...props }: ComponentProps<typeof Link>) { return <Link href={href} target={target} onClick={onClick} {...props} />; }
