CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'TEXT',
    "eyebrowEn" TEXT NOT NULL DEFAULT '',
    "eyebrowAr" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "bodyAr" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "imageAltEn" TEXT NOT NULL DEFAULT '',
    "imageAltAr" TEXT NOT NULL DEFAULT '',
    "ctaLabelEn" TEXT NOT NULL DEFAULT '',
    "ctaLabelAr" TEXT NOT NULL DEFAULT '',
    "ctaUrl" TEXT,
    "backgroundRgb" TEXT NOT NULL DEFAULT '255, 255, 255',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "PageSection_page_visible_sortOrder_idx" ON "PageSection"("page", "visible", "sortOrder");
