/**
 * Admin · Homepage Hero (Module A4).
 *
 * Bespoke editor for the single-row `homepage_hero` table (smallint id)
 * and its `homepage_hero_actions` children. Uses the shared admin shell,
 * permission gate, and design system — no framework recreation. The
 * repository EntityEditor is UUID-centric, so this dedicated route keeps
 * the public site's hero fully manageable without forcing a schema
 * change.
 *
 * Frontend parity:
 *   - Only `subheadline_ar` is currently piped into the public Hero
 *     component (as its `intro` prop). Headline and CTAs are kept in the
 *     CMS for future wiring; changing them here does not alter the
 *     public homepage today.
 *   - Editing the intro persists to CMS and is picked up on next page
 *     load. Empty values fall back to the built-in default string.
 */
import { useEffect, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/cms/ui/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/homepage")({
  head: () => ({
    meta: [
      { title: "الصفحة الرئيسية · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HomepageAdmin,
});

interface HeroRow {
  id: number;
  headline_ar: string | null;
  subheadline_ar: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  updated_at: string;
}

interface ActionRow {
  id: string;
  hero_id: number;
  label_ar: string;
  href: string;
  variant: string;
  display_order: number;
  is_visible: boolean;
}

async function fetchHero(): Promise<HeroRow | null> {
  const { data, error } = await supabase
    .from("homepage_hero")
    .select("id,headline_ar,subheadline_ar,status,published_at,updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data as HeroRow | null) ?? null;
}

async function fetchActions(): Promise<ActionRow[]> {
  const { data, error } = await supabase
    .from("homepage_hero_actions")
    .select("id,hero_id,label_ar,href,variant,display_order,is_visible")
    .eq("hero_id", 1)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ActionRow[];
}

function HomepageAdmin() {
  const { can, loading } = useAuth();
  if (loading) return null;
  if (!can("homepage.manage")) {
    throw notFound();
  }
  return (
    <>
      <AdminSectionHeader
        eyebrow="إدارة القسم"
        title="إدارة الصفحة الرئيسية"
        description="الشريط الترحيبي وأزرار الدعوة للعمل. الصور الحالية تبقى كقيمة افتراضية."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الصفحة الرئيسية" },
        ]}
        publicHref="/"
      />
      <HeroEditor />
      <ActionsEditor />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero text editor                                                           */
/* -------------------------------------------------------------------------- */

function HeroEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "hero"], queryFn: fetchHero });
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");

  useEffect(() => {
    if (data) {
      setHeadline(data.headline_ar ?? "");
      setSub(data.subheadline_ar ?? "");
    }
  }, [data?.headline_ar, data?.subheadline_ar]);

  const save = useMutation({
    mutationFn: async (next: { status?: HeroRow["status"] }) => {
      const patch: Partial<HeroRow> = {
        headline_ar: headline.trim() || null,
        subheadline_ar: sub.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (next.status) {
        patch.status = next.status;
        if (next.status === "published") patch.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("homepage_hero").update(patch).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "hero"] });
      await qc.invalidateQueries({ queryKey: ["homepage-hero"] });
      toast.success("تم الحفظ");
    },
    onError: (e) => toast.error((e as Error).message || "تعذّر الحفظ"),
  });

  if (isLoading || !data) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-surface-muted" />;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">المحتوى النصي للشريط الترحيبي</h2>
        <StatusBadge status={data.status} />
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="headline">العنوان الرئيسي (عربي)</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            dir="rtl"
            maxLength={200}
            placeholder="مدرسة الناصرية الابتدائية الجديدة — الموقع الرسمي"
          />
          <p className="text-xs text-muted-foreground">
            محفوظ في قاعدة البيانات. لا يظهر حاليًا في الواجهة العامة (سيُوصَّل في موجة لاحقة).
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sub">النص التعريفي (يظهر في الواجهة)</Label>
          <Textarea
            id="sub"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            dir="rtl"
            rows={3}
            maxLength={400}
          />
          <p className="text-xs text-muted-foreground">
            هذا النص يظهر فورًا أسفل العنوان في الصفحة الرئيسية. اتركه فارغًا لاستخدام النص الافتراضي.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => save.mutate({ status: "draft" })}
          disabled={save.isPending}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ كمسوّدة
        </Button>
        <Button
          size="sm"
          onClick={() => save.mutate({ status: "published" })}
          disabled={save.isPending}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ ونشر
        </Button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero action buttons editor                                                 */
/* -------------------------------------------------------------------------- */

function ActionsEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "hero-actions"], queryFn: fetchActions });

  const create = useMutation({
    mutationFn: async () => {
      const nextOrder = ((data ?? []).at(-1)?.display_order ?? 0) + 1;
      const { error } = await supabase.from("homepage_hero_actions").insert({
        hero_id: 1,
        label_ar: "زر جديد",
        href: "/",
        variant: "secondary",
        display_order: nextOrder,
        is_visible: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hero-actions"] });
      toast.success("تمت الإضافة");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">أزرار الدعوة للعمل</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            محفوظة في قاعدة البيانات. الأزرار الحالية في الواجهة العامة لا تزال ثابتة وستُوصَّل في موجة لاحقة.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="h-4 w-4" /> إضافة زر
        </Button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-md bg-surface-muted" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={Shield}
          title="لا توجد أزرار حتى الآن"
          description="أضف زرًا لعرضه ضمن الشريط الترحيبي مستقبلًا."
        />
      ) : (
        <ul className="grid gap-3">
          {(data ?? []).map((row) => (
            <ActionRowEditor key={row.id} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionRowEditor({ row }: { row: ActionRow }) {
  const qc = useQueryClient();
  const [state, setState] = useState<ActionRow>(row);
  useEffect(() => setState(row), [row.id]);

  const dirty =
    state.label_ar !== row.label_ar ||
    state.href !== row.href ||
    state.variant !== row.variant ||
    state.display_order !== row.display_order ||
    state.is_visible !== row.is_visible;

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("homepage_hero_actions")
        .update({
          label_ar: state.label_ar,
          href: state.href,
          variant: state.variant,
          display_order: state.display_order,
          is_visible: state.is_visible,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hero-actions"] });
      toast.success("تم الحفظ");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("homepage_hero_actions").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hero-actions"] });
      toast.success("تم الحذف");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <li className="rounded-lg border border-border bg-background p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_100px_auto] md:items-end">
        <div className="grid gap-1.5">
          <Label className="text-xs">النص</Label>
          <Input
            dir="rtl"
            value={state.label_ar}
            onChange={(e) => setState({ ...state, label_ar: e.target.value })}
            maxLength={100}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">الرابط</Label>
          <Input
            dir="ltr"
            value={state.href}
            onChange={(e) => setState({ ...state, href: e.target.value })}
            maxLength={500}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">النمط</Label>
          <Select value={state.variant} onValueChange={(v) => setState({ ...state, variant: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">أساسي</SelectItem>
              <SelectItem value="secondary">ثانوي</SelectItem>
              <SelectItem value="ghost">شفاف</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">الترتيب</Label>
          <Input
            type="number"
            min={0}
            max={99}
            value={state.display_order}
            onChange={(e) => setState({ ...state, display_order: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Switch
            checked={state.is_visible}
            onCheckedChange={(v) => setState({ ...state, is_visible: v })}
            aria-label="ظاهر"
          />
          {state.is_visible ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
        >
          <Trash2 className="h-4 w-4" /> حذف
        </Button>
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={!dirty || save.isPending}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
        </Button>
      </div>
    </li>
  );
}
