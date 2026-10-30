import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Migrating existing projects into normalized child tables...");
  const projects = await db.project.findMany();

  for (const p of projects) {
    console.log(`Processing project ${p.slug} (${p.nameEn})...`);

    // 1. Key Facts
    if (p.keyFacts) {
      try {
        const facts = JSON.parse(p.keyFacts);
        if (Array.isArray(facts)) {
          const existingCount = await db.projectKeyFact.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < facts.length; i++) {
              const f = facts[i];
              await db.projectKeyFact.create({
                data: {
                  projectId: p.id,
                  labelEn: f.label || f.labelEn || "Fact",
                  labelAr: f.labelAr || f.label || "حقيقة",
                  valueEn: f.value || f.valueEn || "",
                  valueAr: f.valueAr || f.value || "",
                  unitEn: f.unit || f.unitEn || null,
                  unitAr: f.unitAr || null,
                  icon: f.icon || null,
                  sortOrder: i,
                },
              });
            }
            console.log(`  - Migrated ${facts.length} key facts`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing keyFacts for ${p.slug}:`, e.message);
      }
    }

    // 2. Highlights
    if (p.highlights) {
      try {
        const highlights = JSON.parse(p.highlights);
        if (Array.isArray(highlights)) {
          const existingCount = await db.projectHighlight.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < highlights.length; i++) {
              const h = highlights[i];
              await db.projectHighlight.create({
                data: {
                  projectId: p.id,
                  titleEn: h.title || h.titleEn || "Highlight",
                  titleAr: h.titleAr || h.title || "ميزة",
                  descriptionEn: h.description || h.descriptionEn || "",
                  descriptionAr: h.descriptionAr || h.description || "",
                  imageUrl: h.imageUrl || null,
                  icon: h.icon || null,
                  sortOrder: i,
                },
              });
            }
            console.log(`  - Migrated ${highlights.length} highlights`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing highlights for ${p.slug}:`, e.message);
      }
    }

    // 3. Unit Types
    if (p.unitTypes) {
      try {
        const units = JSON.parse(p.unitTypes);
        if (Array.isArray(units)) {
          const existingCount = await db.projectUnitType.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < units.length; i++) {
              const u = units[i];
              await db.projectUnitType.create({
                data: {
                  projectId: p.id,
                  titleEn: u.name || u.titleEn || u.type || "Unit",
                  titleAr: u.nameAr || u.titleAr || u.name || "وحدة سكنية",
                  areaEn: u.area || u.areaEn || null,
                  areaAr: u.areaAr || u.area || null,
                  areaRange: u.areaRange || u.area || null,
                  areaUnit: u.areaUnit || "sqm",
                  finishingEn: u.finishing || u.finishingEn || null,
                  finishingAr: u.finishingAr || u.finishing || null,
                  paymentPlanEn: u.payment || u.paymentPlanEn || null,
                  paymentPlanAr: u.paymentAr || u.payment || null,
                  descriptionEn: u.descriptionEn || null,
                  descriptionAr: u.descriptionAr || null,
                  imageUrl: u.imageUrl || null,
                  floorPlanUrl: u.floorPlanUrl || null,
                  sortOrder: i,
                },
              });
            }
            console.log(`  - Migrated ${units.length} unit types`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing unitTypes for ${p.slug}:`, e.message);
      }
    }

    // 4. Gallery Items
    if (p.gallery) {
      try {
        const gallery = JSON.parse(p.gallery);
        if (Array.isArray(gallery)) {
          const existingCount = await db.projectGalleryItem.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < gallery.length; i++) {
              const img = gallery[i];
              const url = typeof img === "string" ? img : img.url;
              if (url) {
                await db.projectGalleryItem.create({
                  data: {
                    projectId: p.id,
                    imageUrl: url,
                    category: i % 2 === 0 ? "RENDERS" : "CONSTRUCTION",
                    captionEn: typeof img === "object" ? img.captionEn : null,
                    captionAr: typeof img === "object" ? img.captionAr : null,
                    altEn: p.nameEn,
                    altAr: p.nameAr,
                    sortOrder: i,
                  },
                });
              }
            }
            console.log(`  - Migrated ${gallery.length} gallery items`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing gallery for ${p.slug}:`, e.message);
      }
    }

    // 5. Construction Updates
    if (p.constructionUpdates) {
      try {
        const updates = JSON.parse(p.constructionUpdates);
        if (Array.isArray(updates)) {
          const existingCount = await db.projectConstructionUpdate.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < updates.length; i++) {
              const u = updates[i];
              await db.projectConstructionUpdate.create({
                data: {
                  projectId: p.id,
                  date: u.date ? new Date(u.date) : new Date(),
                  titleEn: u.title || u.titleEn || "Construction Progress",
                  titleAr: u.titleAr || u.title || "تقدم الأعمال الإنشائية",
                  descriptionEn: u.descriptionEn || null,
                  descriptionAr: u.descriptionAr || null,
                  imageUrl: u.imageUrl || null,
                  isVideo: Boolean(u.isVideo),
                  videoUrl: u.videoUrl || null,
                  sortOrder: i,
                },
              });
            }
            console.log(`  - Migrated ${updates.length} construction updates`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing constructionUpdates for ${p.slug}:`, e.message);
      }
    }

    // 6. Connectivity (Nearby Locations)
    if (p.nearbyLocations) {
      try {
        const locations = JSON.parse(p.nearbyLocations);
        if (Array.isArray(locations)) {
          const existingCount = await db.projectConnectivity.count({ where: { projectId: p.id } });
          if (existingCount === 0) {
            for (let i = 0; i < locations.length; i++) {
              const loc = locations[i];
              await db.projectConnectivity.create({
                data: {
                  projectId: p.id,
                  destinationEn: loc.name || loc.destinationEn || "Destination",
                  destinationAr: loc.nameAr || loc.destinationAr || loc.name || "الوجهة",
                  distanceOrDurationEn: loc.distance || loc.distanceOrDurationEn || "10 mins",
                  distanceOrDurationAr: loc.distanceAr || loc.distanceOrDurationAr || loc.distance || "١٠ دقائق",
                  travelType: loc.type || "CAR",
                  sortOrder: i,
                },
              });
            }
            console.log(`  - Migrated ${locations.length} connectivity points`);
          }
        }
      } catch (e) {
        console.warn(`  - Error parsing nearbyLocations for ${p.slug}:`, e.message);
      }
    }
  }

  console.log("Migration complete!");
}

main().catch(console.error).finally(() => db.$disconnect());
