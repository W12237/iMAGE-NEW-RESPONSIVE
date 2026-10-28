import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getHomepageContent } from "@/lib/content";
import { HomepageExperience } from "@/components/homepage-experience";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return [{ locale: "en" }, { locale: "ar" }]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") return {};
  const copy = await getHomepageContent(locale);
  return { title: copy.settings?.seoTitle, description: copy.settings?.seoDescription };
}
export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getHomepageContent(locale as Locale);
  return <HomepageExperience copy={copy} />;
}
