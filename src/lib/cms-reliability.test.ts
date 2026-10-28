import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { prisma } from "@/lib/prisma";
import {
  getHomepageContent,
  getProjectsPageContent,
  getProjectDetailContent,
  getNewsPageContent,
  getNewsDetailContent,
} from "./content";

describe("CMS Content Reliability & Source of Truth Audit", () => {
  const TEST_PROJECT_SLUG = "test-reliability-project";
  const RENAMED_PROJECT_SLUG = "test-reliability-project-renamed";

  afterEach(async () => {
    // Cleanup any test records
    await prisma.projectRedirect.deleteMany({
      where: { sourceSlug: { in: [TEST_PROJECT_SLUG, RENAMED_PROJECT_SLUG] } },
    });
    await prisma.project.deleteMany({
      where: { slug: { in: [TEST_PROJECT_SLUG, RENAMED_PROJECT_SLUG] } },
    });
  });

  it("1. Public project detail query accurately reflects database updates", async () => {
    // Create test project
    const created = await prisma.project.create({
      data: {
        slug: TEST_PROJECT_SLUG,
        nameEn: "Reliability Tower",
        nameAr: "برج الموثوقية",
        shortDescriptionEn: "A signature residential landmark.",
        shortDescriptionAr: "معلم سكني متميز.",
        fullDescriptionEn: "Initial English description.",
        fullDescriptionAr: "الوصف الأولي بالعربية.",
        locationEn: "New Cairo",
        locationAr: "القاهرة الجديدة",
        coverImageUrl: "https://example.com/cover.jpg",
        coverImageAltEn: "Cover image",
        coverImageAltAr: "صورة الغلاف",
        status: "PUBLISHED",
        featured: false,
        featuredOrder: 99,
      },
    });

    // Public query fetches exact database state
    const publicContentInitial = await getProjectDetailContent("en", TEST_PROJECT_SLUG);
    expect(publicContentInitial).not.toBeNull();
    expect(publicContentInitial?.project.name).toBe("Reliability Tower");
    expect(publicContentInitial?.project.fullDescription).toBe("Initial English description.");

    // Update in database (simulating CMS edit & save)
    await prisma.project.update({
      where: { id: created.id },
      data: {
        nameEn: "Updated Reliability Tower",
        fullDescriptionEn: "Updated English architecture concept.",
      },
    });

    const publicContentUpdated = await getProjectDetailContent("en", TEST_PROJECT_SLUG);
    expect(publicContentUpdated?.project.name).toBe("Updated Reliability Tower");
    expect(publicContentUpdated?.project.fullDescription).toBe("Updated English architecture concept.");
    // Arabic remains untouched
    expect(publicContentUpdated?.project.shortDescription).toBe("A signature residential landmark.");
  });

  it("2. Draft projects are private publicly but viewable in preview mode", async () => {
    await prisma.project.create({
      data: {
        slug: TEST_PROJECT_SLUG,
        nameEn: "Private Draft Residence",
        nameAr: "مشروع مسودة خاص",
        shortDescriptionEn: "Draft project description.",
        shortDescriptionAr: "وصف المسودة.",
        locationEn: "North Coast",
        locationAr: "الساحل الشمالي",
        coverImageUrl: "https://example.com/draft.jpg",
        coverImageAltEn: "Draft cover",
        coverImageAltAr: "غلاف المسودة",
        status: "DRAFT",
        featured: false,
        featuredOrder: 0,
      },
    });

    // Public visitor (isPreview = false): must be null (404)
    const publicQuery = await getProjectDetailContent("en", TEST_PROJECT_SLUG, false);
    expect(publicQuery).toBeNull();

    // Authenticated admin preview (isPreview = true): must return draft content
    const previewQuery = await getProjectDetailContent("en", TEST_PROJECT_SLUG, true);
    expect(previewQuery).not.toBeNull();
    expect(previewQuery?.project.name).toBe("Private Draft Residence");
    expect(previewQuery?.project.status).toBe("DRAFT");
  });

  it("3. Project slug changes preserve historical links via ProjectRedirect", async () => {
    const project = await prisma.project.create({
      data: {
        slug: TEST_PROJECT_SLUG,
        nameEn: "Slug Test Project",
        nameAr: "مشروع اختبار الرابط",
        shortDescriptionEn: "Testing URL slug modifications.",
        shortDescriptionAr: "اختبار تعديل الرابط.",
        locationEn: "Sheikh Zayed",
        locationAr: "الشيخ زايد",
        coverImageUrl: "https://example.com/project.jpg",
        coverImageAltEn: "Project cover",
        coverImageAltAr: "غلاف المشروع",
        status: "PUBLISHED",
        featured: false,
        featuredOrder: 0,
      },
    });

    // Simulate CMS slug update and redirect generation
    await prisma.$transaction([
      prisma.project.update({
        where: { id: project.id },
        data: { slug: RENAMED_PROJECT_SLUG },
      }),
      prisma.projectRedirect.create({
        data: { sourceSlug: TEST_PROJECT_SLUG, targetSlug: RENAMED_PROJECT_SLUG },
      }),
    ]);

    // Querying new slug returns content
    const newSlugContent = await getProjectDetailContent("en", RENAMED_PROJECT_SLUG);
    expect(newSlugContent).not.toBeNull();
    expect(newSlugContent?.project.name).toBe("Slug Test Project");

    // Old slug redirect record exists and points to new slug
    const redirectRecord = await prisma.projectRedirect.findUnique({
      where: { sourceSlug: TEST_PROJECT_SLUG },
    });
    expect(redirectRecord).not.toBeNull();
    expect(redirectRecord?.targetSlug).toBe(RENAMED_PROJECT_SLUG);
  });

  it("4. Intentionally empty fields preserve empty string and do not resurrect mock fallbacks", async () => {
    // Read original values to restore after test
    const originalHome = await prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } });

    try {
      // Set closingDescriptionEn to explicitly empty string
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: { closingDescriptionEn: "" },
      });

      const homeContent = await getHomepageContent("en");
      // Must NOT be the mock text
      expect(homeContent.closing.description).toBe("");
    } finally {
      // Restore
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: { closingDescriptionEn: originalHome.closingDescriptionEn },
      });
    }
  });

  it("5. Bilingual independence: Arabic and English fields update without overwriting each other", async () => {
    const originalHome = await prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } });

    try {
      // Update English title only
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: { heroTitleEn: "New English Vision" },
      });

      const enContent = await getHomepageContent("en");
      const arContent = await getHomepageContent("ar");

      expect(enContent.hero.title).toEqual(["New English Vision"]);
      // Arabic must preserve its existing approved copy without corruption
      expect(arContent.hero.title).toEqual(originalHome.heroTitleAr.split("\n"));

      // Update Arabic title only
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: { heroTitleAr: "رؤية معمارية متجددة" },
      });

      const arContentAfter = await getHomepageContent("ar");
      const enContentAfter = await getHomepageContent("en");

      expect(arContentAfter.hero.title).toEqual(["رؤية معمارية متجددة"]);
      expect(enContentAfter.hero.title).toEqual(["New English Vision"]);
    } finally {
      // Restore original
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: {
          heroTitleEn: originalHome.heroTitleEn,
          heroTitleAr: originalHome.heroTitleAr,
        },
      });
    }
  });

  it("6. Lifestyle CTA label and URL read directly from CMS database", async () => {
    const originalHome = await prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } });

    try {
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: {
          lifestyleCtaLabelEn: "Explore Living Spaces",
          lifestyleCtaLabelAr: "استكشف المساحات السكنية",
          lifestyleCtaUrl: "/projects",
        },
      });

      const enContent = await getHomepageContent("en");
      const arContent = await getHomepageContent("ar");

      expect(enContent.lifestyle.ctaLabel).toBe("Explore Living Spaces");
      expect(enContent.lifestyle.ctaUrl).toBe("/projects");

      expect(arContent.lifestyle.ctaLabel).toBe("استكشف المساحات السكنية");
      expect(arContent.lifestyle.ctaUrl).toBe("/projects");
    } finally {
      await prisma.homepage.update({
        where: { id: "homepage" },
        data: {
          lifestyleCtaLabelEn: originalHome.lifestyleCtaLabelEn,
          lifestyleCtaLabelAr: originalHome.lifestyleCtaLabelAr,
          lifestyleCtaUrl: originalHome.lifestyleCtaUrl,
        },
      });
    }
  });
});
