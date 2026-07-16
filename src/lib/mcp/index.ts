import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listAchievements from "./tools/list-achievements";
import listGalleryAlbums from "./tools/list-gallery-albums";
import listNews from "./tools/list-news";

// The OAuth issuer MUST be the direct Supabase host. Read the project ref via
// `import.meta.env.VITE_SUPABASE_PROJECT_ID`, which Vite inlines as a literal
// at build time. The fallback keeps the issuer well-formed during the
// throwaway manifest-extract eval; the published build inlines the real ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nasiriyah-school-mcp",
  title: "مدرسة الناصرية الابتدائية الجديدة",
  version: "0.1.0",
  instructions:
    "أدوات للوصول إلى المحتوى المنشور لموقع مدرسة الناصرية الابتدائية الجديدة: الأخبار، الإنجازات، وألبومات الصور. جميع النتائج مقيّدة بالمحتوى المُعتمَد للنشر.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listNews, listAchievements, listGalleryAlbums],
});
