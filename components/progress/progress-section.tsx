import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressSection as ProgressSectionType } from "@/lib/types";
import type { ProgressStatus } from "@/lib/types";
import { ProgressItem } from "./progress-item";
import { ArrowDown, ArrowUp, CheckCircle2, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ProgressSection({
  section,
  onStatusChange,
  onAddItem, onEdit, onDelete, onMove, onEditItem, onDeleteItem, onMoveItem,
}: {
  section: ProgressSectionType;
  onStatusChange: (itemId: string, status: ProgressStatus) => void;
  onAddItem: () => void; onEdit: () => void; onDelete: () => void; onMove: (direction: -1 | 1) => void;
  onEditItem: (itemId: string) => void; onDeleteItem: (itemId: string) => void; onMoveItem: (itemId: string, direction: -1 | 1) => void;
}) {
  const complete = section.items.filter((item) => item.status === "complete").length;
  const sectionComplete = section.items.length > 0 && complete === section.items.length;
  return (
    <Card className="gap-3 border-border bg-surface-raised py-4 shadow-none">
      <CardHeader className="flex-row items-center justify-between px-4">
        <CardTitle className="flex items-center gap-2 text-base">{sectionComplete && <CheckCircle2 className="size-4 text-primary" />}{section.title}</CardTitle>
        <div className="flex items-center gap-1"><span className={cn("rounded-md bg-surface-inset px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground", sectionComplete && "bg-secondary text-secondary-foreground")}>{sectionComplete ? "Complete · " : ""}{complete}/{section.items.length}</span><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`Actions for ${section.title}`}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onAddItem}><Plus /> Add item</DropdownMenuItem><DropdownMenuItem onSelect={onEdit}><Pencil /> Rename</DropdownMenuItem><DropdownMenuItem onSelect={() => onMove(-1)}><ArrowUp /> Move up</DropdownMenuItem><DropdownMenuItem onSelect={() => onMove(1)}><ArrowDown /> Move down</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 /> Delete section</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
      </CardHeader>
      <CardContent className="px-4">
        {section.items.map((item, index) => <div key={item.id} className="group relative pr-8"><ProgressItem item={item} onStatusChange={(status) => onStatusChange(item.id, status)} /><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Edit ${item.label}`}><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEditItem(item.id)}><Pencil /> Rename</DropdownMenuItem><DropdownMenuItem disabled={index === 0} onSelect={() => onMoveItem(item.id, -1)}><ArrowUp /> Move up</DropdownMenuItem><DropdownMenuItem disabled={index === section.items.length - 1} onSelect={() => onMoveItem(item.id, 1)}><ArrowDown /> Move down</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => onDeleteItem(item.id)}><Trash2 /> Delete item</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}
      </CardContent>
    </Card>
  );
}
