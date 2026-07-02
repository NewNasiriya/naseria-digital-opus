import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { parseGradeLevel } from "@/lib/academic";

export const Route = createFileRoute("/admin/academic/$level")({
  params: {
    parse: (raw: Record<string, string>) => {
      const level = parseGradeLevel(raw.level);
      if (level === null) throw notFound();
      return { level };
    },
    stringify: ({ level }: { level: number }) => ({ level: String(level) }),
  },
  component: () => <Outlet />,
});
