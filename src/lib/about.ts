import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";
import type { PrincipalMessage } from "@/components/about/PrincipalWelcome";
import type { SchoolOverviewData } from "@/components/about/SchoolOverview";

export interface AboutContent {
  overview: SchoolOverviewData;
  principal: PrincipalMessage;
  mission: string | null;
  vision: string | null;
  welcome_message: string | null;
}

interface RawSchoolInfo {
  school_name_ar: string | null;
  school_name_en: string | null;
  educational_administration_ar: string | null;
  school_type_ar: string | null;
  educational_level_ar: string | null;
  working_hours_summary_ar: string | null;
  principal_name: string | null;
  principal_position_ar: string | null;
  principal_message_ar: string | null;
  mission_ar: string | null;
  vision_ar: string | null;
  welcome_message_ar: string | null;
  principal_photo: MediaRef | null;
}

const SELECT =
  "school_name_ar,school_name_en,educational_administration_ar,school_type_ar,educational_level_ar,working_hours_summary_ar,principal_name,principal_position_ar,principal_message_ar,mission_ar,vision_ar,welcome_message_ar,principal_photo:principal_photo_media_id(bucket,storage_path,alt_ar,alt_en)";

export async function fetchAboutContent(): Promise<AboutContent | null> {
  const { data, error } = await supabase
    .from("school_info")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as RawSchoolInfo;
  return {
    overview: {
      name_ar: row.school_name_ar,
      name_en: row.school_name_en,
      administration: row.educational_administration_ar,
      type: row.school_type_ar,
      stage: row.educational_level_ar,
      working_hours: row.working_hours_summary_ar,
    },
    principal: {
      message: row.principal_message_ar,
      name: row.principal_name,
      position: row.principal_position_ar,
      portrait_url: mediaPublicUrl(row.principal_photo),
    },
    mission: row.mission_ar,
    vision: row.vision_ar,
    welcome_message: row.welcome_message_ar,
  };
}
