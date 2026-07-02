import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ImageIcon, Images, Share2 } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/gallery/Lightbox";
import { mediaPublicUrl } from "@/lib/media";
import { trackContentView } from "@/lib/analytics";
import {
  albumCoverUrl,
  categoryLabel,
  fetchAlbumBySlug,
  fetchLatestAlbums,
  formatAlbumDate,
  type AlbumDetail,
} from "@/lib/gallery";

export const Route = createFileRoute("/gallery/$slug")({
  loader: async ({ params }) => {
    const album = await fetchAlbumBySlug(params.slug);
    if (!album) throw notFound();
    return { album };
  },
  head: ({ loaderData }) => {
    const album = loaderData?.album as AlbumDetail | undefined;
    if (!album) return {};
    const desc =
      album.description_ar ??
      `ألبوم رسمي من صور مدرسة الناصرية الابتدائية الجديدة — ${album.title_ar}.`;
    const cover = albumCoverUrl(album);
    return {
      meta: [
        { title: `${album.title_ar} | معرض المدرسة` },
        { name: "description", content: desc },
        { property: "og:title", content: album.title_ar },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/gallery/${album.slug}` },
        ...(cover ? [{ property: "og:image", content: cover }] : []),
        ...(cover ? [{ name: "twitter:image", content: cover }] : []),
        { name: "twitter:card", content: cover ? "summary_large_image" : "summary" },
      ],
      links: [{ rel: "canonical", href: `/gallery/${album.slug}` }],
    };
  },
  errorComponent: ({ error }) => (
    <>
      <PageHero title="تعذر تحميل الألبوم" description={String(error?.message ?? "")} />
      <Section>
        <Container size="wide">
          <Button asChild variant="outline">
            <Link to="/gallery">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              العودة إلى المعرض
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  ),
  notFoundComponent: () => (
    <>
      <PageHero
        title="الألبوم غير متوفر"
        description="ربما تمت إزالة هذا الألبوم أو أن الرابط قديم."
        crumbs={[{ label: "معرض الصور", to: "/gallery" }, { label: "غير متوفر" }]}
      />
      <Section>
        <Container size="wide">
          <Button asChild variant="outline">
            <Link to="/gallery">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              العودة إلى المعرض
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  ),
  component: AlbumPage,
});

function AlbumPage() {
  const { album } = Route.useLoaderData() as { album: AlbumDetail };
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: related } = useQuery({
    queryKey: ["gallery", "related", album.id],
    queryFn: () => fetchLatestAlbums(4),
    staleTime: 60_000,
  });

  const otherAlbums = (related ?? []).filter((a) => a.id !== album.id).slice(0, 3);

  const share = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: album.title_ar,
          url,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <PageHero
        eyebrow={categoryLabel(album.category)}
        title={album.title_ar}
        description={album.description_ar ?? undefined}
        crumbs={[
          { label: "معرض الصور", to: "/gallery" },
          { label: album.title_ar },
        ]}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Images className="h-3.5 w-3.5" aria-hidden="true" />
              {album.photos.length} صورة
            </span>
            {album.published_at && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatAlbumDate(album.published_at)}
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={share}>
              <Share2 className="h-4 w-4" />
              مشاركة
            </Button>
          </>
        }
      />

      <Section spacing="default">
        <Container size="wide">
          {album.photos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <div
                aria-hidden="true"
                className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
              >
                <ImageIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                لا توجد صور في هذا الألبوم بعد
              </h3>
            </div>
          ) : (
            <ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
              role="list"
            >
              {album.photos.map((p, i) => {
                const url = p.media ? mediaPublicUrl(p.media) : null;
                const alt = p.caption_ar ?? p.media?.alt_ar ?? album.title_ar;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="group block aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`فتح الصورة ${i + 1} من ${album.photos.length}`}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt={alt}
                          loading={i < 6 ? "eager" : "lazy"}
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </Section>

      {otherAlbums.length > 0 && (
        <Section tone="muted" spacing="default">
          <Container size="wide">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="rule-accent inline-block">ألبومات ذات صلة</h2>
              <Button asChild variant="ghost" className="text-primary">
                <Link to="/gallery">
                  كل الألبومات
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {otherAlbums.map((a) => {
                const cover = albumCoverUrl(a);
                return (
                  <Link
                    key={a.id}
                    to="/gallery/$slug"
                    params={{ slug: a.slug }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all hover:-translate-y-0.5 hover:elevation-md"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-surface-muted">
                      {cover ? (
                        <img
                          src={cover}
                          alt={a.cover?.alt_ar ?? a.title_ar}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        {categoryLabel(a.category)}
                      </p>
                      <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-foreground">
                        {a.title_ar}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={album.photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}
