CREATE TABLE "TermsPage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'termspage',
    "heroEyebrowEn" TEXT NOT NULL DEFAULT 'Terms',
    "heroEyebrowAr" TEXT NOT NULL DEFAULT 'الشروط',
    "heroTitleEn" TEXT NOT NULL DEFAULT 'Terms of use',
    "heroTitleAr" TEXT NOT NULL DEFAULT 'شروط الاستخدام',
    "heroBodyEn" TEXT NOT NULL DEFAULT 'Please review the terms that apply when using our website and services.',
    "heroBodyAr" TEXT NOT NULL DEFAULT 'يرجى مراجعة الشروط التي تنطبق عند استخدام موقعنا وخدماتنا.',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "TermsSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termsPageId" TEXT NOT NULL DEFAULT 'termspage',
    CONSTRAINT "TermsSection_termsPageId_fkey" FOREIGN KEY ("termsPageId") REFERENCES "TermsPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TermsSection_slug_key" ON "TermsSection"("slug");
CREATE INDEX "TermsSection_termsPageId_sortOrder_idx" ON "TermsSection"("termsPageId", "sortOrder");

CREATE TABLE "ContactPage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'contactpage',
    "heroEyebrowEn" TEXT NOT NULL DEFAULT 'Contact us',
    "heroEyebrowAr" TEXT NOT NULL DEFAULT 'تواصل معنا',
    "heroTitleEn" TEXT NOT NULL DEFAULT 'Start a conversation.',
    "heroTitleAr" TEXT NOT NULL DEFAULT 'ابدأ حواراً معنا.',
    "heroBodyEn" TEXT NOT NULL DEFAULT 'Tell us how we can help and our team will get back to you.',
    "heroBodyAr" TEXT NOT NULL DEFAULT 'أخبرنا كيف يمكننا مساعدتك وسيتواصل معك فريقنا.',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

INSERT INTO "TermsPage" ("id") VALUES ('termspage');
INSERT INTO "ContactPage" ("id") VALUES ('contactpage');
