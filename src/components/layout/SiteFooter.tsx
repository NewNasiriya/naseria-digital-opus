import { Link } from "@tanstack/react-router";

import { Container } from "@/components/layout/Container";
import {
  DAY_NAMES_AR,
  formatWorkingRange,
  primaryEmail,
  useContactInfo,
  useSiteSettings,
  useWorkingHours,
} from "@/lib/contact";

type FooterLink = { label: string; to: string };

const BROWSE_LINKS: FooterLink[] = [
  { label: "الرئيسية", to: "/" },
  { label: "عن المدرسة", to: "/about" },
  { label: "الإنجازات", to: "/achievements" },
  { label: "لوحة الشرف", to: "/honor" },
  { label: "الأنشطة", to: "/activities" },
  { label: "الأخبار", to: "/news" },
  { label: "تواصل معنا", to: "/contact" },
];

const ACADEMIC_LINKS: FooterLink[] = [
  { label: "الحياة الأكاديمية", to: "/academic" },
  { label: "التقويم الأكاديمي", to: "/academic/calendar" },
  { label: "إرشادات الطلاب", to: "/academic/student-guidelines" },
  { label: "إرشادات أولياء الأمور", to: "/academic/parent-guidelines" },
  { label: "الحضور والسلوك", to: "/academic/attendance-behaviour" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { data: settings } = useSiteSettings();
  const { data: info } = useContactInfo();
  const { data: hours = [] } = useWorkingHours();
  const email = primaryEmail(info);
  const schoolAr = settings?.school_name_ar ?? "مدرسة الناصرية الابتدائية الجديدة";
  const schoolEn = settings?.school_name_en ?? "New Al-Nasiriyah Primary School";


  return (
    <footer className="border-t border-border bg-surface-muted">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="الصفحة الرئيسية"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground font-bold"
              >
                ن
              </span>
              <div className="leading-tight">
                <p className="font-bold text-foreground">{schoolAr}</p>
                <p className="text-xs text-muted-foreground">{schoolEn}</p>

              </div>
            </Link>
            <p className="mt-5 text-sm leading-loose text-muted-foreground">
              مؤسسة تعليمية حكومية تسعى إلى تقديم تعليم متميز يبني شخصية الطالب
              ويعزز انتماءه لوطنه.
            </p>
          </div>

          {/* Browse */}
          <nav aria-label="روابط الموقع">
            <h3 className="text-sm font-semibold text-foreground">
              تصفح الموقع
            </h3>
            <ul className="mt-4 space-y-2.5">
              {BROWSE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Academic */}
          <nav aria-label="الحياة الأكاديمية">
            <h3 className="text-sm font-semibold text-foreground">
              الحياة الأكاديمية
            </h3>
            <ul className="mt-4 space-y-2.5">
              {ACADEMIC_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Working hours */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              مواعيد العمل
            </h3>
            <ul className="mt-4 space-y-2.5">
              {(hours.length > 0
                ? hours
                : []
              ).map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">
                    {DAY_NAMES_AR[h.day_of_week] ?? "—"}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatWorkingRange(h)}
                  </span>
                </li>
              ))}
              {hours.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  سيتم تحديث المواعيد قريبًا.
                </li>
              )}
            </ul>
            {email && (
              <a
                href={`mailto:${email}`}
                className="mt-4 block text-sm text-muted-foreground transition-colors hover:text-primary"
                dir="ltr"
              >
                {email}
              </a>
            )}

            <Link
              to="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              معلومات التواصل الكاملة
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {year} {schoolAr}. جميع الحقوق محفوظة.
          </p>

          <a
            href="/auth"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            دخول الإدارة
          </a>
        </div>
      </Container>
    </footer>
  );
}
