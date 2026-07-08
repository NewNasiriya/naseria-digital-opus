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
      className={cn(
        "sticky top-0 z-40 w-full border-b border-transparent bg-background/80 backdrop-blur-md transition-all duration-300",
        scrolled &&
          "border-border/70 bg-background/95 elevation-sm supports-[backdrop-filter]:bg-background/80"
      )}
    >
      <Container
        size="wide"
        className={cn(
          "flex items-center justify-between gap-4 transition-all duration-300",
          scrolled ? "h-14" : "h-[72px]"
        )}
      >
        {/* Brand */}
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="الصفحة الرئيسية"
        >
          <SchoolLogo
            decorative
            eager
            size={56}
            className={cn(
              "shrink-0 transition-all",
              scrolled ? "h-9 w-9" : "h-11 w-11 sm:h-12 sm:w-12",
            )}
          />

          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={cn(
                "font-bold text-foreground transition-all whitespace-nowrap",
                scrolled ? "text-[13px]" : "text-[15px]"
              )}
            >
              مدرسة الناصرية الابتدائية الجديدة
            </span>
            <span className="hidden text-[10.5px] font-medium tracking-wide text-muted-foreground sm:block whitespace-nowrap">
              New Al-Nasiriya Primary School
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-0.5 xl:gap-1 lg:flex"
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
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] xl:text-sm font-semibold",
                    isGold
                      ? "text-[color:var(--brand-gold)] bg-[color:var(--brand-gold-soft)]"
                      : "text-primary bg-primary-soft",
                  ),
                }}
                inactiveProps={{
                  className: cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] xl:text-sm font-medium transition-colors",
                    isGold
                      ? "text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  ),
                }}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>




        <div className="flex items-center gap-2">
          <SearchTrigger />
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <a href="/auth">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>دخول الإدارة</span>
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
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
        <div className="border-t border-border bg-background lg:hidden">
          <Container size="wide" className="py-3">
            <nav aria-label="التنقل المتنقل" className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}

                  onClick={() => setOpen(false)}
                  activeProps={{
                    className:
                      "rounded-md px-3 py-2.5 text-sm font-semibold text-primary bg-primary-soft",
                  }}
                  inactiveProps={{
                    className:
                      "rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
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
