import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyCms() {
  console.log("Testing CMS connection for Projects Collection...");
  const home = await prisma.homepage.findUnique({ where: { id: "homepage" } });
  console.log("Current heading:", { en: home?.projectsHeadingEn, ar: home?.projectsHeadingAr });
  console.log("Current description:", { en: home?.projectsDescriptionEn, ar: home?.projectsDescriptionAr });
  console.log("Current explore label:", { en: home?.projectsExploreEn, ar: home?.projectsExploreAr });
  console.log("Section enabled:", home?.projectsEnabled);

  // Update with test heading
  await prisma.homepage.update({
    where: { id: "homepage" },
    data: {
      projectsHeadingEn: "Projects",
      projectsHeadingAr: "المشاريع",
      projectsDescriptionEn: "A curated collection of residential and mixed-use destinations shaping Egypt's urban landscape.",
      projectsDescriptionAr: "مجموعة مختارة من الوجهات السكنية والمختلطة التي تصنع ملامح جديدة للحياة الحضرية في مصر.",
      projectsExploreEn: "View Project",
      projectsExploreAr: "عرض المشروع",
      projectsEnabled: true,
    },
  });

  const updated = await prisma.homepage.findUnique({ where: { id: "homepage" } });
  console.log("Updated heading:", { en: updated?.projectsHeadingEn, ar: updated?.projectsHeadingAr });
  console.log("Updated explore CTA:", { en: updated?.projectsExploreEn, ar: updated?.projectsExploreAr });

  // Check projects
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, slug: true, nameEn: true, coverImageFocalPoint: true, featured: true, featuredOrder: true },
  });
  console.log("Published projects order & focal points:", projects);
  console.log("CMS verification complete!");
}

verifyCms().catch(console.error);
