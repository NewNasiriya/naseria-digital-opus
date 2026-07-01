import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ADMIN_GROUP_LABEL,
  ADMIN_MODULES,
  DASHBOARD_ICON,
  type AdminModule,
} from "@/lib/admin-modules";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname === href || pathname.startsWith(href + "/");

  const grouped = ADMIN_MODULES.reduce<Record<string, AdminModule[]>>(
    (acc, m) => {
      (acc[m.group] ??= []).push(m);
      return acc;
    },
    {},
  );
  const groupOrder: AdminModule["group"][] = ["content", "media", "system"];

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
        />
      )}

      <aside
        aria-label="قائمة لوحة الإدارة"
        data-open={open ? "true" : "false"}
        className={cn(
          "admin-sidebar fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-s border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-sidebar-border px-5">
          <Link
            to="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold"
            >
              ن
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold">لوحة الإدارة</span>
              <span className="truncate text-[11px] text-sidebar-foreground/70">
                مدرسة الناصرية الابتدائية
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="إغلاق القائمة"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav aria-label="أقسام لوحة الإدارة" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <NavLink
                href="/admin"
                label="لوحة التحكم"
                Icon={DASHBOARD_ICON}
                active={isActive("/admin")}
                onNavigate={onClose}
              />
            </li>
          </ul>

          {groupOrder.map((group) => (
            <div key={group} className="mt-6">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                {ADMIN_GROUP_LABEL[group]}
              </p>
              <ul className="space-y-1">
                {grouped[group]?.map((m) => (
                  <li key={m.id}>
                    <NavLink
                      href={`/admin/${m.slug}`}
                      label={m.short}
                      Icon={m.icon}
                      active={isActive(`/admin/${m.slug}`)}
                      onNavigate={onClose}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span>عرض الموقع العام</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: AdminModule["icon"];
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
