/**
 * Enterprise-grade reusable schema.org JSON-LD generators.
 *
 * All functions produce Google-compliant JSON-LD schemas.
 * No duplicate schemas. Minimal bundle footprint. Strong TypeScript typing.
 */

import type { ReactNode } from "react";

export const SCHEMA_CONTEXT = "https://schema.org";

/**
 * Organization schema.
 * Used in __root.tsx for the site-wide organization identity.
 */
export interface OrganizationSchemaInput {
  name_ar: string;
  name_en: string;
  url: string;
  logo_url: string;
  image_url: string;
  description_ar: string;
  description_en?: string;
  country_code: string;
  phone?: string;
  email?: string;
  address_street?: string;
  address_city?: string;
  address_region?: string;
  address_postal_code?: string;
  same_as?: string[];
  founding_date?: string;
  /** ISO language codes the org communicates in. Defaults to ["ar","en"]. */
  knows_language?: string[];
  /** e.g. "Primary Education" */
  educational_level?: string;
  /** When true emits @type EducationalOrganization; otherwise Organization. */
  educational?: boolean;
}

export function buildOrganizationSchema(
  input: OrganizationSchemaInput,
): Record<string, unknown> {
  const languages = input.knows_language ?? ["ar", "en"];
  const contactPoint = input.phone || input.email
    ? {
        "@type": "ContactPoint",
        ...(input.phone && { telephone: input.phone }),
        ...(input.email && { email: input.email }),
        contactType: "customer service",
        areaServed: input.country_code,
        availableLanguage: languages,
      }
    : undefined;

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressCountry: input.country_code,
  };
  if (input.address_street) address.streetAddress = input.address_street;
  if (input.address_city) address.addressLocality = input.address_city;
  if (input.address_region) address.addressRegion = input.address_region;
  if (input.address_postal_code) address.postalCode = input.address_postal_code;

  const type = input.educational === false ? "Organization" : "EducationalOrganization";

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": type,
    "@id": `${input.url}/#organization`,
    name: input.name_ar,
    alternateName: input.name_en,
    url: input.url,
    logo: {
      "@type": "ImageObject",
      url: input.logo_url,
    },
    image: input.image_url,
    description: input.description_ar,
    inLanguage: "ar",
    knowsLanguage: languages,
    areaServed: input.country_code,
    address,
    ...(contactPoint && { contactPoint }),
    ...(input.phone && { telephone: input.phone }),
    ...(input.email && { email: input.email }),
    ...(input.founding_date && { foundingDate: input.founding_date }),
    ...(type === "EducationalOrganization" && input.educational_level && {
      educationalLevel: input.educational_level,
    }),
    ...(input.same_as && input.same_as.length > 0 && { sameAs: input.same_as }),
  };
}

/**
 * Website schema with search action.
 * Used in __root.tsx for site-wide search capability.
 */
export interface WebsiteSchemaInput {
  url: string;
  name_ar: string;
  language: string;
  organization_id: string;
  search_url: string;
}

export function buildWebsiteSchema(input: WebsiteSchemaInput): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": `${input.url}/#website`,
    url: input.url,
    name: input.name_ar,
    inLanguage: input.language,
    publisher: { "@id": input.organization_id },
    potentialAction: {
      "@type": "SearchAction",
      target: `${input.search_url}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Article schema for news and achievements.
 * Call this in route head() for article detail pages.
 */
export interface ArticleSchemaInput {
  headline_ar: string;
  headline_en?: string;
  description: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  date_published: string; // ISO 8601
  date_modified?: string; // ISO 8601
  author_name?: string;
  author_type?: "Person" | "Organization";
  publisher_name: string;
  url: string;
  language?: string;
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const author = input.author_name
    ? {
        "@type": input.author_type || "Person",
        name: input.author_name,
      }
    : {
        "@type": "Organization",
        name: input.publisher_name,
      };

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: input.headline_ar,
    ...(input.headline_en && { alternativeHeadline: input.headline_en }),
    description: input.description,
    ...(input.image_url && {
      image: {
        "@type": "ImageObject",
        url: input.image_url,
        width: input.image_width ?? 1200,
        height: input.image_height ?? 630,
      },
    }),
    datePublished: input.date_published,
    ...(input.date_modified && { dateModified: input.date_modified }),
    author,
    publisher: {
      "@type": "Organization",
      name: input.publisher_name,
    },
    inLanguage: input.language || "ar",
    url: input.url,
  };
}

/**
 * BreadcrumbList schema.
 * Use this for pages with navigation trails.
 */
export interface BreadcrumbItem {
  label: string;
  url: string;
}

export interface BreadcrumbListInput {
  items: BreadcrumbItem[];
}

export function buildBreadcrumbListSchema(
  input: BreadcrumbListInput,
): Record<string, unknown> {
  if (!input.items || input.items.length === 0) {
    return {};
  }

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.url,
    })),
  };
}

/**
 * FAQPage schema.
 * Use this for FAQ pages with structured Q&A.
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageSchemaInput {
  items: FAQItem[];
}

export function buildFAQPageSchema(input: FAQPageSchemaInput): Record<string, unknown> {
  if (!input.items || input.items.length === 0) {
    return {};
  }

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: input.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * ImageObject schema.
 * Use this for standalone image metadata (gallery, achievements).
 */
export interface ImageObjectSchemaInput {
  url: string;
  width?: number;
  height?: number;
  alt_text?: string;
  date_published?: string;
  name?: string;
  description?: string;
}

export function buildImageObjectSchema(
  input: ImageObjectSchemaInput,
): Record<string, unknown> {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ImageObject",
    url: input.url,
    ...(input.width && { width: input.width }),
    ...(input.height && { height: input.height }),
    ...(input.alt_text && { name: input.alt_text }),
    ...(input.description && { description: input.description }),
    ...(input.date_published && { datePublished: input.date_published }),
  };
}

/**
 * SchemaScript component.
 * Wraps a JSON-LD schema in a React component for injection into head.
 */
export function SchemaScript({ data }: { data: Record<string, unknown> }): ReactNode {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  };
}
