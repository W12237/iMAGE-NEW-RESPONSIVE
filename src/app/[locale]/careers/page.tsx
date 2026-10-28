import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getCareersPageContent } from "@/lib/content";
import { CareersPageExperience } from "@/components/careers-page-experience";

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
  const copy = await getCareersPageContent(locale as Locale);
  return {
    title: copy.careersPage.seoTitle,
    description: copy.careersPage.seoDescription,
  };
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getCareersPageContent(locale as Locale);
  return <CareersPageExperience copy={copy} />;
}
