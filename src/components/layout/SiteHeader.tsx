import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LogIn } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/brand/SchoolLogo";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string };

const NAV: NavItem[] = [
  { label: "عن المدرسة", to: "/about" },
  { label: "الحياة الأكاديمية", to: "/academic" },
  { label: "الإنجازات", to: "/achievements" },
  { label: "لوحة الشرف", to: "/honor" },
  { label: "الأنشطة", to: "/activities" },
  { label: "الأخبار", to: "/news" },
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
          "flex items-center justify-between gap-6 transition-all duration-300",
          scrolled ? "h-14" : "h-20"
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
              scrolled ? "h-10 w-10" : "h-12 w-12 sm:h-14 sm:w-14",
            )}
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={cn(
                "truncate font-bold text-foreground transition-all",
                scrolled ? "text-sm" : "text-base"
              )}
            >
              مدرسة الناصرية الابتدائية الجديدة
            </span>
            <span className="hidden text-[11px] font-medium tracking-wide text-muted-foreground sm:block">
              New Al-Nasiriyah Primary School
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className:
                  "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-primary-soft",
              }}
              inactiveProps={{
                className:
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
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
                  key={item.to}
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
