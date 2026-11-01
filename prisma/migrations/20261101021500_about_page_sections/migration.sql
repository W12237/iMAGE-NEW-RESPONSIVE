-- Add About page dedicated sections (Who We Are, Vision & Mission, Achievements, Leadership) to Homepage model
-- and register them in PageSection for the About page.

INSERT OR IGNORE INTO "PageSection" ("id", "page", "kind", "titleEn", "titleAr", "sortOrder", "updatedAt") VALUES
  ('builtin_about_about_who_we_are', 'about', 'ABOUT_WHO_WE_ARE', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_about_about_vision_mission', 'about', 'ABOUT_VISION_MISSION', '', '', 3, CURRENT_TIMESTAMP),
  ('builtin_about_about_achievements', 'about', 'ABOUT_ACHIEVEMENTS', '', '', 4, CURRENT_TIMESTAMP),
  ('builtin_about_about_leadership', 'about', 'ABOUT_LEADERSHIP', '', '', 5, CURRENT_TIMESTAMP);

UPDATE "PageSection" SET "sortOrder" = 0 WHERE "id" = 'builtin_about_about_hero';
UPDATE "PageSection" SET "sortOrder" = 1 WHERE "id" = 'builtin_about_about_who_we_are';
UPDATE "PageSection" SET "sortOrder" = 2 WHERE "id" = 'builtin_about_about_timeline';
UPDATE "PageSection" SET "sortOrder" = 3 WHERE "id" = 'builtin_about_about_vision_mission';
UPDATE "PageSection" SET "sortOrder" = 4 WHERE "id" = 'builtin_about_about_achievements';
UPDATE "PageSection" SET "sortOrder" = 5 WHERE "id" = 'builtin_about_about_leadership';
UPDATE "PageSection" SET "sortOrder" = 6 WHERE "id" = 'builtin_about_about_blocks';
UPDATE "PageSection" SET "sortOrder" = 7 WHERE "id" = 'builtin_about_contact_form';
