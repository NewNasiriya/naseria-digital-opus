import { ArrowLeft, CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import schoolDay from "@/assets/school-day.png.asset.json";
import schoolNight from "@/assets/school-night.png.asset.json";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import type { HeroAction } from "@/lib/homepage-hero";
import { useTheme } from "@/lib/theme";

interface HeroProps {
  headline?: string | null;
  intro?: string | null;
  actions?: HeroAction[] | null;
}

const DEFAULT_HEADLINE = "مدرسة الناصرية الابتدائية الجديدة — الموقع الرسمي";
const DEFAULT_INTRO =
  "مؤسسة تعليمية حكومية تجمع بين أصالة القيم وحداثة التعليم، لبناء جيل واعٍ ومتميز يخدم مجتمعه ووطنه.";

const DEFAULT_ACTIONS: HeroAction[] = [
  {
    id: "default-about",
    label_ar: "تعرف على المدرسة",
    href: "/about",
    variant: "primary",
    display_order: 1,
    external: false,
  },
  {
    id: "default-academic",
    label_ar: "الجداول الدراسية",
    href: "/academic",
    variant: "secondary",
    display_order: 2,
    external: false,
  },
];

const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

function isDaytimeNow(): boolean {
  const hour = new Date().getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

function actionPresentation(action: HeroAction) {
  if (action.variant === "primary") {
    return {
      variant: "default" as const,
      className:
        "home-hero-action home-hero-primary-action bg-white px-6 text-primary hover:bg-white/95",
    };
  }
  if (action.variant === "ghost") {
    return {
      variant: "ghost" as const,
      className:
        "home-hero-action px-6 text-white hover:bg-white/15 hover:text-white",
    };
  }
  return {
    variant: "outline" as const,
    className:
      "home-hero-action home-hero-secondary-action px-6 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white",
  };
}

export function Hero({ headline, intro, actions }: HeroProps) {
  const { mode, resolved } = useTheme();
  const displayedActions = actions && actions.length > 0 ? actions : DEFAULT_ACTIONS;

  const [autoDay, setAutoDay] = useState(true);
  useEffect(() => {
    if (mode !== "auto") return;
    setAutoDay(isDaytimeNow());
    const id = window.setInterval(() => setAutoDay(isDaytimeNow()), 60_000);
    return () => window.clearInterval(id);
  }, [mode]);

  const showNight = mode === "auto" ? !autoDay : resolved === "dark";
  const [secondaryReady, setSecondaryReady] = useState(false);

  useEffect(() => {
    if (secondaryReady) return;
    const win = window as IdleWindow;
    const requestIdle = win.requestIdleCallback;
    const cancelIdle = (
      win as unknown as { cancelIdleCallback?: (handle: number) => void }
    ).cancelIdleCallback;
    const id = requestIdle
      ? requestIdle(() => setSecondaryReady(true), { timeout: 2000 })
      : window.setTimeout(() => setSecondaryReady(true), 1200);
    return () => {
      if (typeof requestIdle === "function" && typeof cancelIdle === "function") {
        cancelIdle(id);
      } else {
        window.clearTimeout(id);
      }
    };
  }, [secondaryReady]);

  useEffect(() => {
    if (showNight && !secondaryReady) setSecondaryReady(true);
  }, [showNight, secondaryReady]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="home-hero-luxury relative isolate overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <img
          src={schoolDay.url}
          alt="مبنى مدرسة الناصرية الابتدائية الجديدة في وضح النهار"
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[400ms] ease-in-out motion-reduce:transition-none"
          style={{ opacity: showNight ? 0 : 1 }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {secondaryReady ? (
          <img
            src={schoolNight.url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[400ms] ease-in-out motion-reduce:transition-none"
            style={{ opacity: showNight ? 1 : 0 }}
            loading="eager"
            fetchPriority="low"
            decoding="async"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="home-hero-overlay-primary absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="home-hero-overlay-secondary absolute inset-0"
        />
        <div aria-hidden="true" className="home-hero-texture absolute inset-0" />
      </div>

      <Container
        size="wide"
        className="home-hero-content relative flex min-h-[78vh] flex-col justify-center py-20 text-white sm:min-h-[85vh] sm:py-24"
      >
        <div className="home-hero-editorial w-full">
          <div className="home-hero-copy max-w-3xl">
            <div className="home-hero-kicker-row flex items-center justify-start gap-3">
              <span className="home-hero-kicker-rule" aria-hidden="true" />
              <p className="home-hero-kicker inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="home-hero-kicker-dot h-1.5 w-1.5 rounded-full"
                />
                الموقع الرسمي للمدرسة
              </p>
            </div>

            <h1
              id="hero-heading"
              className="home-hero-title mt-6 text-white [text-wrap:balance]"
              style={{ fontSize: "clamp(2.25rem, 1.4rem + 3.2vw, 3.75rem)" }}
            >
              {headline?.trim() || DEFAULT_HEADLINE}
            </h1>

            <p className="home-hero-subtitle mt-3 text-base font-medium tracking-wide sm:text-lg">
              New Al-Nasiriyah Primary School
            </p>

            <p className="home-hero-intro mt-6 max-w-2xl text-base leading-loose sm:text-lg">
              {intro?.trim() || DEFAULT_INTRO}
            </p>

            <div className="home-hero-actions mt-9 flex flex-wrap items-center justify-start gap-3">
              {displayedActions.map((action) => {
                const presentation = actionPresentation(action);
                const isAcademic = action.href.startsWith("/academic");
                return (
                  <Button
                    key={action.id}
                    asChild
                    size="lg"
                    variant={presentation.variant}
                    className={presentation.className}
                  >
                    <a
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                    >
                      {isAcademic && (
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      )}
                      {action.label_ar}
                      {!isAcademic && (
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      )}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <a
          href="#stats"
          aria-label="التمرير للأسفل"
          className="home-hero-scroll absolute inset-x-0 bottom-6 mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white/90 hover:bg-white/10"
        >
          <ChevronDown
            className="h-5 w-5 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </a>
      </Container>
    </section>
  );
}
