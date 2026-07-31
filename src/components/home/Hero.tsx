import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import schoolDay from "@/assets/school-day.png.asset.json";
import schoolNight from "@/assets/school-night.png.asset.json";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

interface HeroProps {
  headline?: string | null;
  intro?: string | null;
}

const DEFAULT_INTRO =
  "مؤسسة تعليمية حكومية تجمع بين أصالة القيم وحداثة التعليم، لبناء جيل واعٍ ومتميز يخدم مجتمعه ووطنه.";

// Approximate sunrise/sunset — good enough for a cinematic day/night flip.
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

function isDaytimeNow(): boolean {
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR;
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export function Hero({ headline, intro }: HeroProps) {
  const { mode, resolved } = useTheme();

  // Auto mode → time-based; explicit modes → theme-based.
  const [autoDay, setAutoDay] = useState<boolean>(true);
  useEffect(() => {
    if (mode !== "auto") return;
    setAutoDay(isDaytimeNow());
    const id = window.setInterval(() => setAutoDay(isDaytimeNow()), 60_000);
    return () => window.clearInterval(id);
  }, [mode]);

  const showNight = mode === "auto" ? !autoDay : resolved === "dark";

  // Defer mounting the secondary image until the browser is idle so it does
  // not compete with the LCP hero image download. Once mounted it stays
  // loaded, giving instant future crossfades with zero extra network work.
  const [secondaryReady, setSecondaryReady] = useState(false);
  useEffect(() => {
    if (secondaryReady) return;
    const w = window as IdleWindow;
    const ric = w.requestIdleCallback;
    const cic = (w as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    const id = ric
      ? ric(() => setSecondaryReady(true), { timeout: 2000 })
      : window.setTimeout(() => setSecondaryReady(true), 1200);
    return () => {
      if (typeof ric === "function" && typeof cic === "function") cic(id);
      else window.clearTimeout(id);
    };
  }, [secondaryReady]);

  // If the user flips to the not-yet-loaded image before idle fires, mount it now.
  useEffect(() => {
    if (showNight && !secondaryReady) setSecondaryReady(true);
  }, [showNight, secondaryReady]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="home-hero-luxury relative isolate overflow-hidden"
    >
      {/* Background — both images mounted, crossfaded via opacity */}
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
              {headline?.trim() || "مدرسة الناصرية الابتدائية الجديدة"}
            </h1>

            <p className="home-hero-subtitle mt-3 text-base font-medium tracking-wide sm:text-lg">
              New Al-Nasiriyah Primary School
            </p>

            <p className="home-hero-intro mt-6 max-w-2xl text-base leading-loose sm:text-lg">
              {intro?.trim() || DEFAULT_INTRO}
            </p>

            <div className="home-hero-actions mt-9 flex flex-wrap items-center justify-start gap-3">
              <Button
                asChild
                size="lg"
                className="home-hero-action home-hero-primary-action bg-white px-6 text-primary hover:bg-white/95"
              >
                <Link to="/about">
                  تعرف على المدرسة
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="home-hero-action home-hero-secondary-action px-6 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
              >
                <Link to="/academic">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  الجداول الدراسية
                </Link>
              </Button>
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
