import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Newspaper,
  Images,
  ClipboardList,
  Upload,
  Award,
  Trophy,
  FolderOpen,
  Send,
  Clock,
  History,
} from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { ModuleCard } from "@/components/admin/ModuleCard";
import { QuickActionButton } from "@/components/admin/QuickActionButton";
import { StatTile } from "@/components/admin/StatTile";
import { ADMIN_MODULES } from "@/lib/admin-modules";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickActions = [
    { label: "إضافة خبر جديد", icon: Newspaper, to: "/admin/news" },
    { label: "رفع جدول دراسي", icon: ClipboardList, to: "/admin/academic" },
    { label: "استبدال كشف الشرف", icon: Award, to: "/admin/honor" },
    { label: "رفع صور إنجاز", icon: Trophy, to: "/admin/achievements" },
    { label: "فتح مكتبة الوسائط", icon: FolderOpen, to: "/admin/media" },
    { label: "نشر المسودات", icon: Send, to: "/admin/status" },
  ];

  return (
    <>
      <section className="mb-10 rounded-3xl border border-border bg-gradient-to-l from-primary-soft/50 via-background to-background p-6 sm:p-8">
        <p className="text-xs font-medium text-primary">لوحة الإدارة</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          مرحبًا بعودتك
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{today}</p>
        <p className="mt-4 max-w-2xl text-sm leading-loose text-muted-foreground">
          هذه لوحة إدارة موقع المدرسة. تحكّم في جميع أقسام الموقع من مكان واحد،
          ونشر التحديثات مباشرة إلى الموقع العام.
        </p>
      </section>

      <section aria-labelledby="stats-heading" className="mb-10">
        <h2 id="stats-heading" className="sr-only">
          إحصائيات
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="الصفحات المنشورة"
            value="—"
            hint="جاهزة للعرض على الموقع العام"
            icon={FileText}
          />
          <StatTile
            label="أخبار هذا الشهر"
            value="—"
            hint="عدد الأخبار المنشورة خلال 30 يومًا"
            icon={Newspaper}
          />
          <StatTile
            label="ملفات الوسائط"
            value="—"
            hint="الصور والملفات في المكتبة"
            icon={Images}
          />
          <StatTile
            label="مسودات بانتظار النشر"
            value="—"
            hint="محتوى محفوظ ولم يُنشر بعد"
            icon={Upload}
          />
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading" className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              id="quick-actions-heading"
              className="text-lg font-semibold text-foreground"
            >
              إجراءات سريعة
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              المهام الأكثر استخدامًا في تحديث الموقع.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((a) => (
            <QuickActionButton key={a.label} {...a} />
          ))}
        </div>
      </section>

      <section aria-labelledby="modules-heading" className="mb-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2
              id="modules-heading"
              className="text-lg font-semibold text-foreground"
            >
              أقسام الموقع
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              كل قسم يعكس صفحة على الموقع العام. اختر القسم الذي تريد إدارته.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_MODULES.map((m) => (
            <li key={m.id}>
              <ModuleCard module={m} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="feed-heading" className="mb-4">
        <h2 id="feed-heading" className="sr-only">
          آخر النشاط والمسودات
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                آخر النشاط
              </h3>
              <span className="text-xs text-muted-foreground">آخر 7 أيام</span>
            </div>
            <EmptyState
              icon={History}
              title="لا يوجد نشاط بعد"
              description="سيظهر هنا سجل التعديلات والمنشورات فور بدء استخدام لوحة الإدارة."
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                مسودات بانتظار النشر
              </h3>
              <span className="text-xs text-muted-foreground">للمراجعة</span>
            </div>
            <EmptyState
              icon={Clock}
              title="لا توجد مسودات حاليًا"
              description="المسودات المحفوظة تظهر هنا لمراجعتها ونشرها إلى الموقع العام."
            />
          </div>
        </div>
      </section>
    </>
  );
}
