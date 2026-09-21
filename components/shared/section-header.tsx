import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4 max-sm:flex-col">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
