export const DEFAULT_HOMEPAGE_INTRO =
  "مؤسسة تعليمية حكومية تجمع بين أصالة القيم وحداثة التعليم، لبناء جيل واعٍ ومتميز يخدم مجتمعه ووطنه.";

export function resolveHeroIntro(intro?: string | null): string {
  return intro?.trim() || DEFAULT_HOMEPAGE_INTRO;
}
