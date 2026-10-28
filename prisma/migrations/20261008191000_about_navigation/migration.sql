INSERT INTO "NavigationItem" ("id", "labelEn", "labelAr", "url", "visible", "external", "sortOrder")
SELECT 'nav-about', 'About us', 'من نحن', '#about', true, false, 2
WHERE NOT EXISTS (SELECT 1 FROM "NavigationItem" WHERE "url" = '#about');

UPDATE "NavigationItem" SET "sortOrder" = "sortOrder" + 1
WHERE "url" <> '#about' AND "sortOrder" >= 2;
