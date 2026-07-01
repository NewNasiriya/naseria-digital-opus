export interface GradeMeta {
  level: number;
  name_ar: string;
  name_en: string;
  short_ar: string;
  accent: string; // tailwind color class stub, used sparingly for tone
}

export const GRADES: GradeMeta[] = [
  { level: 1, name_ar: "الصف الأول الابتدائي", name_en: "Grade 1", short_ar: "الأول", accent: "from-sky-500/10 to-transparent" },
  { level: 2, name_ar: "الصف الثاني الابتدائي", name_en: "Grade 2", short_ar: "الثاني", accent: "from-emerald-500/10 to-transparent" },
  { level: 3, name_ar: "الصف الثالث الابتدائي", name_en: "Grade 3", short_ar: "الثالث", accent: "from-amber-500/10 to-transparent" },
  { level: 4, name_ar: "الصف الرابع الابتدائي", name_en: "Grade 4", short_ar: "الرابع", accent: "from-violet-500/10 to-transparent" },
  { level: 5, name_ar: "الصف الخامس الابتدائي", name_en: "Grade 5", short_ar: "الخامس", accent: "from-rose-500/10 to-transparent" },
  { level: 6, name_ar: "الصف السادس الابتدائي", name_en: "Grade 6", short_ar: "السادس", accent: "from-indigo-500/10 to-transparent" },
];

export function getGrade(level: number): GradeMeta | undefined {
  return GRADES.find((g) => g.level === level);
}

export function parseGradeLevel(raw: string | number | undefined): number | null {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1 || n > 6) return null;
  return n;
}
