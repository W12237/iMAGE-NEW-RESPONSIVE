-- Non-destructive migration for Project Gallery settings and relationships
-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN "galleryEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "galleryTitleEn" TEXT;
ALTER TABLE "Project" ADD COLUMN "galleryTitleAr" TEXT;
ALTER TABLE "Project" ADD COLUMN "galleryIntroEn" TEXT;
ALTER TABLE "Project" ADD COLUMN "galleryIntroAr" TEXT;
ALTER TABLE "Project" ADD COLUMN "galleryShowFilters" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "galleryShowCaptions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Project" ADD COLUMN "galleryLayout" TEXT NOT NULL DEFAULT 'grid';
ALTER TABLE "Project" ADD COLUMN "galleryCoverUrl" TEXT;

-- AlterTable ProjectGalleryItem
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "focalPoint" TEXT NOT NULL DEFAULT 'center';
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "mediaAssetId" TEXT REFERENCES "MediaAsset"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "ProjectGalleryItem_mediaAssetId_idx" ON "ProjectGalleryItem"("mediaAssetId");

