import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  DAY_NAMES_AR,
  useContactInfo,
  useWorkingHours,
  type EmailEntry,
  type PhoneEntry,
  type WorkingHour,
} from "@/lib/contact";

export const Route = createFileRoute("/admin/contact")({
  head: () => ({
    meta: [
      { title: "إدارة معلومات التواصل · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminContactPage,
});

interface FormState {
  address_ar: string;
  educational_administration_ar: string;
  governorate_ar: string;
  country_ar: string;
  plus_code: string;
  directions_ar: string;
  google_maps_embed_url: string;
  google_maps_link: string;
  holiday_notice_ar: string;
  special_announcement_ar: string;
  emails: EmailEntry[];
  phones: PhoneEntry[];
}

function emptyForm(): FormState {
  return {
    address_ar: "",
    educational_administration_ar: "",
    governorate_ar: "",
    country_ar: "",
    plus_code: "",
    directions_ar: "",
    google_maps_embed_url: "",
    google_maps_link: "",
    holiday_notice_ar: "",
    special_announcement_ar: "",
    emails: [],
    phones: [],
  };
}

function AdminContactPage() {
  const { data: info, isLoading } = useContactInfo();
  const { data: hours = [], isLoading: hoursLoading } = useWorkingHours();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [hoursForm, setHoursForm] = useState<WorkingHour[]>([]);

  useEffect(() => {
    if (info) {
      setForm({
        address_ar: info.address_ar ?? "",
        educational_administration_ar: info.educational_administration_ar ?? "",
        governorate_ar: info.governorate_ar ?? "",
        country_ar: info.country_ar ?? "",
        plus_code: info.plus_code ?? "",
        directions_ar: info.directions_ar ?? "",
        google_maps_embed_url: info.google_maps_embed_url ?? "",
        google_maps_link: info.google_maps_link ?? "",
        holiday_notice_ar: info.holiday_notice_ar ?? "",
        special_announcement_ar: info.special_announcement_ar ?? "",
        emails: info.emails ?? [],
        phones: info.phones ?? [],
      });
    }
  }, [info]);

  useEffect(() => {
    if (hours.length > 0) setHoursForm(hours);
  }, [hours]);

  const saveContact = useMutation({
    mutationFn: async () => {
      const primaryE = form.emails.find((e) => e.primary)?.value ?? form.emails[0]?.value ?? null;
      const { error } = await supabase
        .from("contact_info")
        .update({
          address_ar: form.address_ar || null,
          educational_administration_ar: form.educational_administration_ar || null,
          governorate_ar: form.governorate_ar || null,
          country_ar: form.country_ar || null,
          plus_code: form.plus_code || null,
          directions_ar: form.directions_ar || null,
          google_maps_embed_url: form.google_maps_embed_url || null,
          google_maps_link: form.google_maps_link || null,
          holiday_notice_ar: form.holiday_notice_ar || null,
          special_announcement_ar: form.special_announcement_ar || null,
          email: primaryE,
          emails: form.emails as never,
          phones: form.phones as never,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ معلومات التواصل");
      qc.invalidateQueries({ queryKey: ["contact-info"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveHours = useMutation({
    mutationFn: async () => {
      for (const h of hoursForm) {
        const { error } = await supabase
          .from("working_hours")
          .update({
            opens_at: h.is_closed ? null : h.opens_at,
            closes_at: h.is_closed ? null : h.closes_at,
            is_closed: h.is_closed,
            note_ar: h.note_ar,
          })
          .eq("id", h.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ مواعيد العمل");
      qc.invalidateQueries({ queryKey: ["working-hours"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminSectionHeader
        eyebrow="إدارة القسم"
        title="إدارة معلومات التواصل"
        description="حرّر العنوان، الخريطة، البريد، الهواتف، ومواعيد العمل. تظهر التغييرات فور الحفظ في الموقع العام."
        crumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "التواصل" }]}
        publicHref="/contact"
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
            <h2 className="text-lg font-semibold text-foreground">العنوان والموقع</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="العنوان بالعربية" full>
                <Textarea
                  rows={2}
                  value={form.address_ar}
                  onChange={(e) => setForm({ ...form, address_ar: e.target.value })}
                />
              </Field>
              <Field label="الإدارة التعليمية">
                <Input
                  value={form.educational_administration_ar}
                  onChange={(e) =>
                    setForm({ ...form, educational_administration_ar: e.target.value })
                  }
                />
              </Field>
              <Field label="المحافظة">
                <Input
                  value={form.governorate_ar}
                  onChange={(e) => setForm({ ...form, governorate_ar: e.target.value })}
                />
              </Field>
              <Field label="الدولة">
                <Input
                  value={form.country_ar}
                  onChange={(e) => setForm({ ...form, country_ar: e.target.value })}
                />
              </Field>
              <Field label="Plus Code">
                <Input
                  value={form.plus_code}
                  onChange={(e) => setForm({ ...form, plus_code: e.target.value })}
                />
              </Field>
              <Field label="رابط خرائط جوجل" full>
                <Input
                  dir="ltr"
                  value={form.google_maps_link}
                  onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </Field>
              <Field label="رابط تضمين الخريطة (iframe src)" full>
                <Input
                  dir="ltr"
                  value={form.google_maps_embed_url}
                  onChange={(e) =>
                    setForm({ ...form, google_maps_embed_url: e.target.value })
                  }
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </Field>
              <Field label="اتجاهات الوصول" full>
                <Textarea
                  rows={2}
                  value={form.directions_ar}
                  onChange={(e) => setForm({ ...form, directions_ar: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">البريد الإلكتروني</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    emails: [
                      ...form.emails,
                      { label: "بريد إضافي", value: "", primary: form.emails.length === 0 },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" /> إضافة بريد
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {form.emails.length === 0 && (
                <p className="text-sm text-muted-foreground">لا يوجد بريد مضاف بعد.</p>
              )}
              {form.emails.map((e, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
                  <Input
                    placeholder="الوصف"
                    value={e.label}
                    onChange={(ev) => {
                      const next = [...form.emails];
                      next[idx] = { ...e, label: ev.target.value };
                      setForm({ ...form, emails: next });
                    }}
                  />
                  <Input
                    dir="ltr"
                    placeholder="email@example.com"
                    value={e.value}
                    onChange={(ev) => {
                      const next = [...form.emails];
                      next[idx] = { ...e, value: ev.target.value };
                      setForm({ ...form, emails: next });
                    }}
                  />
                  <Button
                    size="sm"
                    variant={e.primary ? "default" : "outline"}
                    onClick={() => {
                      const next = form.emails.map((x, i) => ({
                        ...x,
                        primary: i === idx,
                      }));
                      setForm({ ...form, emails: next });
                    }}
                  >
                    {e.primary ? "الأساسي" : "تعيين كأساسي"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        ...form,
                        emails: form.emails.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">أرقام الهاتف</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    phones: [...form.phones, { label: "هاتف", value: "" }],
                  })
                }
              >
                <Plus className="h-4 w-4" /> إضافة رقم
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {form.phones.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا يوجد رقم مضاف. ستظهر رسالة "سيتم تحديث بيانات التواصل قريبًا" في الموقع.
                </p>
              )}
              {form.phones.map((p, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <Input
                    placeholder="الوصف"
                    value={p.label}
                    onChange={(ev) => {
                      const next = [...form.phones];
                      next[idx] = { ...p, label: ev.target.value };
                      setForm({ ...form, phones: next });
                    }}
                  />
                  <Input
                    dir="ltr"
                    placeholder="+20…"
                    value={p.value}
                    onChange={(ev) => {
                      const next = [...form.phones];
                      next[idx] = { ...p, value: ev.target.value };
                      setForm({ ...form, phones: next });
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        ...form,
                        phones: form.phones.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
            <h2 className="text-lg font-semibold text-foreground">إشعارات وإعلانات</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="إشعار الإجازات" full>
                <Textarea
                  rows={2}
                  value={form.holiday_notice_ar}
                  onChange={(e) => setForm({ ...form, holiday_notice_ar: e.target.value })}
                />
              </Field>
              <Field label="إعلانات خاصة" full>
                <Textarea
                  rows={2}
                  value={form.special_announcement_ar}
                  onChange={(e) =>
                    setForm({ ...form, special_announcement_ar: e.target.value })
                  }
                />
              </Field>
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              onClick={() => saveContact.mutate()}
              disabled={saveContact.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveContact.isPending ? "جارٍ الحفظ…" : "حفظ معلومات التواصل"}
            </Button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 elevation-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">مواعيد العمل الأسبوعية</h2>
              <Button
                onClick={() => saveHours.mutate()}
                disabled={saveHours.isPending || hoursLoading}
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                حفظ المواعيد
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {hoursForm.map((h) => (
                <div
                  key={h.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[120px_1fr_1fr_auto_1.2fr]"
                >
                  <div className="flex items-center font-medium text-foreground">
                    {DAY_NAMES_AR[h.day_of_week] ?? "—"}
                  </div>
                  <Input
                    type="time"
                    dir="ltr"
                    value={h.opens_at ?? ""}
                    disabled={h.is_closed}
                    onChange={(e) =>
                      setHoursForm(
                        hoursForm.map((x) =>
                          x.id === h.id ? { ...x, opens_at: e.target.value || null } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="time"
                    dir="ltr"
                    value={h.closes_at ?? ""}
                    disabled={h.is_closed}
                    onChange={(e) =>
                      setHoursForm(
                        hoursForm.map((x) =>
                          x.id === h.id ? { ...x, closes_at: e.target.value || null } : x,
                        ),
                      )
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={h.is_closed}
                      onChange={(e) =>
                        setHoursForm(
                          hoursForm.map((x) =>
                            x.id === h.id ? { ...x, is_closed: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    مغلق
                  </label>
                  <Input
                    placeholder="ملاحظة (اختياري)"
                    value={h.note_ar ?? ""}
                    onChange={(e) =>
                      setHoursForm(
                        hoursForm.map((x) =>
                          x.id === h.id ? { ...x, note_ar: e.target.value || null } : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}
