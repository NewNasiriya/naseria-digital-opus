export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_calendar_events: {
        Row: {
          academic_year_id: string | null
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          ends_on: string | null
          id: string
          starts_on: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          ends_on?: string | null
          id?: string
          starts_on: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          ends_on?: string | null
          id?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_calendar_events_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_notes: {
        Row: {
          attachment_media_id: string | null
          body_ar: string | null
          created_at: string
          created_by: string | null
          display_order: number
          grade_id: string
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attachment_media_id?: string | null
          body_ar?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          grade_id: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attachment_media_id?: string | null
          body_ar?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          grade_id?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_notes_attachment_media_id_fkey"
            columns: ["attachment_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_notes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_resources: {
        Row: {
          created_at: string
          created_by: string | null
          description_ar: string | null
          display_order: number
          grade_id: string
          id: string
          media_id: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          display_order?: number
          grade_id: string
          id?: string
          media_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          display_order?: number
          grade_id?: string
          id?: string
          media_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_resources_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_resources_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_timeline_events: {
        Row: {
          academic_year_id: string | null
          countdown_enabled: boolean
          created_at: string
          created_by: string | null
          cta_href: string | null
          cta_text_ar: string | null
          description_ar: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["academic_event_type"]
          headline_ar: string
          icon: string | null
          id: string
          priority: number
          show_on_homepage: boolean
          show_popup: boolean
          sort_order: number
          starts_at: string
          status: Database["public"]["Enums"]["content_status"]
          subtitle_ar: string | null
          theme: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id?: string | null
          countdown_enabled?: boolean
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_text_ar?: string | null
          description_ar?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["academic_event_type"]
          headline_ar: string
          icon?: string | null
          id?: string
          priority?: number
          show_on_homepage?: boolean
          show_popup?: boolean
          sort_order?: number
          starts_at: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          theme?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string | null
          countdown_enabled?: boolean
          created_at?: string
          created_by?: string | null
          cta_href?: string | null
          cta_text_ar?: string | null
          description_ar?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["academic_event_type"]
          headline_ar?: string
          icon?: string | null
          id?: string
          priority?: number
          show_on_homepage?: boolean
          show_popup?: boolean
          sort_order?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle_ar?: string | null
          theme?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_timeline_events_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          name: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          name: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          name?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      achievement_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string
          name_en: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar: string
          name_en?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      achievement_media: {
        Row: {
          achievement_id: string
          alt_ar: string | null
          alt_en: string | null
          caption_ar: string | null
          caption_en: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          media_id: string | null
        }
        Insert: {
          achievement_id: string
          alt_ar?: string | null
          alt_en?: string | null
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          media_id?: string | null
        }
        Update: {
          achievement_id?: string
          alt_ar?: string | null
          alt_en?: string | null
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          media_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievement_media_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          academic_year_id: string | null
          achieved_on: string | null
          category_id: string | null
          cover_image_media_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          external_ref: Json | null
          id: string
          is_featured: boolean
          is_pinned: boolean
          og_image_id: string | null
          published_at: string | null
          search_tsv: unknown
          seo_description: string | null
          seo_title: string | null
          show_on_about_timeline: boolean
          show_on_homepage: boolean
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
          view_count: number
        }
        Insert: {
          academic_year_id?: string | null
          achieved_on?: string | null
          category_id?: string | null
          cover_image_media_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          external_ref?: Json | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          og_image_id?: string | null
          published_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          show_on_about_timeline?: boolean
          show_on_homepage?: boolean
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Update: {
          academic_year_id?: string | null
          achieved_on?: string | null
          category_id?: string | null
          cover_image_media_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          external_ref?: Json | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          og_image_id?: string | null
          published_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          show_on_about_timeline?: boolean
          show_on_homepage?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "achievement_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_cover_image_media_id_fkey"
            columns: ["cover_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_og_image_id_fkey"
            columns: ["og_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          body_ar: string | null
          body_en: string | null
          category_id: string | null
          cover_image_media_id: string | null
          created_at: string
          created_by: string | null
          event_date: string | null
          external_ref: Json | null
          id: string
          is_featured: boolean
          og_image_id: string | null
          published_at: string | null
          scheduled_at: string | null
          search_tsv: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary_ar: string | null
          summary_en: string | null
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
          view_count: number
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          category_id?: string | null
          cover_image_media_id?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          external_ref?: Json | null
          id?: string
          is_featured?: boolean
          og_image_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          category_id?: string | null
          cover_image_media_id?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          external_ref?: Json | null
          id?: string
          is_featured?: boolean
          og_image_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_cover_image_media_id_fkey"
            columns: ["cover_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_og_image_id_fkey"
            columns: ["og_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          created_at: string
          display_order: number
          icon_key: string | null
          id: string
          key: string
          name_ar: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          key: string
          name_ar: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          key?: string
          name_ar?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_media: {
        Row: {
          activity_id: string
          caption_ar: string | null
          caption_en: string | null
          created_at: string
          display_order: number
          id: string
          media_id: string
        }
        Insert: {
          activity_id: string
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id: string
        }
        Update: {
          activity_id?: string
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_media_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_content_views: {
        Row: {
          created_at: string
          day: string
          entity_id: string
          entity_table: string
          id: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          day?: string
          entity_id: string
          entity_table: string
          id?: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          day?: string
          entity_id?: string
          entity_table?: string
          id?: string
          slug?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          created_at: string
          day: string
          device: string | null
          id: string
          path: string
          referrer_domain: string | null
        }
        Insert: {
          created_at?: string
          day?: string
          device?: string | null
          id?: string
          path: string
          referrer_domain?: string | null
        }
        Update: {
          created_at?: string
          day?: string
          device?: string | null
          id?: string
          path?: string
          referrer_domain?: string | null
        }
        Relationships: []
      }
      analytics_search_queries: {
        Row: {
          created_at: string
          day: string
          id: string
          normalized_term: string
          result_count: number
          term: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          normalized_term: string
          result_count?: number
          term: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          normalized_term?: string
          result_count?: number
          term?: string
        }
        Relationships: []
      }
      attendance_info: {
        Row: {
          content_ar: string | null
          content_en: string | null
          created_at: string
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_table: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_table: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_table?: string
          id?: string
        }
        Relationships: []
      }
      behaviour_guidelines: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          created_by: string | null
          display_order: number
          icon_key: string | null
          id: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          icon_key?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          icon_key?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address_ar: string | null
          address_en: string | null
          country_ar: string | null
          created_at: string
          directions_ar: string | null
          directions_en: string | null
          educational_administration_ar: string | null
          email: string | null
          emails: Json
          google_maps_embed_url: string | null
          google_maps_lat: number | null
          google_maps_link: string | null
          google_maps_lng: number | null
          governorate_ar: string | null
          holiday_notice_ar: string | null
          id: number
          phone_primary: string | null
          phone_secondary: string | null
          phones: Json
          plus_code: string | null
          special_announcement_ar: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          country_ar?: string | null
          created_at?: string
          directions_ar?: string | null
          directions_en?: string | null
          educational_administration_ar?: string | null
          email?: string | null
          emails?: Json
          google_maps_embed_url?: string | null
          google_maps_lat?: number | null
          google_maps_link?: string | null
          google_maps_lng?: number | null
          governorate_ar?: string | null
          holiday_notice_ar?: string | null
          id?: number
          phone_primary?: string | null
          phone_secondary?: string | null
          phones?: Json
          plus_code?: string | null
          special_announcement_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          country_ar?: string | null
          created_at?: string
          directions_ar?: string | null
          directions_en?: string | null
          educational_administration_ar?: string | null
          email?: string | null
          emails?: Json
          google_maps_embed_url?: string | null
          google_maps_lat?: number | null
          google_maps_link?: string | null
          google_maps_lng?: number | null
          governorate_ar?: string | null
          holiday_notice_ar?: string | null
          id?: number
          phone_primary?: string | null
          phone_secondary?: string | null
          phones?: Json
          plus_code?: string | null
          special_announcement_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_table: string
          id: string
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_table: string
          id?: string
          snapshot: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_table?: string
          id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer_ar: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          question_ar: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer_ar?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          question_ar: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer_ar?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          question_ar?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_albums: {
        Row: {
          category: string | null
          cover_media_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          cover_media_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          cover_media_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_albums_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          album_id: string
          caption_ar: string | null
          caption_en: string | null
          created_at: string
          display_order: number
          id: string
          media_id: string
        }
        Insert: {
          album_id: string
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id: string
        }
        Update: {
          album_id?: string
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "gallery_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          display_order: number
          id: string
          level: number
          name_ar: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          level: number
          name_ar: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          level?: number
          name_ar?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_hero: {
        Row: {
          created_at: string
          headline_ar: string | null
          headline_en: string | null
          hero_image_media_id: string | null
          id: number
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          subheadline_ar: string | null
          subheadline_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          headline_ar?: string | null
          headline_en?: string | null
          hero_image_media_id?: string | null
          id?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subheadline_ar?: string | null
          subheadline_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          headline_ar?: string | null
          headline_en?: string | null
          hero_image_media_id?: string | null
          id?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subheadline_ar?: string | null
          subheadline_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_hero_hero_image_media_id_fkey"
            columns: ["hero_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_hero_actions: {
        Row: {
          created_at: string
          display_order: number
          hero_id: number
          href: string
          id: string
          is_visible: boolean
          label_ar: string
          label_en: string | null
          updated_at: string
          variant: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          hero_id: number
          href: string
          id?: string
          is_visible?: boolean
          label_ar: string
          label_en?: string | null
          updated_at?: string
          variant?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          hero_id?: number
          href?: string
          id?: string
          is_visible?: boolean
          label_ar?: string
          label_en?: string | null
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_hero_actions_hero_id_fkey"
            columns: ["hero_id"]
            isOneToOne: false
            referencedRelation: "homepage_hero"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_enabled: boolean
          key: string
          label_ar: string | null
          label_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          key: string
          label_ar?: string | null
          label_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          key?: string
          label_ar?: string | null
          label_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      honor_boards: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          display_order: number
          grade_id: string
          id: string
          image_url: string | null
          media_id: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          display_order?: number
          grade_id: string
          id?: string
          image_url?: string | null
          media_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          display_order?: number
          grade_id?: string
          id?: string
          image_url?: string | null
          media_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honor_boards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_boards_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_boards_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      honor_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string
          name_en: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar: string
          name_en?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      honor_entries: {
        Row: {
          academic_year_id: string | null
          achievement_date: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number
          grade_id: string | null
          id: string
          status: Database["public"]["Enums"]["content_status"]
          student_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id?: string | null
          achievement_date?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          grade_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          student_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string | null
          achievement_date?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          grade_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          student_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honor_entries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "honor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_entries_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      honor_entry_media: {
        Row: {
          created_at: string
          display_order: number
          honor_entry_id: string
          id: string
          media_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          honor_entry_id: string
          id?: string
          media_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          honor_entry_id?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "honor_entry_media_honor_entry_id_fkey"
            columns: ["honor_entry_id"]
            isOneToOne: false
            referencedRelation: "honor_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_entry_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_items: {
        Row: {
          body_ar: string
          body_en: string | null
          created_at: string
          display_order: number
          icon_key: string | null
          id: string
          list_id: string
          updated_at: string
        }
        Insert: {
          body_ar: string
          body_en?: string | null
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          list_id: string
          updated_at?: string
        }
        Update: {
          body_ar?: string
          body_en?: string | null
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          list_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "instruction_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_lists: {
        Row: {
          audience: Database["public"]["Enums"]["instruction_audience"]
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number
          id: string
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience: Database["public"]["Enums"]["instruction_audience"]
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["instruction_audience"]
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_ar: string | null
          alt_en: string | null
          bucket: string
          caption_ar: string | null
          caption_en: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          external_ref: Json | null
          file_name: string
          height: number | null
          id: string
          is_archived: boolean
          mime_type: string
          size_bytes: number | null
          storage_path: string
          tags: string[]
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_ar?: string | null
          alt_en?: string | null
          bucket?: string
          caption_ar?: string | null
          caption_en?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_ref?: Json | null
          file_name: string
          height?: number | null
          id?: string
          is_archived?: boolean
          mime_type: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[]
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string | null
          bucket?: string
          caption_ar?: string | null
          caption_en?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_ref?: Json | null
          file_name?: string
          height?: number | null
          id?: string
          is_archived?: boolean
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[]
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string
          name_en: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar: string
          name_en?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_usages: {
        Row: {
          created_at: string
          entity_id: string
          entity_table: string
          field_name: string
          id: string
          media_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_table: string
          field_name: string
          id?: string
          media_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_table?: string
          field_name?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_usages_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          body_ar: string | null
          body_en: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          external_ref: Json | null
          featured_image_media_id: string | null
          id: string
          is_featured: boolean
          is_pinned: boolean
          og_image_id: string | null
          published_at: string | null
          reading_minutes: number | null
          scheduled_at: string | null
          search_tsv: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary_ar: string | null
          summary_en: string | null
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
          view_count: number
        }
        Insert: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_ref?: Json | null
          featured_image_media_id?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          og_image_id?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          external_ref?: Json | null
          featured_image_media_id?: string | null
          id?: string
          is_featured?: boolean
          is_pinned?: boolean
          og_image_id?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          scheduled_at?: string | null
          search_tsv?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          summary_en?: string | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_featured_image_media_id_fkey"
            columns: ["featured_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_og_image_id_fkey"
            columns: ["og_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string
          name_en: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar: string
          name_en?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_media: {
        Row: {
          caption_ar: string | null
          caption_en: string | null
          created_at: string
          display_order: number
          id: string
          media_id: string
          news_id: string
        }
        Insert: {
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id: string
          news_id: string
        }
        Update: {
          caption_ar?: string | null
          caption_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_media_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_outbox: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          error: string | null
          id: string
          payload: Json
          scheduled_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          payload: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_media_id: string | null
          created_at: string
          full_name: string | null
          id: string
          last_login_at: string | null
          locale: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_media_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          last_login_at?: string | null
          locale?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_media_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_media_fk"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      school_info: {
        Row: {
          created_at: string
          history_ar: string | null
          history_en: string | null
          id: number
          mission_ar: string | null
          mission_en: string | null
          principal_message_ar: string | null
          principal_message_en: string | null
          principal_name: string | null
          principal_photo_media_id: string | null
          updated_at: string
          updated_by: string | null
          vision_ar: string | null
          vision_en: string | null
          welcome_message_ar: string | null
          welcome_message_en: string | null
        }
        Insert: {
          created_at?: string
          history_ar?: string | null
          history_en?: string | null
          id?: number
          mission_ar?: string | null
          mission_en?: string | null
          principal_message_ar?: string | null
          principal_message_en?: string | null
          principal_name?: string | null
          principal_photo_media_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vision_ar?: string | null
          vision_en?: string | null
          welcome_message_ar?: string | null
          welcome_message_en?: string | null
        }
        Update: {
          created_at?: string
          history_ar?: string | null
          history_en?: string | null
          id?: number
          mission_ar?: string | null
          mission_en?: string | null
          principal_message_ar?: string | null
          principal_message_en?: string | null
          principal_name?: string | null
          principal_photo_media_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vision_ar?: string | null
          vision_en?: string | null
          welcome_message_ar?: string | null
          welcome_message_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_info_principal_photo_media_id_fkey"
            columns: ["principal_photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      school_policies: {
        Row: {
          attachments: Json
          category_ar: string | null
          content_ar: string | null
          created_at: string
          created_by: string | null
          display_order: number
          effective_date: string | null
          id: string
          status: Database["public"]["Enums"]["content_status"]
          summary_ar: string | null
          title_ar: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          attachments?: Json
          category_ar?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          effective_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          title_ar: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          attachments?: Json
          category_ar?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          effective_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary_ar?: string | null
          title_ar?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          copyright_text: string | null
          created_at: string
          default_og_image_id: string | null
          favicon_media_id: string | null
          footer_text_ar: string | null
          footer_text_en: string | null
          id: number
          logo_media_id: string | null
          school_name_ar: string
          school_name_en: string | null
          seo_default_description: string | null
          seo_default_title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          copyright_text?: string | null
          created_at?: string
          default_og_image_id?: string | null
          favicon_media_id?: string | null
          footer_text_ar?: string | null
          footer_text_en?: string | null
          id?: number
          logo_media_id?: string | null
          school_name_ar?: string
          school_name_en?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          copyright_text?: string | null
          created_at?: string
          default_og_image_id?: string | null
          favicon_media_id?: string | null
          footer_text_ar?: string | null
          footer_text_en?: string | null
          id?: number
          logo_media_id?: string | null
          school_name_ar?: string
          school_name_en?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_default_og_image_id_fkey"
            columns: ["default_og_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_favicon_media_id_fkey"
            columns: ["favicon_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          display_order: number
          icon_key: string | null
          id: string
          is_visible: boolean
          label: string | null
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_visible?: boolean
          label?: string | null
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_visible?: boolean
          label?: string | null
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      statistics: {
        Row: {
          created_at: string
          display_order: number
          icon_key: string | null
          id: string
          is_visible: boolean
          key: string
          label_ar: string
          label_en: string | null
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_visible?: boolean
          key: string
          label_ar: string
          label_en?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_visible?: boolean
          key?: string
          label_ar?: string
          label_en?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      timetables: {
        Row: {
          academic_year_id: string | null
          cover_image_media_id: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number
          document_media_id: string | null
          grade_id: string | null
          id: string
          kind: Database["public"]["Enums"]["timetable_kind"]
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id?: string | null
          cover_image_media_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          document_media_id?: string | null
          grade_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["timetable_kind"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string | null
          cover_image_media_id?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number
          document_media_id?: string | null
          grade_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["timetable_kind"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_cover_image_media_id_fkey"
            columns: ["cover_image_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_document_media_id_fkey"
            columns: ["document_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          display_order: number
          id: string
          is_closed: boolean
          note_ar: string | null
          note_en: string | null
          opens_at: string | null
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: number
          display_order?: number
          id?: string
          is_closed?: boolean
          note_ar?: string | null
          note_en?: string | null
          opens_at?: string | null
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          display_order?: number
          id?: string
          is_closed?: boolean
          note_ar?: string | null
          note_en?: string | null
          opens_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      academic_event_type:
        | "year_start"
        | "semester_1"
        | "exams_1"
        | "mid_year_break"
        | "semester_2"
        | "exams_2"
        | "year_end"
        | "summer_break"
        | "custom"
      app_role:
        | "admin"
        | "editor"
        | "viewer"
        | "super_admin"
        | "principal"
        | "vice_principal"
        | "media_coordinator"
        | "academic_coordinator"
      content_status: "draft" | "published" | "archived"
      instruction_audience: "student" | "parent"
      timetable_kind: "academic" | "exam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academic_event_type: [
        "year_start",
        "semester_1",
        "exams_1",
        "mid_year_break",
        "semester_2",
        "exams_2",
        "year_end",
        "summer_break",
        "custom",
      ],
      app_role: [
        "admin",
        "editor",
        "viewer",
        "super_admin",
        "principal",
        "vice_principal",
        "media_coordinator",
        "academic_coordinator",
      ],
      content_status: ["draft", "published", "archived"],
      instruction_audience: ["student", "parent"],
      timetable_kind: ["academic", "exam"],
    },
  },
} as const
