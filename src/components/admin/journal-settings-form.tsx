"use client";

import type { JournalPageSettings, NewsArticle } from "@prisma/client";
import { saveJournalSettings } from "@/app/admin/actions";
import { ActionForm } from "./action-form";
import { Bilingual, Check, Field } from "./fields";

export function JournalSettingsForm({
  settings,
  articles,
}: {
  settings: JournalPageSettings;
  articles: NewsArticle[];
}) {
  return (
    <ActionForm action={saveJournalSettings} className="admin-form">
      {/* 1. Page Title & Intro */}
      <section className="panel">
        <h2>Journal Page Header & Intro</h2>
        <Bilingual
          base="title"
          label="Page Title"
          en={settings.titleEn}
          ar={settings.titleAr}
          required
        />
        <Bilingual
          base="intro"
          label="Introduction Text"
          en={settings.introEn}
          ar={settings.introAr}
          textarea
          required
        />

        <div className="bilingual">
          <Field
            name="heroImageUrl"
            label="Optional Hero Image URL"
            value={settings.heroImageUrl ?? ""}
            placeholder="https://..."
          />
          <label>
            Hero Image Focal Point
            <select name="heroFocalPoint" defaultValue={settings.heroFocalPoint ?? "center"}>
              <option value="center">Center / وسط</option>
              <option value="top">Top / أعلى</option>
              <option value="bottom">Bottom / أسفل</option>
              <option value="left">Left / يسار</option>
              <option value="right">Right / يمين</option>
            </select>
          </label>
        </div>

        <Bilingual
          base="heroImageAlt"
          label="Hero Image Alt Text"
          en={settings.heroImageAltEn ?? ""}
          ar={settings.heroImageAltAr ?? ""}
        />
      </section>

      {/* 2. Editorial Feed & Featured Selection */}
      <section className="panel">
        <h2>Editorial Feed Settings</h2>
        <div className="bilingual">
          <label>
            Featured Article (Top of Feed)
            <select
              name="featuredArticleId"
              defaultValue={settings.featuredArticleId ?? ""}
            >
              <option value="">(Automatic Latest Published Article)</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titleEn} ({a.category} - {a.status})
                </option>
              ))}
            </select>
          </label>

          <Field
            name="articlesPerPage"
            label="Articles Per Batch (Load More)"
            type="number"
            value={settings.articlesPerPage}
            required
          />
        </div>

        <Field
          name="categoryOrder"
          label="Category Display Order (Comma Separated)"
          value={settings.categoryOrder}
          placeholder="ALL,NEWS,EVENTS,CONSTRUCTION"
          required
        />
      </section>

      {/* 3. Recent Articles Sidebar */}
      <section className="panel">
        <h2>Recent Articles Sidebar</h2>
        <Check
          name="sidebarEnabled"
          label="Show Recent Articles Sidebar on Desktop/Tablet"
          checked={settings.sidebarEnabled}
        />

        <Bilingual
          base="sidebarHeading"
          label="Sidebar Heading"
          en={settings.sidebarHeadingEn}
          ar={settings.sidebarHeadingAr}
        />

        <div className="bilingual">
          <label>
            Sidebar Selection Mode
            <select name="sidebarMode" defaultValue={settings.sidebarMode}>
              <option value="AUTO">AUTO (Latest Published Articles)</option>
              <option value="MANUAL">MANUAL (Curated Article IDs)</option>
            </select>
          </label>

          <Field
            name="sidebarItemCount"
            label="Maximum Items to Display"
            type="number"
            value={settings.sidebarItemCount}
            required
          />
        </div>

        <Field
          name="sidebarArticleIds"
          label='Manual Article IDs (JSON array, e.g. ["id1", "id2"] when mode is MANUAL)'
          value={settings.sidebarArticleIds}
          placeholder='["cuid1", "cuid2"]'
        />
      </section>

      {/* 4. Restrained Closing CTA */}
      <section className="panel">
        <h2>Closing Section Call to Action</h2>
        <Check
          name="closingCtaEnabled"
          label="Show Closing CTA Section"
          checked={settings.closingCtaEnabled}
        />

        <Bilingual
          base="closingCtaHeading"
          label="CTA Heading"
          en={settings.closingCtaHeadingEn}
          ar={settings.closingCtaHeadingAr}
        />

        <Bilingual
          base="closingCtaText"
          label="CTA Supporting Sentence"
          en={settings.closingCtaTextEn}
          ar={settings.closingCtaTextAr}
          textarea
        />

        <div className="bilingual">
          <Bilingual
            base="closingCtaButton"
            label="Primary Button Label"
            en={settings.closingCtaButtonEn}
            ar={settings.closingCtaButtonAr}
          />
        </div>

        <div className="bilingual">
          <Field
            name="closingCtaLink"
            label="Primary Button Link (e.g. /projects)"
            value={settings.closingCtaLink}
            required
          />
          <Check
            name="closingCtaSecondary"
            label="Enable Secondary 'Request a Call Back' Button (opens shared enquiry popup)"
            checked={settings.closingCtaSecondary}
          />
        </div>
      </section>

      {/* 5. SEO & Social Metadata */}
      <section className="panel">
        <h2>SEO & Social Sharing</h2>
        <Bilingual
          base="seoTitle"
          label="SEO Title"
          en={settings.seoTitleEn}
          ar={settings.seoTitleAr}
        />
        <Bilingual
          base="seoDescription"
          label="SEO Meta Description"
          en={settings.seoDescriptionEn}
          ar={settings.seoDescriptionAr}
          textarea
        />
        <Field
          name="ogImageUrl"
          label="Social Share Image (OG Image URL)"
          value={settings.ogImageUrl ?? ""}
          placeholder="https://..."
        />
      </section>
    </ActionForm>
  );
}
