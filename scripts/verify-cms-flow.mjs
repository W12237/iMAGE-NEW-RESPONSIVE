import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCmsFlow() {
  console.log("Starting CMS flow verification...");

  // 1. Initial count
  const initialLiveRes = await fetch("http://localhost:3000/en/projects");
  const initialHtml = await initialLiveRes.text();
  const initialCount = (initialHtml.match(/class="project-showcase-card /g) || []).length;
  console.log(`Initial public projects count on /en/projects: ${initialCount}`);

  // 2. Create DRAFT project
  console.log("Creating draft project...");
  const draftProject = await prisma.project.create({
    data: {
      slug: "test-draft-project",
      nameEn: "Test Draft Community",
      nameAr: "مجتمع مسودة اختباري",
      shortDescriptionEn: "A visionary concept for modern living.",
      shortDescriptionAr: "رؤية معمارية حديثة لأسلوب الحياة العصري.",
      locationEn: "New Capital",
      locationAr: "العاصمة الإدارية",
      coverImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      coverImageAltEn: "Test Draft Community",
      coverImageAltAr: "مجتمع مسودة اختباري",
      status: "DRAFT",
      featured: false,
      featuredOrder: 99,
    },
  });
  console.log(`Created draft project with ID: ${draftProject.id}`);

  // Fetch /en/projects - MUST remain initialCount because it is DRAFT
  const draftLiveRes = await fetch("http://localhost:3000/en/projects");
  const draftHtml = await draftLiveRes.text();
  const draftCardsCount = (draftHtml.match(/class="project-showcase-card /g) || []).length;
  console.log(`Public projects count after draft created: ${draftCardsCount}`);
  if (draftCardsCount !== initialCount) {
    throw new Error(`DRAFT project appeared on public page! Expected ${initialCount}, got ${draftCardsCount}`);
  }
  console.log("SUCCESS: Draft project is correctly EXCLUDED from public page.");

  // 3. Publish the project
  console.log("Publishing project...");
  await prisma.project.update({
    where: { id: draftProject.id },
    data: { status: "PUBLISHED" },
  });

  // Revalidate cache
  const revalRes = await fetch("http://localhost:3000/en/projects", { cache: "no-store" });
  const publishedHtml = await revalRes.text();
  const publishedCardsCount = (publishedHtml.match(/class="project-showcase-card /g) || []).length;
  console.log(`Public projects count after publishing: ${publishedCardsCount}`);
  if (publishedCardsCount !== initialCount + 1) {
    throw new Error(`PUBLISHED project did not appear on public page! Expected ${initialCount + 1}, got ${publishedCardsCount}`);
  }
  console.log("SUCCESS: Published project is correctly INCLUDED on public page.");

  // 4. Clean up
  console.log("Cleaning up test project...");
  await prisma.project.delete({
    where: { id: draftProject.id },
  });

  const finalRes = await fetch("http://localhost:3000/en/projects", { cache: "no-store" });
  const finalHtml = await finalRes.text();
  const finalCount = (finalHtml.match(/class="project-showcase-card /g) || []).length;
  console.log(`Public projects count after cleanup: ${finalCount}`);
  if (finalCount !== initialCount) {
    throw new Error(`Cleanup failed, projects count is ${finalCount}`);
  }
  console.log("SUCCESS: Database restored to original state cleanly.");

  await prisma.$disconnect();
  console.log("All CMS publication and draft filtering verification passed perfectly!");
}

testCmsFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
