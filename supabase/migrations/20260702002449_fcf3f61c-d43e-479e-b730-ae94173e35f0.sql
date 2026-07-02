
-- Page views ---------------------------------------------------------------
CREATE TABLE public.analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer_domain text,
  device text,
  created_at timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date
);
CREATE INDEX analytics_page_views_day_idx ON public.analytics_page_views (day DESC);
CREATE INDEX analytics_page_views_path_idx ON public.analytics_page_views (path);
GRANT INSERT ON public.analytics_page_views TO anon, authenticated;
GRANT SELECT ON public.analytics_page_views TO authenticated;
GRANT ALL ON public.analytics_page_views TO service_role;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a page view"
  ON public.analytics_page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Staff can read page views"
  ON public.analytics_page_views FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Content views ------------------------------------------------------------
CREATE TABLE public.analytics_content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date
);
CREATE INDEX analytics_content_views_entity_idx
  ON public.analytics_content_views (entity_table, entity_id);
CREATE INDEX analytics_content_views_day_idx
  ON public.analytics_content_views (day DESC);
GRANT INSERT ON public.analytics_content_views TO anon, authenticated;
GRANT SELECT ON public.analytics_content_views TO authenticated;
GRANT ALL ON public.analytics_content_views TO service_role;
ALTER TABLE public.analytics_content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a content view"
  ON public.analytics_content_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Staff can read content views"
  ON public.analytics_content_views FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Search queries -----------------------------------------------------------
CREATE TABLE public.analytics_search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  normalized_term text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date
);
CREATE INDEX analytics_search_queries_day_idx
  ON public.analytics_search_queries (day DESC);
CREATE INDEX analytics_search_queries_norm_idx
  ON public.analytics_search_queries (normalized_term);
GRANT INSERT ON public.analytics_search_queries TO anon, authenticated;
GRANT SELECT ON public.analytics_search_queries TO authenticated;
GRANT ALL ON public.analytics_search_queries TO service_role;
ALTER TABLE public.analytics_search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a search"
  ON public.analytics_search_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Staff can read search queries"
  ON public.analytics_search_queries FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));
