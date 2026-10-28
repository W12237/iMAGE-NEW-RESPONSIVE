import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getProjectsPageContent } from "@/lib/content";
import { ProjectsPageExperience } from "@/components/projects-page-experience";

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
  const copy = await getProjectsPageContent(locale as Locale);
  const isAr = locale === "ar";
  return {
    title: isAr ? "المشاريع — إيمدج للتطوير العقاري" : "Projects — Image Developments",
    description: isAr
      ? "استكشف أحدث مجتمعات ووجهات إيمدج للتطوير العقاري في مصر."
      : "Explore Image Developments contemporary communities and architectural destinations in Egypt.",
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getProjectsPageContent(locale as Locale);
  return <ProjectsPageExperience copy={copy} />;
}
