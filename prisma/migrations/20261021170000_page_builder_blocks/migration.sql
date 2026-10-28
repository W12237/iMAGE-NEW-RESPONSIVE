-- Page builder: every page becomes an ordered list of blocks.
-- Built-in sections get a positioned row; existing custom sections keep their
-- relative order and stay after the built-ins, before the contact form, exactly
-- where they rendered before this change.
ALTER TABLE "PageSection" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CUSTOM';

UPDATE "PageSection" SET "sortOrder" = "sortOrder" + 100;

INSERT OR IGNORE INTO "PageSection" ("id", "page", "kind", "titleEn", "titleAr", "sortOrder", "updatedAt") VALUES
  ('builtin_home_home_hero', 'home', 'HOME_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_home_home_projects', 'home', 'HOME_PROJECTS', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_home_home_living', 'home', 'HOME_LIVING', '', '', 2, CURRENT_TIMESTAMP),
  ('builtin_home_home_stats', 'home', 'HOME_STATS', '', '', 3, CURRENT_TIMESTAMP),
  ('builtin_home_home_journal', 'home', 'HOME_JOURNAL', '', '', 4, CURRENT_TIMESTAMP),
  ('builtin_home_contact_form', 'home', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_about_about_hero', 'about', 'ABOUT_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_about_about_timeline', 'about', 'ABOUT_TIMELINE', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_about_about_blocks', 'about', 'ABOUT_BLOCKS', '', '', 2, CURRENT_TIMESTAMP),
  ('builtin_about_contact_form', 'about', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_history_history_hero', 'history', 'HISTORY_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_history_history_timeline', 'history', 'HISTORY_TIMELINE', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_history_history_stories', 'history', 'HISTORY_STORIES', '', '', 2, CURRENT_TIMESTAMP),
  ('builtin_history_contact_form', 'history', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_developments_developments_hero', 'developments', 'DEVELOPMENTS_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_developments_developments_projects', 'developments', 'DEVELOPMENTS_PROJECTS', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_developments_contact_form', 'developments', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_journal_journal_hero', 'journal', 'JOURNAL_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_journal_journal_list', 'journal', 'JOURNAL_LIST', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_journal_contact_form', 'journal', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_team_team_hero', 'team', 'TEAM_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_team_team_roster', 'team', 'TEAM_ROSTER', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_team_contact_form', 'team', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_partners_partners_hero', 'partners', 'PARTNERS_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_partners_partners_directory', 'partners', 'PARTNERS_DIRECTORY', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_partners_contact_form', 'partners', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_policy_policy_hero', 'policy', 'POLICY_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_policy_policy_body', 'policy', 'POLICY_BODY', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_policy_contact_form', 'policy', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_terms_terms_hero', 'terms', 'TERMS_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_terms_terms_body', 'terms', 'TERMS_BODY', '', '', 1, CURRENT_TIMESTAMP),
  ('builtin_terms_contact_form', 'terms', 'CONTACT_FORM', '', '', 10000, CURRENT_TIMESTAMP),
  ('builtin_contact_contact_hero', 'contact', 'CONTACT_HERO', '', '', 0, CURRENT_TIMESTAMP),
  ('builtin_contact_contact_details', 'contact', 'CONTACT_DETAILS', '', '', 1, CURRENT_TIMESTAMP)
