import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Production domain — used to emit absolute <loc> URLs per the sitemap spec.
const BASE_URL = "https://naseria-digital-opus.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/news", changefreq: "daily", priority: "0.9" },
  { path: "/achievements", changefreq: "weekly", priority: "0.8" },
  { path: "/activities", changefreq: "weekly", priority: "0.7" },
  { path: "/honor", changefreq: "weekly", priority: "0.7" },
  { path: "/gallery", changefreq: "weekly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/academic", changefreq: "weekly", priority: "0.8" },
  { path: "/academic/calendar", changefreq: "monthly", priority: "0.7" },
  { path: "/academic/student-guidelines", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/parent-guidelines", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/attendance", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/attendance-behaviour", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/behaviour", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/policies", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/academic/admission-guide", changefreq: "yearly", priority: "0.7" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        // Include published news + achievements dynamically.
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const supabase = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const [news, achievements] = await Promise.all([
              supabase.from("news").select("slug").eq("status", "published"),
              supabase.from("achievements").select("slug").eq("status", "published"),
            ]);
            for (const row of news.data ?? []) {
              if (row.slug) entries.push({ path: `/news/${row.slug}`, changefreq: "monthly", priority: "0.6" });
            }
            for (const row of achievements.data ?? []) {
              if (row.slug) entries.push({ path: `/achievements/${row.slug}`, changefreq: "monthly", priority: "0.6" });
            }
          }
        } catch {
          // Fall back to static entries on any transient error.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
