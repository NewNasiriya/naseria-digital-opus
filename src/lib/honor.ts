import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl } from "@/lib/media";

export interface HonorBoardRecord {
  id: string;
  grade_level: number;
  grade_name_ar: string;
  academic_year: string;
  academic_year_id: string;
  title_ar: string | null;
  description_ar: string | null;
  image_url: string;
  display_order: number;
  published_at: string | null;
}

/**
 * Resolve final image URL: prefer Media Library, fall back to direct image_url.
 */
function resolveImage(
  media: { bucket: string | null; storage_path: string | null } | null,
  imageUrl: string | null,
): string | null {
  const fromMedia = media ? mediaPublicUrl(media) : null;
  if (fromMedia) return fromMedia;
  if (!imageUrl) return null;
  // Normalize legacy Lovable CDN paths so images work on custom domains too.
  return mediaPublicUrl({ bucket: "external", storage_path: imageUrl });
}

export async function fetchPublishedHonorBoards(
  academicYearId?: string,
): Promise<HonorBoardRecord[]> {
  let q = supabase
    .from("honor_boards")
    .select(
      `id, title_ar, description_ar, image_url, display_order, published_at, academic_year_id,
       grades!inner(level, name_ar),
       academic_years!inner(name),
       media(bucket, storage_path)`,
    )
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (academicYearId) q = q.eq("academic_year_id", academicYearId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? [])
    .map((row: any) => {
      const image = resolveImage(row.media, row.image_url);
      if (!image) return null;
      return {
        id: row.id,
        grade_level: row.grades.level,
        grade_name_ar: row.grades.name_ar,
        academic_year: row.academic_years.name,
        academic_year_id: row.academic_year_id,
        title_ar: row.title_ar,
        description_ar: row.description_ar,
        image_url: image,
        display_order: row.display_order,
        published_at: row.published_at,
      } as HonorBoardRecord;
    })
    .filter((x: HonorBoardRecord | null): x is HonorBoardRecord => x !== null);
}

export async function fetchHonorBoardByGrade(
  level: number,
): Promise<HonorBoardRecord | null> {
  const { data, error } = await supabase
    .from("honor_boards")
    .select(
      `id, title_ar, description_ar, image_url, display_order, published_at, academic_year_id,
       grades!inner(level, name_ar),
       academic_years!inner(name, is_current),
       media(bucket, storage_path)`,
    )
    .eq("status", "published")
    .eq("grades.level", level)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row: any = data;
  const image = resolveImage(row.media, row.image_url);
  if (!image) return null;

  return {
    id: row.id,
    grade_level: row.grades.level,
    grade_name_ar: row.grades.name_ar,
    academic_year: row.academic_years.name,
    academic_year_id: row.academic_year_id,
    title_ar: row.title_ar,
    description_ar: row.description_ar,
    image_url: image,
    display_order: row.display_order,
    published_at: row.published_at,
  };
}
