import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon, Images, Search } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  albumCoverUrl,
  categoryLabel,
  fetchAlbums,
  formatAlbumDate,
  type AlbumSummary,
} from "@/lib/gallery";

export const Route = createFileRoute("/gallery/")({
  head: () => ({
    meta: [
      { title: "معرض الصور | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "أرشيف رسمي من صور المدرسة: الترميم والتجهيز، رياض الأطفال، الأنشطة، الفعاليات، والإنجازات.",
      },
      { property: "og:title", content: "معرض الصور" },
      {
        property: "og:description",
        content:
          "أرشيف رسمي من صور المدرسة: الترميم والتجهيز، رياض الأطفال، الأنشطة، الفعاليات، والإنجازات.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  component: GalleryIndex,
});

type SortOrder = "newest" | "oldest";

function AlbumCard({ album }: { album: AlbumSummary }) {
  const cover = albumCoverUrl(album);
  const alt = album.cover?.alt_ar ?? album.title_ar;
  return (
    <Link
      to="/gallery/$slug"
      params={{ slug: album.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`فتح ألبوم ${album.title_ar}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {cover ? (
          <img
            src={cover}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
          <span>{formatAlbumDate(album.published_at)}</span>
          <span className="inline-flex items-center gap-1 text-primary">
            عرض الألبوم
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function GalleryIndex() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gallery", "albums"],
    queryFn: fetchAlbums,
    staleTime: 60_000,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortOrder>("newest");

  const albums = data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    albums.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [albums]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = albums.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title_ar.toLowerCase().includes(q) ||
        (a.description_ar ?? "").toLowerCase().includes(q)
      );
    });
    list.sort((a, b) => {
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [albums, search, category, sort]);

  const totalPhotos = useMemo(
    () => albums.reduce((sum, a) => sum + (a.photo_count ?? 0), 0),
    [albums]
  );

  return (
    <>
      <PageHero
        eyebrow="أرشيف المدرسة"
        title="معرض الصور"
        description="مجموعة رسمية من صور المدرسة، مصنّفة حسب المناسبة والموضوع. جميع الصور مأخوذة من الأرشيف الرسمي للمدرسة."
        crumbs={[{ label: "معرض الصور" }]}
      />

      <Section spacing="default">
        <Container size="wide">
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">الألبومات</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {albums.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">الصور</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {totalPhotos}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">التصنيفات</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {categories.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">آخر تحديث</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatAlbumDate(albums[0]?.published_at ?? null) || "—"}
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الألبومات…"
                aria-label="بحث في الألبومات"
                className="h-11 ps-3 pe-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="تصفية حسب التصنيف"
                className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1"
              >
                <button
                  type="button"
                  onClick={() => setCategory("all")}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (category === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  الكل
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                      (category === c
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {categoryLabel(c)}
                  </button>
                ))}
              </div>
              <div
                role="group"
                aria-label="ترتيب"
                className="flex items-center gap-1 rounded-lg border border-border p-1"
              >
                <button
                  type="button"
                  onClick={() => setSort("newest")}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (sort === "newest"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  الأحدث
                </button>
                <button
                  type="button"
                  onClick={() => setSort("oldest")}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (sort === "oldest"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  الأقدم
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[4/3] w-full animate-pulse bg-surface-muted" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <p className="text-sm text-muted-foreground">
                تعذر تحميل الألبومات في الوقت الحالي. حاول لاحقًا.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <div
                aria-hidden="true"
                className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
              >
                <Images className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                لا توجد ألبومات مطابقة
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-muted-foreground">
                جرّب تعديل كلمات البحث أو إزالة التصفية لعرض كل الألبومات المنشورة.
              </p>
              {(search || category !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                >
                  إعادة الضبط
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
