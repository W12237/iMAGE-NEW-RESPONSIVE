import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/home";
import { getProjectDetailContent } from "@/lib/content";
import { ProjectDetailExperience } from "@/components/project-detail-experience";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const projects = await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    const locales: Locale[] = ["en", "ar"];
    return locales.flatMap((locale) =>
      projects.map((p) => ({
        locale,
        slug: p.slug,
      }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== "en" && locale !== "ar") return {};
  const copy = await getProjectDetailContent(locale as Locale, slug);
  if (!copy) return {};
  const { project } = copy;
  return {
    title: project.seoTitle || `${project.name} — Image Developments`,
    description: project.seoDescription || project.shortDescription,
    openGraph: {
      title: project.seoTitle || `${project.name} — Image Developments`,
      description: project.seoDescription || project.shortDescription,
      images: project.ogImageUrl ? [{ url: project.ogImageUrl }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  const copy = await getProjectDetailContent(locale as Locale, slug);
  if (!copy) notFound();

  return <ProjectDetailExperience copy={copy} />;
}
