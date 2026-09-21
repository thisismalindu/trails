import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  onAction,
}: {
  title: string;
  description: string;
  onAction: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border-strong bg-surface-raised px-6 py-12 text-center">
      <span className="mb-3 grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <BookmarkPlus className="size-5" />
      </span>
      <h3 className="text-lg font-bold tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
        {description}
      </p>
      <Button className="mt-4" size="sm" variant="outline" onClick={onAction}>
        Add your first resource
        <BookmarkPlus />
      </Button>
    </div>
  );
}
