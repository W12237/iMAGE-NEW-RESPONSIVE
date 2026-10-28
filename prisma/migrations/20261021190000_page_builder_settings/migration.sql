-- Per-section style settings (font sizes, label overrides) for the page builder.
ALTER TABLE "PageSection" ADD COLUMN "settings" TEXT NOT NULL DEFAULT '{}';
