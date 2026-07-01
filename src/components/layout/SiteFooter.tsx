import { Container } from "@/components/layout/Container";

const QUICK_LINKS = [
  { label: "الرئيسية", href: "/" },
  { label: "عن المدرسة", href: "#about" },
  { label: "الأخبار", href: "#news" },
  { label: "الأنشطة", href: "#activities" },
  { label: "لوحة الشرف", href: "#honor" },
];

const ACADEMIC_LINKS = [
  { label: "الجدول الدراسي", href: "#academic" },
  { label: "جداول الامتحانات", href: "#academic" },
  { label: "التقويم الأكاديمي", href: "#academic" },
  { label: "إرشادات الطلاب", href: "#academic" },
  { label: "إرشادات أولياء الأمور", href: "#academic" },
];

const WORKING_HOURS = [
  { day: "الأحد – الخميس", hours: "7:30 ص – 2:30 م" },
  { day: "الجمعة", hours: "مغلق" },
  { day: "السبت", hours: "مغلق" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-muted" id="contact">
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground font-bold"
              >
                ن
              </span>
              <div className="leading-tight">
                <p className="font-bold text-foreground">
                  مدرسة الناصرية الابتدائية الجديدة
                </p>
                <p className="text-xs text-muted-foreground">
                  New Al-Nasiriyah Primary School
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-loose text-muted-foreground">
              مؤسسة تعليمية حكومية تسعى إلى تقديم تعليم متميز يبني شخصية الطالب
              ويعزز انتماءه لوطنه.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="روابط سريعة">
            <h3 className="text-sm font-semibold text-foreground">
              روابط سريعة
            </h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
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
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
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
              {WORKING_HOURS.map((w) => (
                <li
                  key={w.day}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{w.day}</span>
                  <span className="font-medium text-foreground">{w.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {year} مدرسة الناصرية الابتدائية الجديدة. جميع الحقوق محفوظة.
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
