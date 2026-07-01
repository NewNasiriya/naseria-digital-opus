import { Bell, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
}

export function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="فتح قائمة الإدارة"
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="ابحث في المحتوى، الأخبار، الوسائط…"
          aria-label="البحث في لوحة الإدارة"
          className="h-10 ps-3 pe-10 text-sm"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="مركز الإشعارات"
            className="relative"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b border-border p-4">
            <p className="text-sm font-semibold text-foreground">الإشعارات</p>
            <p className="mt-1 text-xs text-muted-foreground">
              تنبيهات النشر، الرفع، والتعديلات الأخيرة.
            </p>
          </div>
          <div className="grid place-items-center gap-2 px-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-muted-foreground"
            >
              <Bell className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">
              لا توجد إشعارات جديدة
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              ستظهر هنا الإشعارات عند نشر محتوى جديد أو اكتمال الرفع.
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <div
        aria-hidden="true"
        className="hidden h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary sm:grid"
        title="الإدارة"
      >
        إد
      </div>
    </header>
  );
}
