"use client";

import Skeleton from "react-loading-skeleton";
import { useRouteLoadingSignal } from "./navigation-transition";

type RouteSkeletonVariant = "list" | "collection" | "detail" | "quiz";

export function RouteSkeleton({ variant = "collection" }: { variant?: RouteSkeletonVariant }) {
  useRouteLoadingSignal();

  if (variant === "list") {
    return (
      <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-5 sm:py-8" aria-label="Loading">
        <div className="mb-5 flex justify-between">
          <div className="w-64"><Skeleton height={24} width="45%" /><Skeleton width="88%" /></div>
          <Skeleton height={32} width={112} />
        </div>
        <div className="overflow-hidden rounded-lg border bg-surface-raised">
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid min-h-16 grid-cols-[1fr_9rem_7rem] items-center gap-4 border-b px-4 last:border-0">
              <div><Skeleton width="52%" /><Skeleton width="78%" /></div>
              <Skeleton height={6} />
              <Skeleton width={56} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (variant === "quiz") {
    return (
      <div className="grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]" aria-label="Loading quiz">
        <aside className="rounded-lg border bg-surface-raised p-4"><Skeleton height={22} width="65%" /><Skeleton count={6} height={36} className="mt-2" /></aside>
        <div className="rounded-lg border bg-surface-raised p-5 sm:p-8"><Skeleton width={100} /><Skeleton height={32} width="80%" className="mt-4" /><Skeleton count={4} height={56} className="mt-3" /></div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="w-full max-w-5xl" aria-label="Loading details">
        <Skeleton width={120} />
        <div className="mt-4 rounded-lg border bg-surface-raised p-5"><Skeleton height={28} width="55%" /><Skeleton width="30%" /><div className="mt-7"><Skeleton count={5} /></div></div>
      </div>
    );
  }

  return (
    <div aria-label="Loading workspace">
      <div className="mb-4 flex justify-between"><div className="w-72"><Skeleton height={22} width="40%" /><Skeleton width="90%" /></div><Skeleton height={32} width={110} /></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="rounded-lg border bg-surface-raised p-4"><Skeleton width="30%" /><Skeleton height={20} width="75%" className="mt-4" /><Skeleton count={2} className="mt-2" /></div>)}
      </div>
    </div>
  );
}
