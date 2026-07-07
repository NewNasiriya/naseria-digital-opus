import type { LucideIcon } from "lucide-react";
import { Clock, Mail, MapPin, Navigation, Phone, Share2, Info } from "lucide-react";

import {
  DAY_NAMES_AR,
  type ContactInfo,
  type SocialLink,
  type WorkingHour,
  formatWorkingRange,
} from "@/lib/contact";
import { SocialLinksRow } from "@/components/contact/SocialLinks";

import { Button } from "@/components/ui/button";


interface CardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function ContactCard({ icon: Icon, title, children, footer }: CardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
      >
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 flex-1 text-sm leading-loose text-muted-foreground">
        {children}
      </div>
      {footer && <div className="mt-5">{footer}</div>}
    </article>
  );
}

export function LocationCard({ info }: { info: ContactInfo | null }) {
  const parts = [
    info?.address_ar,
    info?.educational_administration_ar,
    info?.governorate_ar,
    info?.country_ar,
  ].filter(Boolean);
  return (
    <ContactCard icon={MapPin} title="عنوان المدرسة">
      {parts.length > 0 ? (
        <p>{parts.join("، ")}</p>
      ) : (
        <p>سيتم إضافة عنوان المدرسة من لوحة إدارة المحتوى.</p>
      )}
      {info?.plus_code && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-surface-muted px-2.5 py-1 font-mono text-xs text-foreground">
          Plus Code: {info.plus_code}
        </p>
      )}
    </ContactCard>
  );
}

export function EmailCard({ info }: { info: ContactInfo | null }) {
  const all = info?.emails ?? [];
  const regular = all.filter((e) => !e.fallback);
  const fallback = all.find((e) => e.fallback);
  return (
    <ContactCard icon={Mail} title="البريد الإلكتروني">
      {regular.length === 0 ? (
        <p>سيتم تحديث بيانات التواصل قريبًا.</p>
      ) : (
        <ul className="space-y-4">
          {regular.map((e) => (
            <li key={e.value} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{e.label}</span>
              <a
                href={`mailto:${e.value}`}
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                dir="ltr"
              >
                {e.value}
              </a>
              {e.description && (
                <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {e.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {fallback && (
        <div className="mt-5 flex gap-2.5 rounded-lg border border-border bg-surface-muted p-3 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p>
              {fallback.description ||
                "في حال تعذر إرسال الرسائل أو تأخر الرد، يُرجى التواصل عبر البريد الإلكتروني الاحتياطي التالي:"}
            </p>
            <a
              href={`mailto:${fallback.value}`}
              className="mt-1 inline-block font-medium text-foreground transition-colors hover:text-primary"
              dir="ltr"
            >
              {fallback.value}
            </a>
          </div>
        </div>
      )}
    </ContactCard>
  );
}

export function SocialCard({ links }: { links: SocialLink[] }) {
  return (
    <ContactCard icon={Share2} title="حسابات التواصل الاجتماعي">
      {links.length === 0 ? (
        <p>سيتم إضافة حسابات المدرسة الرسمية قريبًا.</p>
      ) : (
        <>
          <p>تابع آخر أخبار وأنشطة المدرسة عبر الحسابات الرسمية.</p>
          <SocialLinksRow links={links} className="mt-4" />
        </>
      )}
    </ContactCard>
  );
}


export function PhoneCard({ info }: { info: ContactInfo | null }) {
  const phones = info?.phones ?? [];
  return (
    <ContactCard icon={Phone} title="الهاتف">
      {phones.length === 0 ? (
        <p>سيتم تحديث بيانات التواصل قريبًا.</p>
      ) : (
        <ul className="space-y-3">
          {phones.map((p) => (
            <li key={p.value} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{p.label}</span>
              <a
                href={`tel:${p.value}`}
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                dir="ltr"
              >
                {p.value}
              </a>
            </li>
          ))}
        </ul>
      )}
    </ContactCard>
  );
}

export function WorkingHoursCard({
  hours,
  info,
}: {
  hours: WorkingHour[];
  info: ContactInfo | null;
}) {
  return (
    <ContactCard icon={Clock} title="مواعيد العمل">
      {hours.length === 0 ? (
        <p>سيتم إضافة مواعيد العمل من لوحة الإدارة.</p>
      ) : (
        <ul className="space-y-2.5">
          {hours.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">
                {DAY_NAMES_AR[h.day_of_week] ?? "—"}
              </span>
              <span
                className={
                  h.is_closed
                    ? "font-medium text-muted-foreground"
                    : "font-medium text-foreground"
                }
              >
                {formatWorkingRange(h)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(info?.holiday_notice_ar || info?.special_announcement_ar) && (
        <div className="mt-4 space-y-2 rounded-lg bg-surface-muted p-3 text-xs leading-loose text-foreground">
          {info?.holiday_notice_ar && <p>{info.holiday_notice_ar}</p>}
          {info?.special_announcement_ar && (
            <p className="text-primary">{info.special_announcement_ar}</p>
          )}
        </div>
      )}
    </ContactCard>
  );
}

export function DirectionsCard({ info }: { info: ContactInfo | null }) {
  const link = info?.google_maps_link?.trim();
  return (
    <ContactCard icon={Navigation} title="الوصول إلى المدرسة">
      {info?.directions_ar ? (
        <p>{info.directions_ar}</p>
      ) : (
        <p>افتح الموقع في تطبيق خرائط جوجل للحصول على الاتجاهات التفصيلية.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" disabled={!link}>
          <a
            href={link || "#"}
            target={link ? "_blank" : undefined}
            rel={link ? "noreferrer" : undefined}
            aria-disabled={!link}
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            الاتجاهات
          </a>
        </Button>
      </div>
    </ContactCard>
  );
}

export function FuturePhoneCard() {
  return (
    <ContactCard icon={Phone} title="خط التواصل المباشر">
      <p>سيتم قريبًا تفعيل خط تواصل مباشر مع إدارة المدرسة لخدمة أولياء الأمور.</p>
    </ContactCard>
  );
}
