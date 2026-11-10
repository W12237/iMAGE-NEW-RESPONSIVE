-- AlterTable Homepage
ALTER TABLE "Homepage" ADD COLUMN "projectsLocationTagsEnabled" BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE "Homepage" ADD COLUMN "projectsAllLabelEn" TEXT NOT NULL DEFAULT 'All Projects';
ALTER TABLE "Homepage" ADD COLUMN "projectsAllLabelAr" TEXT NOT NULL DEFAULT 'كافة المشاريع';
ALTER TABLE "Homepage" ADD COLUMN "projectsShowTagCounts" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "Homepage" ADD COLUMN "projectsLocationOrder" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "Homepage" ADD COLUMN "projectsVisibleLocations" TEXT;

-- AlterTable TypographySetting
ALTER TABLE "TypographySetting" ADD COLUMN "fontSizeMobile" INTEGER;
ALTER TABLE "TypographySetting" ADD COLUMN "fontSizeDesktop" INTEGER;
ALTER TABLE "TypographySetting" ADD COLUMN "lineHeight" REAL;
ALTER TABLE "TypographySetting" ADD COLUMN "fontWeight" INTEGER;

