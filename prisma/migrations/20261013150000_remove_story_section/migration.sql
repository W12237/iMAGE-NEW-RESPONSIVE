DELETE FROM "NavigationItem" WHERE "url" = '#story';

UPDATE "Homepage"
SET "sectionOrder" = '["projects","lifestyle","stats","journal","closing"]';

ALTER TABLE "Homepage" DROP COLUMN "storyEnabled";
ALTER TABLE "Homepage" DROP COLUMN "storyBackgroundRgb";
ALTER TABLE "Homepage" DROP COLUMN "storyEyebrowEn";
ALTER TABLE "Homepage" DROP COLUMN "storyEyebrowAr";
ALTER TABLE "Homepage" DROP COLUMN "storyTitleEn";
ALTER TABLE "Homepage" DROP COLUMN "storyTitleAr";
ALTER TABLE "Homepage" DROP COLUMN "storyBodyEn";
ALTER TABLE "Homepage" DROP COLUMN "storyBodyAr";
ALTER TABLE "Homepage" DROP COLUMN "storyLinkLabelEn";
ALTER TABLE "Homepage" DROP COLUMN "storyLinkLabelAr";
ALTER TABLE "Homepage" DROP COLUMN "storyLinkUrl";
ALTER TABLE "Homepage" DROP COLUMN "storyMediaUrl";
ALTER TABLE "Homepage" DROP COLUMN "storyMediaAltEn";
ALTER TABLE "Homepage" DROP COLUMN "storyMediaAltAr";
