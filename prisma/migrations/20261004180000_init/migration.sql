-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Homepage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'homepage',
    "heroEnabled" BOOLEAN NOT NULL DEFAULT true,
    "heroEyebrowEn" TEXT NOT NULL,
    "heroEyebrowAr" TEXT NOT NULL,
    "heroTitleEn" TEXT NOT NULL,
    "heroTitleAr" TEXT NOT NULL,
    "heroNoteEn" TEXT NOT NULL,
    "heroNoteAr" TEXT NOT NULL,
    "heroDiscoverEn" TEXT NOT NULL,
    "heroDiscoverAr" TEXT NOT NULL,
    "heroMediaUrl" TEXT NOT NULL,
    "heroMediaAltEn" TEXT NOT NULL,
    "heroMediaAltAr" TEXT NOT NULL,
    "storyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "storyEyebrowEn" TEXT NOT NULL,
    "storyEyebrowAr" TEXT NOT NULL,
    "storyTitleEn" TEXT NOT NULL,
    "storyTitleAr" TEXT NOT NULL,
    "storyBodyEn" TEXT NOT NULL,
    "storyBodyAr" TEXT NOT NULL,
    "storyLinkLabelEn" TEXT NOT NULL,
    "storyLinkLabelAr" TEXT NOT NULL,
    "storyLinkUrl" TEXT NOT NULL,
    "storyMediaUrl" TEXT NOT NULL,
    "storyMediaAltEn" TEXT NOT NULL,
    "storyMediaAltAr" TEXT NOT NULL,
    "projectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "projectsHeadingEn" TEXT NOT NULL,
    "projectsHeadingAr" TEXT NOT NULL,
    "projectsExploreEn" TEXT NOT NULL,
    "projectsExploreAr" TEXT NOT NULL,
    "lifestyleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lifestyleEyebrowEn" TEXT NOT NULL,
    "lifestyleEyebrowAr" TEXT NOT NULL,
    "lifestyleTitleEn" TEXT NOT NULL,
    "lifestyleTitleAr" TEXT NOT NULL,
    "lifestyleMediaUrl" TEXT NOT NULL,
    "lifestyleMediaAltEn" TEXT NOT NULL,
    "lifestyleMediaAltAr" TEXT NOT NULL,
    "statsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "statsHeadingEn" TEXT NOT NULL,
    "statsHeadingAr" TEXT NOT NULL,
    "journalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "journalEyebrowEn" TEXT NOT NULL,
    "journalEyebrowAr" TEXT NOT NULL,
    "journalTitleEn" TEXT NOT NULL,
    "journalTitleAr" TEXT NOT NULL,
    "closingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "closingEyebrowEn" TEXT NOT NULL,
    "closingEyebrowAr" TEXT NOT NULL,
    "closingTitleEn" TEXT NOT NULL,
    "closingTitleAr" TEXT NOT NULL,
    "closingCtaEn" TEXT NOT NULL,
    "closingCtaAr" TEXT NOT NULL,
    "closingCtaUrl" TEXT NOT NULL,
    "sectionOrder" TEXT NOT NULL DEFAULT '["story","projects","lifestyle","stats","journal","closing"]',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valueEn" TEXT NOT NULL,
    "valueAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "homepageId" TEXT NOT NULL,
    CONSTRAINT "Stat_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "Homepage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "shortDescriptionEn" TEXT NOT NULL,
    "shortDescriptionAr" TEXT NOT NULL,
    "fullDescriptionEn" TEXT,
    "fullDescriptionAr" TEXT,
    "locationEn" TEXT NOT NULL,
    "locationAr" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "coverImageAltEn" TEXT NOT NULL,
    "coverImageAltAr" TEXT NOT NULL,
    "gallery" TEXT NOT NULL DEFAULT '[]',
    "logoUrl" TEXT,
    "ctaLabelEn" TEXT,
    "ctaLabelAr" TEXT,
    "ctaUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitleEn" TEXT,
    "seoTitleAr" TEXT,
    "seoDescriptionEn" TEXT,
    "seoDescriptionAr" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL,
    "excerptAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "coverImageAltEn" TEXT NOT NULL,
    "coverImageAltAr" TEXT NOT NULL,
    "publicationDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitleEn" TEXT,
    "seoTitleAr" TEXT,
    "seoDescriptionEn" TEXT,
    "seoDescriptionAr" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "siteNameEn" TEXT NOT NULL,
    "siteNameAr" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "addressAr" TEXT NOT NULL,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "copyrightEn" TEXT NOT NULL,
    "copyrightAr" TEXT NOT NULL,
    "defaultSeoTitleEn" TEXT NOT NULL,
    "defaultSeoTitleAr" TEXT NOT NULL,
    "defaultSeoDescriptionEn" TEXT NOT NULL,
    "defaultSeoDescriptionAr" TEXT NOT NULL,
    "defaultOgImageUrl" TEXT,
    "menuMediaUrl" TEXT NOT NULL,
    "menuMediaAltEn" TEXT NOT NULL,
    "menuMediaAltAr" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'IMAGE',
    "altEn" TEXT,
    "altAr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_url_key" ON "MediaAsset"("url");
