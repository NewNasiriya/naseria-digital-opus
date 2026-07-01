import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  Award,
  Trophy,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";

interface StatItem {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
}

const ICON_MAP: Record<string, LucideIcon> = {
  students: Users,
  teachers: GraduationCap,
  classrooms: School,
  users: Users,
  graduationcap: GraduationCap,
  school: School,
  book: BookOpen,
  bookopen: BookOpen,
  award: Award,
  trophy: Trophy,
  building: Building2,
};

// Defaults — used only when CMS `statistics` table has no visible rows.
const DEFAULT_STATS: StatItem[] = [
  { key: "students", label: "طالب وطالبة", value: 850, suffix: "+", icon: Users },
  { key: "teachers", label: "معلم ومعلمة", value: 45, suffix: "+", icon: GraduationCap },
  { key: "classrooms", label: "فصلًا دراسيًا", value: 20, icon: School },
];

function resolveIcon(key: string | null, statKey: string): LucideIcon {
  if (key && ICON_MAP[key.toLowerCase()]) return ICON_MAP[key.toLowerCase()];
  if (ICON_MAP[statKey.toLowerCase()]) return ICON_MAP[statKey.toLowerCase()];
  return Award;
}

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, duration]);

  return value;
}

function StatCard({ stat, active }: { stat: StatItem; active: boolean }) {
  const value = useCountUp(stat.value, active);
  const Icon = stat.icon;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {value.toLocaleString("ar-EG")}
            {stat.suffix && (
              <span className="ms-1 text-primary">{stat.suffix}</span>
            )}
          </p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {stat.label}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
        >
          <Icon className="h-6 w-6" />
        </span>
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
    </article>
  );
}

interface StatsProps {
  items?: StatItem[];
}

export function Stats({ items = DEFAULT_STATS }: StatsProps) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <Section id="stats" tone="default" spacing="default">
      <Container size="wide">
        <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((stat) => (
            <StatCard key={stat.key} stat={stat} active={active} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
