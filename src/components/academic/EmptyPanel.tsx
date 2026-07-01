import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyPanelProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

/**
 * Reusable elegant empty-state panel for CMS-driven sections
 * that have no published content yet.
 */
export function EmptyPanel({
  title = "لا يوجد محتوى منشور بعد",
  description = "ستقوم إدارة المدرسة بنشر المحتوى قريبًا. تابعونا للاطلاع على آخر المستجدات.",
  icon: Icon = Inbox,
}: EmptyPanelProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
