import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/gallery")({
  component: GalleryLayout,
});

function GalleryLayout() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
