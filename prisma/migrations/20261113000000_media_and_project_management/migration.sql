-- Non-destructive migration for MediaAsset, Project, and ProjectGalleryItem
-- AlterTable MediaAsset
ALTER TABLE "MediaAsset" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "width" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "height" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "duration" REAL;
ALTER TABLE "MediaAsset" ADD COLUMN "posterUrl" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "focalPoint" TEXT DEFAULT 'center';
ALTER TABLE "MediaAsset" ADD COLUMN "captionEn" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "captionAr" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'READY';

-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN "heroVideoPosterUrl" TEXT;

-- AlterTable ProjectGalleryItem
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "isVideo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "ProjectGalleryItem" ADD COLUMN "posterUrl" TEXT;

