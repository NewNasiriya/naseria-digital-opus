import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/academic")({
  component: AcademicLayout,
});

function AcademicLayout() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="public-luxury-inner academic-luxury-page">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
