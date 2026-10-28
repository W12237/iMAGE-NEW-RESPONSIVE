-- AlterTable
ALTER TABLE "Homepage" ADD COLUMN "partnersEyebrowEn" TEXT NOT NULL DEFAULT 'Our partners';
ALTER TABLE "Homepage" ADD COLUMN "partnersEyebrowAr" TEXT NOT NULL DEFAULT 'شركاؤنا';
ALTER TABLE "Homepage" ADD COLUMN "partnersTitleEn" TEXT NOT NULL DEFAULT 'Built together. Made to last.';
ALTER TABLE "Homepage" ADD COLUMN "partnersTitleAr" TEXT NOT NULL DEFAULT 'نبني معاً. لنصنع أثراً يدوم.';
ALTER TABLE "Homepage" ADD COLUMN "partnersIntroEn" TEXT NOT NULL DEFAULT 'We collaborate with leading minds across design, construction and hospitality to create places with lasting value.';
ALTER TABLE "Homepage" ADD COLUMN "partnersIntroAr" TEXT NOT NULL DEFAULT 'نتعاون مع نخبة من الخبراء في التصميم والإنشاء والضيافة لنصنع أماكن ذات قيمة دائمة.';

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "logoUrl" TEXT NOT NULL,
    "logoAltEn" TEXT NOT NULL,
    "logoAltAr" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "homepageId" TEXT NOT NULL,
    CONSTRAINT "Partner_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "Homepage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Partner_homepageId_sortOrder_idx" ON "Partner"("homepageId", "sortOrder");
