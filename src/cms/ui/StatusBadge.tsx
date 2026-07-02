import { Badge } from "@/components/ui/badge";
import type { ContentStatus } from "@/cms/types";

const LABEL: Record<ContentStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

const CLASSES: Record<ContentStatus, string> = {
  draft: "bg-warning/15 text-warning-foreground border-warning/30",
  published: "bg-success/15 text-success border-success/30",
  archived: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Badge variant="outline" className={CLASSES[status]}>
      {LABEL[status]}
    </Badge>
  );
}
