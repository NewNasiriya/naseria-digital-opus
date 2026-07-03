/**
 * Google Analytics 4 integration.
 *
 * Provides gtag.js initialization and tracking for GA4.
 * - Loads the gtag.js script asynchronously (doesn't block rendering).
 * - Initializes with the given measurement ID.
 * - Automatically tracks page views.
 * - Prevents duplicate script loads.
 * - Production-ready with error handling.
 */

const MEASUREMENT_ID = "G-E4EJ8P7WH2";
const GTAG_SCRIPT_ID = "google-analytics-gtag";
let gtagInitialized = false;

/**
 * Load and initialize Google Analytics 4 gtag.js.
 * Safe to call multiple times — subsequent calls are no-ops.
 * Asynchronous: doesn't block page rendering.
 */
export function initializeGoogleAnalytics(): void {
  if (typeof window === "undefined" || gtagInitialized) return;

  try {
    // Prevent duplicate script loads
    if (document.getElementById(GTAG_SCRIPT_ID)) {
      gtagInitialized = true;
      return;
    }

    // Load gtag.js script asynchronously
    const script = document.createElement("script");
    script.id = GTAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;

    script.onload = () => {
      // Initialize the gtag global function
      setupGtag();
      gtagInitialized = true;
    };

    script.onerror = () => {
      console.warn(`[GA4] Failed to load gtag.js for measurement ID: ${MEASUREMENT_ID}`);
      gtagInitialized = true; // Mark as initialized to avoid retries
    };

    // Insert at the end of head (or document.documentElement if head doesn't exist yet)
    const target = document.head || document.documentElement;
    target.appendChild(script);
  } catch (error) {
    console.warn("[GA4] Error initializing Google Analytics:", error);
    gtagInitialized = true; // Prevent retry loops
  }
}

/**
 * Configure the gtag.js global function.
 * Called after the gtag.js script has loaded.
 */
function setupGtag(): void {
  // Declare the gtag function as a global
  (window as any).dataLayer = (window as any).dataLayer || [];

  function gtag(...args: any[]) {
    (window as any).dataLayer.push(arguments);
  }

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, {
    send_page_view: true, // Let gtag handle automatic page views
    allow_google_signals: false, // Privacy: disable Google signals
    allow_ad_personalization_signals: false, // Privacy: disable ad personalization
  });
}

/**
 * Track a page view event.
 * Can be called directly for manual tracking (e.g., SPA route changes).
 * @param pathname - The page path to track (e.g., "/news/article-slug")
 */
export function trackPageViewGA4(pathname: string): void {
  if (typeof window === "undefined" || !gtagInitialized) return;

  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "page_view", {
        page_path: pathname,
        page_title: document.title,
      });
    }
  } catch (error) {
    console.warn("[GA4] Error tracking page view:", error);
  }
}

/**
 * Track a custom event in Google Analytics 4.
 * @param eventName - GA4 event name (e.g., "search", "view_item")
 * @param eventData - Custom properties for the event
 */
export function trackEventGA4(eventName: string, eventData?: Record<string, any>): void {
  if (typeof window === "undefined" || !gtagInitialized) return;

  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", eventName, eventData || {});
    }
  } catch (error) {
    console.warn(`[GA4] Error tracking event "${eventName}":`, error);
  }
}
