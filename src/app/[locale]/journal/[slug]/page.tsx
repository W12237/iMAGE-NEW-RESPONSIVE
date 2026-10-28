import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/content/home";
import { getNewsDetailContent } from "@/lib/content";
import { ArticleDetailExperience } from "@/components/article-detail-experience";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [articles, redirects] = await Promise.all([
      prisma.newsArticle.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true },
      }),
      prisma.articleRedirect.findMany({
        select: { sourceSlug: true },
      }),
    ]);
    const allSlugs = Array.from(
      new Set([
        ...articles.map((a) => a.slug),
        ...redirects.map((r) => r.sourceSlug),
      ])
    );
    const locales: Locale[] = ["en", "ar"];
    return locales.flatMap((locale) =>
      allSlugs.map((slug) => ({
        locale,
        slug,
      }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  if (locale !== "en" && locale !== "ar") return {};

  const isPreviewRequested = sp?.preview === "true" || sp?.preview === "1";
  const admin = isPreviewRequested ? await getAdmin() : null;
  const copy = await getNewsDetailContent(locale as Locale, slug, !!admin);

  if (!copy) {
    let redirectTarget: string | null = null;
    if (process.env.DATABASE_URL) {
      try {
        const redirectRecord = await prisma.articleRedirect.findUnique({
          where: { sourceSlug: slug },
        });
        if (redirectRecord) {
          redirectTarget = redirectRecord.targetSlug;
        }
      } catch {
        // Continue
      }
    }
    if (redirectTarget) {
      redirect(`/${locale}/journal/${redirectTarget}`);
    }
    return {};
  }
  const { article } = copy;
  const isDraftOrArchived = article.status !== "PUBLISHED";

  return {
    title: `${article.title} — Image Developments`,
    description: article.excerpt,
    robots:
      isDraftOrArchived || isPreviewRequested
        ? { index: false, follow: false }
        : undefined,
    alternates: {
      canonical: `/${locale}/journal/${slug}`,
      languages: {
        en: `/en/journal/${slug}`,
        ar: `/ar/journal/${slug}`,
      },
    },
    openGraph: {
      title: `${article.title} — Image Developments`,
      description: article.excerpt,
      images: article.image ? [{ url: article.image }] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { locale, slug } = await params;
  const sp = searchParams ? await searchParams : {};
  if (locale !== "en" && locale !== "ar") notFound();

  const isPreviewRequested = sp?.preview === "true" || sp?.preview === "1";
  const admin = isPreviewRequested ? await getAdmin() : null;
  const copy = await getNewsDetailContent(locale as Locale, slug, !!admin);

  if (!copy) {
    let redirectTarget: string | null = null;
    if (process.env.DATABASE_URL) {
      try {
        const redirectRecord = await prisma.articleRedirect.findUnique({
          where: { sourceSlug: slug },
        });
        if (redirectRecord) {
          redirectTarget = redirectRecord.targetSlug;
        }
      } catch {
        // Continue to notFound
      }
    }
    if (redirectTarget) {
      redirect(`/${locale}/journal/${redirectTarget}`);
    }
    notFound();
  }

  // Non-admins attempting to view unpublished articles
  if (copy.article.status !== "PUBLISHED" && !admin) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: copy.article.title,
    description: copy.article.excerpt,
    image: copy.article.image ? [copy.article.image] : undefined,
    datePublished: copy.article.rawDate,
    author: {
      "@type": copy.article.author ? "Person" : "Organization",
      name: copy.article.author || "Image Developments",
    },
    publisher: {
      "@type": "Organization",
      name: "Image Developments",
      url: "https://imagedevelopments.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://imagedevelopments.com/${locale}/journal/${copy.article.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ArticleDetailExperience copy={copy} />
    </>
  );
}
