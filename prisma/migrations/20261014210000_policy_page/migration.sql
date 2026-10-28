CREATE TABLE "PolicyPage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'policypage',
    "heroEyebrowEn" TEXT NOT NULL DEFAULT 'Legal',
    "heroEyebrowAr" TEXT NOT NULL DEFAULT 'قانوني',
    "heroTitleEn" TEXT NOT NULL DEFAULT 'Our commitments to you.',
    "heroTitleAr" TEXT NOT NULL DEFAULT 'التزاماتنا تجاهك.',
    "heroBodyEn" TEXT NOT NULL DEFAULT 'Read our policies to understand how we operate and protect your rights as a visitor and client.',
    "heroBodyAr" TEXT NOT NULL DEFAULT 'اقرأ سياساتنا لتفهم كيف نعمل ونحمي حقوقك كزائر وعميل.',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "PolicyDocument" (
    "id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "titleEn" TEXT NOT NULL, "titleAr" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL DEFAULT '', "summaryAr" TEXT NOT NULL DEFAULT '', "contentEn" TEXT NOT NULL, "contentAr" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyPageId" TEXT NOT NULL DEFAULT 'policypage',
    CONSTRAINT "PolicyDocument_policyPageId_fkey" FOREIGN KEY ("policyPageId") REFERENCES "PolicyPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PolicyDocument_slug_key" ON "PolicyDocument"("slug");
CREATE INDEX "PolicyDocument_policyPageId_sortOrder_idx" ON "PolicyDocument"("policyPageId", "sortOrder");
