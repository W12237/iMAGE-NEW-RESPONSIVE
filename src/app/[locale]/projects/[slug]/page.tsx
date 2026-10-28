import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/content/home";
import { getProjectDetailContent } from "@/lib/content";
import { ProjectDetailExperience } from "@/components/project-detail-experience";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [projects, redirects] = await Promise.all([
      prisma.project.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true },
      }),
      prisma.projectRedirect.findMany({
        select: { sourceSlug: true },
      }),
    ]);
    const allSlugs = Array.from(
      new Set([
        ...projects.map((p) => p.slug),
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
  const copy = await getProjectDetailContent(locale as Locale, slug, !!admin);

  if (!copy) {
    let redirectTarget: string | null = null;
    if (process.env.DATABASE_URL) {
      try {
        const redirectRecord = await prisma.projectRedirect.findUnique({
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
      redirect(`/${locale}/projects/${redirectTarget}`);
    }
    return {};
  }
  const { project } = copy;
  const isDraftOrArchived = project.status !== "PUBLISHED";

  return {
    title: project.seoTitle || `${project.name} — Image Developments`,
    description: project.seoDescription || project.shortDescription,
    robots:
      isDraftOrArchived || isPreviewRequested
        ? { index: false, follow: false }
        : undefined,
    openGraph: {
      title: project.seoTitle || `${project.name} — Image Developments`,
      description: project.seoDescription || project.shortDescription,
      images: project.ogImageUrl ? [{ url: project.ogImageUrl }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({
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
  const copy = await getProjectDetailContent(locale as Locale, slug, !!admin);

  if (!copy) {
    let redirectTarget: string | null = null;
    if (process.env.DATABASE_URL) {
      try {
        const redirectRecord = await prisma.projectRedirect.findUnique({
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
      redirect(`/${locale}/projects/${redirectTarget}`);
    }
    notFound();
  }

  // Non-admins attempting to view unpublished project
  if (copy.project.status !== "PUBLISHED" && !admin) {
    notFound();
  }

  return <ProjectDetailExperience copy={copy} />;
}
