CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "svgIcon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "globalSettingsId" TEXT NOT NULL DEFAULT 'global',
    CONSTRAINT "SocialLink_globalSettingsId_fkey" FOREIGN KEY ("globalSettingsId") REFERENCES "GlobalSettings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SocialLink_globalSettingsId_sortOrder_idx" ON "SocialLink"("globalSettingsId", "sortOrder");

INSERT INTO "SocialLink" ("id", "name", "url", "svgIcon", "sortOrder", "globalSettingsId")
SELECT 'social-instagram', 'Instagram', "instagramUrl", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>', 0, "id" FROM "GlobalSettings" WHERE "instagramUrl" IS NOT NULL AND "instagramUrl" != '';
INSERT INTO "SocialLink" ("id", "name", "url", "svgIcon", "sortOrder", "globalSettingsId")
SELECT 'social-linkedin', 'LinkedIn', "linkedinUrl", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="9" width="4" height="11"/><circle cx="6" cy="5.5" r="2"/><path d="M12 20V9h4v1.7c1-1.3 2.2-2 3.8-2 2.8 0 4.2 1.8 4.2 5.3v6h-4v-5.3c0-1.7-.6-2.5-1.9-2.5-1.4 0-2.1 1-2.1 3V20z"/></svg>', 1, "id" FROM "GlobalSettings" WHERE "linkedinUrl" IS NOT NULL AND "linkedinUrl" != '';
INSERT INTO "SocialLink" ("id", "name", "url", "svgIcon", "sortOrder", "globalSettingsId")
SELECT 'social-facebook', 'Facebook', "facebookUrl", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a23 23 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2V10H8.2v3H11v8z"/></svg>', 2, "id" FROM "GlobalSettings" WHERE "facebookUrl" IS NOT NULL AND "facebookUrl" != '';
