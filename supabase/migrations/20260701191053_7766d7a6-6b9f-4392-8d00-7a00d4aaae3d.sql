
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reading_minutes integer;

CREATE INDEX IF NOT EXISTS idx_news_pinned ON public.news (is_pinned, published_at DESC) WHERE is_pinned = true;
