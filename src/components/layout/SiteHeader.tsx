import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LogIn, CalendarDays } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/brand/SchoolLogo";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; accent?: "gold"; icon?: typeof CalendarDays };

const NAV: NavItem[] = [
  { label: "عن المدرسة", to: "/about" },
  { label: "الجداول", to: "/academic", accent: "gold", icon: CalendarDays },
  { label: "الأخبار", to: "/news" },
  { label: "الإنجازات", to: "/achievements" },
  { label: "لوحة الشرف", to: "/honor" },
  { label: "الأنشطة", to: "/activities" },
  { label: "المعرض", to: "/gallery" },
  { label: "تواصل معنا", to: "/contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="site-header-luxury sticky top-0 z-40 isolate w-full border-b"
    >
      <Container
        size="wide"
        className="flex h-[72px] items-center justify-between gap-3 sm:gap-4"
      >
        {/* Brand */}
        <Link
          to="/"
          className="site-brand-luxury group flex min-w-0 items-center gap-3 py-1 outline-none focus-visible:shadow-[var(--luxury-focus)]"
          aria-label="الصفحة الرئيسية"
        >
          <SchoolLogo
            decorative
            eager
            size={56}
            className="site-logo-luxury h-11 w-11 shrink-0 sm:h-12 sm:w-12"
          />

          <span className="flex min-w-0 flex-col leading-tight">
            <span className="whitespace-nowrap text-[14px] font-bold leading-relaxed text-foreground sm:text-[15px]">
              مدرسة الناصرية الابتدائية الجديدة
            </span>
            <span className="hidden whitespace-nowrap text-[10.5px] font-medium leading-relaxed tracking-wide text-muted-foreground sm:block">
              New Al-Nasiriya Primary School
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-0.5 lg:flex xl:gap-1"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const isGold = item.accent === "gold";
            return (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: true }}
                activeProps={{
                  className: cn(
                    "site-nav-link-luxury site-nav-link-active inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-semibold xl:text-sm",
                    isGold
                      ? "site-nav-link-gold bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold)]"
                      : "bg-primary-soft text-primary",
                  ),
                }}
                inactiveProps={{
                  className: cn(
                    "site-nav-link-luxury inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium xl:text-sm",
                    isGold
                      ? "site-nav-link-gold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]"
                      : "text-muted-foreground hover:text-accent-foreground",
                  ),
                }}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SearchTrigger />
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="site-admin-button-luxury hidden md:inline-flex"
          >
            <a href="/auth">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>دخول الإدارة</span>
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="min-h-10 min-w-10 lg:hidden"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </Container>

      {/* Mobile nav */}
      {open && (
        <div className="site-mobile-luxury border-t lg:hidden">
          <Container size="wide" className="py-4">
            <nav aria-label="التنقل المتنقل" className="flex flex-col gap-1.5">
              {NAV.map((item) => {
                const Icon = item.icon;
                const isGold = item.accent === "gold";
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeProps={{
                      className: cn(
                        "site-nav-link-luxury site-nav-link-active inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold",
                        isGold
                          ? "site-nav-link-gold bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-gold)]"
                          : "bg-primary-soft text-primary",
                      ),
                    }}
                    inactiveProps={{
                      className: cn(
                        "site-nav-link-luxury inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                        isGold
                          ? "site-nav-link-gold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]"
                          : "text-foreground hover:text-accent-foreground",
                      ),
                    }}
                  >
                    {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <a
                href="/auth"
                onClick={() => setOpen(false)}
                className="site-nav-link-luxury site-admin-button-luxury mt-2 inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium text-foreground"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                دخول الإدارة
              </a>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
