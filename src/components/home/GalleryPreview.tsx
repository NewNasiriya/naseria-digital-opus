import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon, Images } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import {
  albumCoverUrl,
  categoryLabel,
  fetchLatestAlbums,
} from "@/lib/gallery";

export function GalleryPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "gallery-preview"],
    queryFn: () => fetchLatestAlbums(3),
    staleTime: 60_000,
  });

  // Auto-hide when there is nothing to show
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <Section id="gallery-preview" tone="muted" spacing="default">
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              أرشيف المدرسة
            </p>
            <h2 className="mt-3 rule-accent inline-block">معرض الصور</h2>
          </div>
          <Button asChild variant="ghost" className="text-primary">
            <Link to="/gallery">
              كل الألبومات
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[4/3] w-full animate-pulse bg-surface-muted" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
                  </div>
                </div>
              ))
            : (data ?? []).map((album) => {
                const cover = albumCoverUrl(album);
                return (
                  <Link
                    key={album.id}
                    to="/gallery/$slug"
                    params={{ slug: album.slug }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`فتح ألبوم ${album.title_ar}`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                      {cover ? (
                        <img
                          src={cover}
                          alt={album.cover?.alt_ar ?? album.title_ar}
                          loading="lazy"
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                        <Images className="h-3.5 w-3.5" aria-hidden="true" />
                        {album.photo_count} صورة
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        {categoryLabel(album.category)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                        {album.title_ar}
                      </h3>
                      {album.description_ar && (
                        <p className="mt-2 line-clamp-2 text-sm leading-loose text-muted-foreground">
                          {album.description_ar}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </Container>
    </Section>
  );
}
