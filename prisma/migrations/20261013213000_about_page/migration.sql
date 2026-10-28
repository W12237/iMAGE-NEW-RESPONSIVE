ALTER TABLE "Homepage" ADD COLUMN "aboutHeroEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroEyebrowEn" TEXT NOT NULL DEFAULT 'About Image';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroEyebrowAr" TEXT NOT NULL DEFAULT 'عن إيمدج';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroTitleEn" TEXT NOT NULL DEFAULT 'We shape places around the lives they hold.';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroTitleAr" TEXT NOT NULL DEFAULT 'نصنع أماكن تتمحور حول الحياة التي تحتضنها.';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroBodyEn" TEXT NOT NULL DEFAULT 'Image Developments creates considered communities where architecture, landscape and everyday experience belong together.';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroBodyAr" TEXT NOT NULL DEFAULT 'تصنع إيمدج للتطوير العقاري مجتمعات مدروسة تتكامل فيها العمارة والطبيعة وتجربة الحياة اليومية.';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroImageUrl" TEXT;
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroImageAltEn" TEXT NOT NULL DEFAULT 'Image Developments community';
ALTER TABLE "Homepage" ADD COLUMN "aboutHeroImageAltAr" TEXT NOT NULL DEFAULT 'أحد مجتمعات إيمدج للتطوير العقاري';

CREATE TABLE "AboutContentBlock" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "eyebrowEn" TEXT NOT NULL,
  "eyebrowAr" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "bodyEn" TEXT NOT NULL,
  "bodyAr" TEXT NOT NULL,
  "imageUrl" TEXT,
  "imageAltEn" TEXT,
  "imageAltAr" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "homepageId" TEXT NOT NULL,
  CONSTRAINT "AboutContentBlock_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "Homepage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AboutContentBlock_homepageId_sortOrder_idx" ON "AboutContentBlock"("homepageId", "sortOrder");

INSERT INTO "AboutContentBlock" ("id","enabled","eyebrowEn","eyebrowAr","titleEn","titleAr","bodyEn","bodyAr","sortOrder","homepageId") VALUES
('about-block-philosophy',true,'Our perspective','منظورنا','A place is more than what gets built.','المكان أكبر من مجرد مبانٍ.','It is the shade along a morning walk, the view framed from home, and the easy connections that turn neighbours into a community.','المكان هو الظل على طريق الصباح، والإطلالة من المنزل، والروابط البسيطة التي تحول الجيران إلى مجتمع.',0,'homepage'),
('about-block-approach',true,'How we work','كيف نعمل','Clarity at every scale.','وضوح في كل مقياس.','From the first masterplan to the smallest shared space, we ask the same question: will this make daily life feel better?','من المخطط العام الأول إلى أصغر مساحة مشتركة، نطرح السؤال نفسه: هل سيجعل هذا الحياة اليومية أفضل؟',1,'homepage');

UPDATE "AboutContentBlock" SET "imageUrl"=(SELECT "lifestyleMediaUrl" FROM "Homepage" WHERE "id"='homepage'), "imageAltEn"='Sunlit interior connected to its landscape', "imageAltAr"='مساحة داخلية مضيئة متصلة بالطبيعة' WHERE "id"='about-block-philosophy';
UPDATE "AboutContentBlock" SET "imageUrl"=(SELECT "heroMediaUrl" FROM "Homepage" WHERE "id"='homepage'), "imageAltEn"='Considered architectural detail', "imageAltAr"='تفاصيل معمارية مدروسة' WHERE "id"='about-block-approach';
