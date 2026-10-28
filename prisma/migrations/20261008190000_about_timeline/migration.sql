ALTER TABLE "Homepage" ADD COLUMN "aboutEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Homepage" ADD COLUMN "aboutEyebrowEn" TEXT NOT NULL DEFAULT 'Our journey';
ALTER TABLE "Homepage" ADD COLUMN "aboutEyebrowAr" TEXT NOT NULL DEFAULT 'رحلتنا';
ALTER TABLE "Homepage" ADD COLUMN "aboutTitleEn" TEXT NOT NULL DEFAULT 'A timeline of places, people and progress.';
ALTER TABLE "Homepage" ADD COLUMN "aboutTitleAr" TEXT NOT NULL DEFAULT 'مسيرة من الأماكن والناس والتقدم.';
ALTER TABLE "Homepage" ADD COLUMN "aboutIntroEn" TEXT NOT NULL DEFAULT 'From our first idea to the communities taking shape today, every chapter adds a new perspective.';
ALTER TABLE "Homepage" ADD COLUMN "aboutIntroAr" TEXT NOT NULL DEFAULT 'من فكرتنا الأولى إلى المجتمعات التي تتشكل اليوم، يضيف كل فصل منظوراً جديداً.';

CREATE TABLE "AboutMilestone" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "year" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "bodyEn" TEXT NOT NULL,
  "bodyAr" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imageAltEn" TEXT NOT NULL,
  "imageAltAr" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "homepageId" TEXT NOT NULL,
  CONSTRAINT "AboutMilestone_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "Homepage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
