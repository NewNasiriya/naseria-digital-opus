import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/honor")({
  component: HonorLayout,
});

function HonorLayout() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="public-luxury-inner honor-luxury-page">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
