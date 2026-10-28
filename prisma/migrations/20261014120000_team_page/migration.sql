ALTER TABLE "Homepage" ADD COLUMN "teamEyebrowEn" TEXT NOT NULL DEFAULT 'The people behind Image';
ALTER TABLE "Homepage" ADD COLUMN "teamEyebrowAr" TEXT NOT NULL DEFAULT 'الفريق وراء إيمدج';
ALTER TABLE "Homepage" ADD COLUMN "teamTitleEn" TEXT NOT NULL DEFAULT 'Different perspectives. One shared vision.';
ALTER TABLE "Homepage" ADD COLUMN "teamTitleAr" TEXT NOT NULL DEFAULT 'منظورات مختلفة. رؤية واحدة.';
ALTER TABLE "Homepage" ADD COLUMN "teamIntroEn" TEXT NOT NULL DEFAULT 'Meet the people shaping thoughtful places for how Egypt lives next.';
ALTER TABLE "Homepage" ADD COLUMN "teamIntroAr" TEXT NOT NULL DEFAULT 'تعرف على الأشخاص الذين يصنعون أماكن مدروسة لمستقبل الحياة في مصر.';

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nameEn" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "roleEn" TEXT NOT NULL,
  "roleAr" TEXT NOT NULL,
  "bioEn" TEXT NOT NULL,
  "bioAr" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imageAltEn" TEXT NOT NULL,
  "imageAltAr" TEXT NOT NULL,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "homepageId" TEXT NOT NULL,
  CONSTRAINT "TeamMember_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "Homepage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TeamMember_homepageId_sortOrder_idx" ON "TeamMember"("homepageId", "sortOrder");
