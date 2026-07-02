import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import schoolDay from "@/assets/school-day.png.asset.json";
import schoolNight from "@/assets/school-night.png.asset.json";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

interface HeroProps {
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

export function Hero({ intro }: HeroProps) {
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
    const schedule = w.requestIdleCallback
      ? (cb: () => void) => w.requestIdleCallback!(cb, { timeout: 2000 })
      : (cb: () => void) => window.setTimeout(cb, 1200);
    const id = schedule(() => setSecondaryReady(true));
    return () => {
      if (w.requestIdleCallback && "cancelIdleCallback" in w) {
        (w as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };
  }, [secondaryReady]);

  // If the user flips to the not-yet-loaded image before idle fires, mount it now.
  useEffect(() => {
    if (showNight && !secondaryReady) setSecondaryReady(true);
  }, [showNight, secondaryReady]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden"
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
        {/* Readability overlays — subtle, keeps warm tones */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/70"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-l from-slate-950/60 via-transparent to-slate-950/20"
        />
      </div>

      <Container
        size="wide"
        className="relative flex min-h-[78vh] flex-col justify-center py-24 text-white sm:min-h-[85vh]"
      >
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-white"
            />
            الموقع الرسمي للمدرسة
          </p>

          <h1
            id="hero-heading"
            className="mt-6 text-white [text-wrap:balance] drop-shadow-sm"
            style={{ fontSize: "clamp(2.25rem, 1.4rem + 3.2vw, 3.75rem)" }}
          >
            مدرسة الناصرية الابتدائية الجديدة
          </h1>

          <p className="mt-3 text-base font-medium tracking-wide text-white/85 sm:text-lg">
            New Al-Nasiriyah Primary School
          </p>

          <p className="mt-6 max-w-2xl text-base leading-loose text-white/90 sm:text-lg">
            {intro?.trim() || DEFAULT_INTRO}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
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
              className="border-white/40 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
            >
              <Link to="/academic">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                الجداول الدراسية
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#stats"
          aria-label="التمرير للأسفل"
          className="absolute inset-x-0 bottom-6 mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/40 text-white/90 transition-colors hover:bg-white/10"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
        </a>
      </Container>
    </section>
  );
}
