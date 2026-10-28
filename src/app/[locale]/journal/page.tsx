import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getNewsPageContent } from "@/lib/content";
import { JournalPageExperience } from "@/components/journal-page-experience";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") return {};
  const copy = await getNewsPageContent(locale as Locale);
  return {
    title: copy.newsPage.seoTitle,
    description: copy.newsPage.seoDescription,
    alternates: {
      canonical: `/${locale}/journal`,
      languages: {
        en: "/en/journal",
        ar: "/ar/journal",
      },
    },
    openGraph: {
      title: copy.newsPage.seoTitle,
      description: copy.newsPage.seoDescription,
      images: copy.newsPage.hero.image ? [{ url: copy.newsPage.hero.image }] : undefined,
    },
  };
}

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getNewsPageContent(locale as Locale);
  return <JournalPageExperience copy={copy} />;
}
