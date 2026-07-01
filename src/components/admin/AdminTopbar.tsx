import { useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, Menu, Search, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth, ROLE_LABELS } from "@/lib/auth";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
}

export function AdminTopbar({ onToggleSidebar }: AdminTopbarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.fullName ?? profile?.email ?? "إد")
    .trim()
    .slice(0, 2);
  const roleLabel = profile?.roles?.length
    ? ROLE_LABELS[profile.roles[0]]
    : "الإدارة";

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

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

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="قائمة الحساب"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
            >
              {initials}
            </span>
            <span className="hidden text-start sm:block">
              <span className="block text-xs font-semibold text-foreground">
                {profile?.fullName ?? "الإدارة"}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {roleLabel}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <div className="border-b border-border p-4">
            <p className="text-sm font-semibold text-foreground">
              {profile?.fullName ?? "الإدارة"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
              {profile?.email ?? "—"}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
              {roleLabel}
            </p>
          </div>
          <div className="p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-foreground transition-colors hover:bg-accent"
            >
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              الحساب الشخصي
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              تسجيل الخروج
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}
