import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_EVENT_ICON,
  EVENT_TYPE_LABEL_AR,
  formatArabicDate,
  type AcademicEventType,
  type TimelineEvent,
  type TimelineTheme,
} from "@/lib/timeline";

export const Route = createFileRoute("/admin/timeline")({
  head: () => ({
    meta: [
      { title: "التقويم الأكاديمي الذكي · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTimelinePage,
});

const EVENT_TYPES: AcademicEventType[] = [
  "year_start",
  "semester_1",
  "exams_1",
  "mid_year_break",
  "semester_2",
  "exams_2",
  "year_end",
  "summer_break",
  "custom",
];

const THEMES: { value: TimelineTheme; label: string }[] = [
  { value: "primary", label: "أزرق أساسي" },
  { value: "success", label: "أخضر (جارٍ)" },
  { value: "emerald", label: "أخضر ناعم (إجازة)" },
  { value: "warning", label: "برتقالي (تنبيه)" },
  { value: "danger", label: "أحمر (عاجل)" },
];

type FormState = {
  id?: string;
  event_type: AcademicEventType;
  headline_ar: string;
  subtitle_ar: string;
  description_ar: string;
  icon: string;
  theme: TimelineTheme;
  cta_text_ar: string;
  cta_href: string;
  starts_at: string; // datetime-local
  ends_at: string;
  countdown_enabled: boolean;
  show_on_homepage: boolean;
  show_popup: boolean;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

function emptyForm(): FormState {
  return {
    event_type: "custom",
    headline_ar: "",
    subtitle_ar: "",
    description_ar: "",
    icon: "",
    theme: "primary",
    cta_text_ar: "",
    cta_href: "",
    starts_at: "",
    ends_at: "",
    countdown_enabled: true,
    show_on_homepage: true,
    show_popup: false,
    sort_order: 0,
    status: "published",
  };
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

function toForm(e: TimelineEvent): FormState {
  return {
    id: e.id,
    event_type: e.event_type,
    headline_ar: e.headline_ar,
    subtitle_ar: e.subtitle_ar ?? "",
    description_ar: e.description_ar ?? "",
    icon: e.icon ?? "",
    theme: (e.theme as TimelineTheme) ?? "primary",
    cta_text_ar: e.cta_text_ar ?? "",
    cta_href: e.cta_href ?? "",
    starts_at: toLocalInput(e.starts_at),
    ends_at: toLocalInput(e.ends_at),
    countdown_enabled: e.countdown_enabled,
    show_on_homepage: e.show_on_homepage,
    show_popup: e.show_popup,
    sort_order: e.sort_order,
    status: e.status,
  };
}

async function fetchAll(): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("academic_timeline_events" as never)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TimelineEvent[];
}

function AdminTimelinePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "timeline", "events"],
    queryFn: fetchAll,
  });
  const [form, setForm] = useState<FormState | null>(null);

  const upsert = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        event_type: f.event_type,
        headline_ar: f.headline_ar.trim(),
        subtitle_ar: f.subtitle_ar.trim() || null,
        description_ar: f.description_ar.trim() || null,
        icon: f.icon.trim() || null,
        theme: f.theme,
        cta_text_ar: f.cta_text_ar.trim() || null,
        cta_href: f.cta_href.trim() || null,
        starts_at: fromLocalInput(f.starts_at),
        ends_at: fromLocalInput(f.ends_at),
        countdown_enabled: f.countdown_enabled,
        show_on_homepage: f.show_on_homepage,
        show_popup: f.show_popup,
        sort_order: f.sort_order,
        status: f.status,
      };
      if (!payload.starts_at) throw new Error("تاريخ البداية مطلوب");
      if (!payload.headline_ar) throw new Error("العنوان مطلوب");

      if (f.id) {
        const { error } = await supabase
          .from("academic_timeline_events" as never)
          .update(payload as never)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("academic_timeline_events" as never)
          .insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم الحفظ بنجاح");
      qc.invalidateQueries({ queryKey: ["admin", "timeline", "events"] });
      qc.invalidateQueries({ queryKey: ["academic", "timeline", "events"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message || "تعذر الحفظ"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("academic_timeline_events" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin", "timeline", "events"] });
      qc.invalidateQueries({ queryKey: ["academic", "timeline", "events"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذر الحذف"),
  });

  const events = useMemo(() => data ?? [], [data]);

  return (
    <>
      <AdminSectionHeader
        eyebrow="التقويم الأكاديمي الذكي"
        title="إدارة الفعاليات الأكاديمية"
        description="تحكم كامل في فعاليات العام الدراسي: البداية، الفصول، الامتحانات، الإجازات، والفعاليات المخصصة — تظهر تلقائيًا في الصفحة الرئيسية وفي صفحة التقويم."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "التقويم الذكي" },
        ]}
        publicHref="/academic/calendar"
        action={
          <Button size="sm" className="gap-2" onClick={() => setForm(emptyForm())}>
            <Plus className="h-4 w-4" />
            إضافة فعالية
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="لا توجد فعاليات بعد"
              description="أضف أول فعالية أكاديمية لتبدأ في الظهور على الموقع تلقائيًا."
              action={
                <Button size="sm" onClick={() => setForm(emptyForm())}>
                  <Plus className="h-4 w-4" /> إضافة فعالية
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => {
                const icon = e.icon || DEFAULT_EVENT_ICON[e.event_type];
                return (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-4 p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span aria-hidden="true" className="text-2xl leading-none">
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {EVENT_TYPE_LABEL_AR[e.event_type]}
                          {e.status !== "published" && (
                            <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-[10px]">
                              {e.status === "draft" ? "مسودة" : "مؤرشف"}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {e.headline_ar}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatArabicDate(e.starts_at)}
                          {e.ends_at && (
                            <>
                              <span aria-hidden="true"> — </span>
                              {formatArabicDate(e.ends_at)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="تحرير"
                        onClick={() => setForm(toForm(e))}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="حذف"
                        onClick={() => {
                          if (confirm(`حذف "${e.headline_ar}"؟`)) del.mutate(e.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {form && (
          <TimelineEditor
            form={form}
            onChange={setForm}
            onCancel={() => setForm(null)}
            onSave={() => upsert.mutate(form)}
            saving={upsert.isPending}
          />
        )}
      </div>
    </>
  );
}

function TimelineEditor({
  form,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    onChange({ ...form, [k]: v });

  return (
    <form
      className="sticky top-24 h-fit space-y-4 rounded-2xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      aria-labelledby="timeline-editor-heading"
    >
      <div className="flex items-center justify-between">
        <h2 id="timeline-editor-heading" className="text-base font-semibold">
          {form.id ? "تحرير فعالية" : "فعالية جديدة"}
        </h2>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="ev-type">نوع الفعالية</Label>
          <Select value={form.event_type} onValueChange={(v) => set("event_type", v as AcademicEventType)}>
            <SelectTrigger id="ev-type" className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{EVENT_TYPE_LABEL_AR[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="ev-headline">العنوان</Label>
          <Input
            id="ev-headline"
            value={form.headline_ar}
            onChange={(e) => set("headline_ar", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="ev-sub">العنوان الفرعي</Label>
          <Input
            id="ev-sub"
            value={form.subtitle_ar}
            onChange={(e) => set("subtitle_ar", e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="ev-desc">الوصف</Label>
          <Textarea
            id="ev-desc"
            value={form.description_ar}
            onChange={(e) => set("description_ar", e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="ev-icon">الأيقونة (رمز)</Label>
          <Input
            id="ev-icon"
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder={DEFAULT_EVENT_ICON[form.event_type]}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="ev-theme">اللون</Label>
          <Select value={form.theme} onValueChange={(v) => set("theme", v as TimelineTheme)}>
            <SelectTrigger id="ev-theme" className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ev-start">تاريخ البداية</Label>
          <Input
            id="ev-start"
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ev-end">تاريخ النهاية</Label>
          <Input
            id="ev-end"
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="ev-cta">نص الزر</Label>
          <Input
            id="ev-cta"
            value={form.cta_text_ar}
            onChange={(e) => set("cta_text_ar", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ev-cta-href">رابط الزر</Label>
          <Input
            id="ev-cta-href"
            value={form.cta_href}
            onChange={(e) => set("cta_href", e.target.value)}
            placeholder="/news"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="ev-sort">الترتيب</Label>
          <Input
            id="ev-sort"
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ev-status">الحالة</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
            <SelectTrigger id="ev-status" className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">منشور</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="ev-cd" className="cursor-pointer">تفعيل العدّاد التنازلي</Label>
          <Switch id="ev-cd" checked={form.countdown_enabled} onCheckedChange={(v) => set("countdown_enabled", v)} />
        </div>
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="ev-home" className="cursor-pointer">إظهار على الصفحة الرئيسية</Label>
          <Switch id="ev-home" checked={form.show_on_homepage} onCheckedChange={(v) => set("show_on_homepage", v)} />
        </div>
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="ev-pop" className="cursor-pointer">إظهار كإشعار منبثق (مستقبلي)</Label>
          <Switch id="ev-pop" checked={form.show_popup} onCheckedChange={(v) => set("show_popup", v)} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ…" : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
