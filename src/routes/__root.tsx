import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { trackPageView } from "../lib/analytics";
import { ThemeProvider, THEME_INIT_SCRIPT } from "../lib/theme";
import schoolLogo from "../assets/brand/school-logo.png.asset.json";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b2a5b" },
      { title: "مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة — أخبار، جداول، أنشطة، وإرشادات لأولياء الأمور والطلاب.",
      },
      { property: "og:title", content: "مدرسة الناصرية الابتدائية الجديدة" },
      {
        property: "og:description",
        content:
          "الموقع الرسمي للمدرسة: الأخبار، الجداول الدراسية، الأنشطة، والإرشادات.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "مدرسة الناصرية الابتدائية الجديدة" },
      { name: "description", content: "Al-Nasiriyah Digital Gateway is a premium Arabic-first website and CMS for a primary school." },
      { property: "og:description", content: "Al-Nasiriyah Digital Gateway is a premium Arabic-first website and CMS for a primary school." },
      { name: "twitter:description", content: "Al-Nasiriyah Digital Gateway is a premium Arabic-first website and CMS for a primary school." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9ce541da-c4f7-4b04-93b9-e3f1cc05614c/id-preview-88e0e46c--e64ef7e7-ce1d-4850-928a-668c52bc2c68.lovable.app-1782957439968.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9ce541da-c4f7-4b04-93b9-e3f1cc05614c/id-preview-88e0e46c--e64ef7e7-ce1d-4850-928a-668c52bc2c68.lovable.app-1782957439968.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: schoolLogo.url },
      { rel: "shortcut icon", type: "image/png", href: schoolLogo.url },
      { rel: "apple-touch-icon", href: schoolLogo.url },
      { rel: "mask-icon", href: schoolLogo.url, color: "#0b2a5b" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "مدرسة الناصرية الابتدائية الجديدة",
          alternateName: "New Al-Nasiriya Primary School",
          logo: schoolLogo.url,
          image: schoolLogo.url,
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        {/* Pre-hydration theme init — prevents FOUC on refresh. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PageViewTracker />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function PageViewTracker() {
  const router = useRouter();
  useEffect(() => {
    // Log the initial page render.
    trackPageView(router.state.location.pathname);
    const unsub = router.subscribe("onResolved", (event) => {
      const path = event.toLocation?.pathname ?? router.state.location.pathname;
      trackPageView(path);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

