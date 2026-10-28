"use client";

import React, { useState } from "react";
import type { NewsArticle } from "@prisma/client";
import { saveNews } from "@/app/admin/actions";
import { ActionForm } from "./action-form";
import { Bilingual, Check, Field } from "./fields";

export interface ProjectOption {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  coverImageUrl?: string;
  locationEn?: string;
  locationAr?: string;
  projectType?: string;
  progressStatus?: string;
  status?: string;
}

export interface ArticleOption {
  id: string;
  titleEn: string;
  slug: string;
}

export function NewsForm({
  item,
  projects = [],
  availableArticles = [],
}: {
  item?: NewsArticle;
  projects?: ProjectOption[];
  availableArticles?: ArticleOption[];
}) {
  const [ctaEnabled, setCtaEnabled] = useState(Boolean(item?.ctaEnabled));
  const [selectedCategory, setSelectedCategory] = useState(item?.category ?? "NEWS");

  // Initial related article IDs
  const initialRelated: string[] = (() => {
    try {
      if (item?.relatedArticleIds) {
        const parsed = JSON.parse(item.relatedArticleIds);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  })();

  const [relatedIds, setRelatedIds] = useState<string[]>(initialRelated);

  const toggleRelated = (id: string) => {
    setRelatedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Other Projects Sidebar state
  const [sidebarEnabled, setSidebarEnabled] = useState(
    item?.sidebarProjectsEnabled ?? true
  );
  const [sidebarMode, setSidebarMode] = useState<"AUTO" | "MANUAL">(
    (item?.sidebarProjectsMode === "MANUAL" ? "MANUAL" : "AUTO")
  );

  const initialSidebarProjectIds: string[] = (() => {
    try {
      if (item?.sidebarProjectIds) {
        const parsed = JSON.parse(item.sidebarProjectIds);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  })();

  const [sidebarProjectIds, setSidebarProjectIds] = useState<string[]>(
    initialSidebarProjectIds
  );
  const [projectSearch, setProjectSearch] = useState("");

  const addSidebarProject = (id: string) => {
    if (!sidebarProjectIds.includes(id)) {
      setSidebarProjectIds((prev) => [...prev, id]);
    }
  };

  const removeSidebarProject = (id: string) => {
    setSidebarProjectIds((prev) => prev.filter((x) => x !== id));
  };

  const moveSidebarProject = (index: number, direction: "up" | "down") => {
    const newArr = [...sidebarProjectIds];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setSidebarProjectIds(newArr);
  };

  return (
    <ActionForm action={saveNews} className="admin-form">
      <input type="hidden" name="id" value={item?.id} />
      <input type="hidden" name="relatedArticleIds" value={JSON.stringify(relatedIds)} />
      <input type="hidden" name="sidebarProjectIds" value={JSON.stringify(sidebarProjectIds)} />

      {item?.slug && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>Secure Preview:</span>
          <a
            href={`/en/journal/${item.slug}?preview=true`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "12.5px",
              padding: "6px 14px",
              borderRadius: "16px",
              background: "rgba(27, 56, 43, 0.08)",
              color: "var(--forest)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Preview English Draft ↗
          </a>
          <a
            href={`/ar/journal/${item.slug}?preview=true`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "12.5px",
              padding: "6px 14px",
              borderRadius: "16px",
              background: "rgba(27, 56, 43, 0.08)",
              color: "var(--forest)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            معاينة المسودة بالعربية ↗
          </a>
        </div>
      )}

      {/* 1. CONTENT GROUP */}
      <section className="panel">
        <h2>1. Content</h2>
        <div className="bilingual">
          <Field name="slug" label="URL Slug" value={item?.slug} required />
          <label>
            Category
            <select
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="NEWS">News / أخبار</option>
              <option value="EVENTS">Events / فعاليات</option>
              <option value="CONSTRUCTION">Construction Update / تحديثات الإنشاء</option>
              <option value="ARCHITECTURE">Architecture / عمارة وتصميم</option>
            </select>
          </label>
        </div>

        <Bilingual base="title" label="Title (H1)" en={item?.titleEn} ar={item?.titleAr} required />
        <Bilingual
          base="excerpt"
          label="Standfirst / Summary (2-3 sentences introducing the article)"
          en={item?.excerptEn}
          ar={item?.excerptAr}
          textarea
          required
        />

        <div style={{ margin: "16px 0 8px 0" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>
            <strong>Supported editorial blocks in body:</strong>
            {" "}<code>## Heading 2</code>, <code>### Heading 3</code>, <code>&gt; Quote</code>, <code>- List item</code>, <code>{'![Alt](url "Caption | Credit")'}</code>, <code>[[two-images: url1 | alt1 | cap1 ; url2 | alt2 | cap2]]</code>, <code>[[video: url | caption]]</code>, <code>[[project]]</code>, <code>[[cta: Title | Text | ButtonLabel | Link]]</code>.
          </div>
          <Bilingual
            base="content"
            label="Article Body (Editorial Content Blocks or Structured Markdown)"
            en={item?.contentEn}
            ar={item?.contentAr}
            textarea
            required
          />
        </div>

        <div className="bilingual">
          <Bilingual
            base="author"
            label="Public author (leave empty if none; internal accounts are suppressed automatically)"
            en={item?.authorEn ?? ""}
            ar={item?.authorAr ?? ""}
          />
        </div>

        <Field
          name="tags"
          label='Tags (Optional JSON array, e.g. ["architecture", "new-cairo"])'
          value={item?.tags ?? "[]"}
          placeholder='["architecture", "cairo"]'
        />
      </section>

      {/* 2. MEDIA GROUP */}
      <section className="panel">
        <h2>2. Media & Visuals</h2>
        <div className="bilingual">
          <Field name="coverImageUrl" label="Cover Image URL" value={item?.coverImageUrl} required />
          <label>
            Cover Image Focal Point
            <select name="focalPoint" defaultValue={item?.focalPoint ?? "center"}>
              <option value="center">Center / وسط</option>
              <option value="top">Top / أعلى</option>
              <option value="bottom">Bottom / أسفل</option>
              <option value="left">Left / يسار</option>
              <option value="right">Right / يمين</option>
            </select>
          </label>
        </div>

        <Bilingual base="coverImageAlt" label="Cover Image Alt Text" en={item?.coverImageAltEn} ar={item?.coverImageAltAr} />
        <Bilingual base="coverCaption" label="Cover Image Caption (Optional)" en={item?.coverCaptionEn ?? ""} ar={item?.coverCaptionAr ?? ""} />
        <Bilingual base="coverCredit" label="Cover Image Credit / Photographer (Optional)" en={item?.coverCreditEn ?? ""} ar={item?.coverCreditAr ?? ""} />

        <div className="bilingual">
          <Field
            name="videoUrl"
            label="Featured / Embedded Video URL (YouTube, Vimeo, or MP4)"
            value={item?.videoUrl ?? ""}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <Field
            name="gallery"
            label="Additional Image URLs (JSON Array)"
            value={item?.gallery ?? "[]"}
            placeholder='["https://...", "https://..."]'
          />
        </div>
      </section>

      {/* 3. PROJECT CONNECTIONS */}
      <section className="panel">
        <h2>3. Project Connections</h2>
        <div className="bilingual">
          <label>
            Associated Project
            <select name="projectId" defaultValue={item?.projectId ?? ""}>
              <option value="">None / ليس مرتبطاً بمشروع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} — {p.nameAr}
                </option>
              ))}
            </select>
          </label>

          <Field
            name="constructionDate"
            label="Construction Update Date (For construction milestones, distinct from publish date)"
            type="date"
            value={item?.constructionDate ? new Date(item.constructionDate).toISOString().slice(0, 10) : ""}
          />
        </div>

        <Check
          name="showRelatedProject"
          label="Display Related Project spotlight card at the bottom of the article"
          checked={item?.showRelatedProject ?? true}
        />
      </section>

      {/* 4. ARTICLE PRESENTATION & CTAS */}
      <section className="panel">
        <h2>4. Article Presentation</h2>
        <Check
          name="showTableOfContents"
          label="Generate and display compact Table of Contents for longer articles (2+ headings)"
          checked={item?.showTableOfContents ?? false}
        />

        {availableArticles.length > 0 && (
          <div style={{ marginTop: "18px", marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Curated Related Articles (Select up to 3 manually, or leave empty for smart auto-matching):
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
              {availableArticles.map((art) => {
                const checked = relatedIds.includes(art.id);
                return (
                  <label
                    key={art.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: checked ? "rgba(27, 56, 43, 0.08)" : "transparent",
                      border: "1px solid rgba(27, 56, 43, 0.12)",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRelated(art.id)}
                    />
                    <span>{art.titleEn}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(27, 56, 43, 0.1)", paddingTop: "16px", marginTop: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
            <input
              type="checkbox"
              name="ctaEnabled"
              checked={ctaEnabled}
              onChange={(e) => setCtaEnabled(e.target.checked)}
            />
            <span>Include Standalone Contextual Call to Action block</span>
          </label>

          {ctaEnabled && (
            <div style={{ marginTop: "14px" }}>
              <Bilingual base="ctaHeading" label="CTA Heading" en={item?.ctaHeadingEn ?? "Register Your Interest"} ar={item?.ctaHeadingAr ?? "سجل اهتمامك"} />
              <Bilingual base="ctaText" label="CTA Description" en={item?.ctaTextEn ?? "Speak with our advisors to explore bespoke living opportunities."} ar={item?.ctaTextAr ?? "تواصل مع مستشارينا لمعرفة المزيد عن مشاريعنا."} textarea />
              <div className="bilingual">
                <Bilingual base="ctaButton" label="CTA Button Label" en={item?.ctaButtonEn ?? "Register Interest"} ar={item?.ctaButtonAr ?? "سجل الآن"} />
                <label>
                  Action Type
                  <select name="ctaActionType" defaultValue={item?.ctaActionType ?? "ENQUIRY"}>
                    <option value="ENQUIRY">Open Enquiry Modal / فتح نموذج الاستفسار</option>
                    <option value="LINK">Navigate to Custom Link / الانتقال إلى رابط</option>
                  </select>
                </label>
              </div>
              <Field name="ctaLink" label="Custom Link (if Action Type is Link)" value={item?.ctaLink ?? ""} placeholder="/projects" />
            </div>
          )}
        </div>
      </section>

      {/* 5. OTHER PROJECTS SIDEBAR */}
      <section className="panel">
        <h2>5. Other Projects Sidebar (Physical Left Column)</h2>
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
          Configure the dedicated “Other Projects” sidebar rendered on the physical left of this article detail page.
        </p>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, marginBottom: "16px" }}>
          <input
            type="checkbox"
            name="sidebarProjectsEnabled"
            checked={sidebarEnabled}
            onChange={(e) => setSidebarEnabled(e.target.checked)}
          />
          <span>Enable “Other Projects” sidebar on this article</span>
        </label>

        {sidebarEnabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Bilingual
              base="sidebarProjectsHeading"
              label="Sidebar Heading"
              en={item?.sidebarProjectsHeadingEn ?? "Other Projects"}
              ar={item?.sidebarProjectsHeadingAr ?? "مشروعات أخرى"}
            />

            <div className="bilingual">
              <label>
                Selection Mode
                <select
                  name="sidebarProjectsMode"
                  value={sidebarMode}
                  onChange={(e) => setSidebarMode(e.target.value as "AUTO" | "MANUAL")}
                >
                  <option value="AUTO">Automatic (Published featured projects, excluding article project)</option>
                  <option value="MANUAL">Manual (Curate and order specific projects below)</option>
                </select>
              </label>

              <label>
                Maximum Projects Displayed (2–4)
                <select
                  name="sidebarProjectsCount"
                  defaultValue={item?.sidebarProjectsCount ?? 3}
                >
                  <option value={2}>2 Projects</option>
                  <option value={3}>3 Projects (Recommended)</option>
                  <option value={4}>4 Projects</option>
                </select>
              </label>
            </div>

            <div className="bilingual" style={{ gap: "24px" }}>
              <Check
                name="sidebarShowLocation"
                label="Show Project Location in card"
                checked={item?.sidebarShowLocation ?? true}
              />
              <Check
                name="sidebarShowType"
                label="Show Project Type badge (e.g. Residential)"
                checked={item?.sidebarShowType ?? true}
              />
              <Check
                name="sidebarShowStatus"
                label="Show Progress Status badge (e.g. Ongoing)"
                checked={item?.sidebarShowStatus ?? true}
              />
            </div>

            <Bilingual
              base="sidebarViewAllLabel"
              label="View All Projects Link Label"
              en={item?.sidebarViewAllLabelEn ?? "View All Projects"}
              ar={item?.sidebarViewAllLabelAr ?? "عرض جميع المشروعات"}
            />

            {/* Searchable Project Selector with Thumbnails */}
            {sidebarMode === "MANUAL" && (
              <div style={{ marginTop: "12px", border: "1px solid rgba(27, 56, 43, 0.12)", borderRadius: "8px", padding: "16px", background: "rgba(27, 56, 43, 0.02)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--forest)" }}>
                  Curated Projects &amp; Display Order ({sidebarProjectIds.length} selected):
                </h4>

                {sidebarProjectIds.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {sidebarProjectIds.map((pId, idx) => {
                      const p = projects.find((x) => x.id === pId);
                      if (!p) return null;
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "#ffffff",
                            border: "1px solid rgba(27, 56, 43, 0.12)",
                            borderRadius: "6px",
                            gap: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)", width: "20px" }}>
                              #{idx + 1}
                            </span>
                            {p.coverImageUrl && (
                              <img
                                src={p.coverImageUrl}
                                alt={p.nameEn}
                                style={{ width: "48px", height: "32px", objectFit: "cover", borderRadius: "4px" }}
                              />
                            )}
                            <div>
                              <strong style={{ fontSize: "13.5px", color: "var(--forest)" }}>{p.nameEn}</strong>
                              <span style={{ fontSize: "12px", color: "var(--muted)", marginInlineStart: "8px" }}>
                                ({p.nameAr}) • {p.locationEn || ""}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => moveSidebarProject(idx, "up")}
                              disabled={idx === 0}
                              style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc", background: idx === 0 ? "#f5f5f5" : "#fff", cursor: idx === 0 ? "default" : "pointer" }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSidebarProject(idx, "down")}
                              disabled={idx === sidebarProjectIds.length - 1}
                              style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc", background: idx === sidebarProjectIds.length - 1 ? "#f5f5f5" : "#fff", cursor: idx === sidebarProjectIds.length - 1 ? "default" : "pointer" }}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSidebarProject(p.id)}
                              style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ffcccc", background: "#fff0f0", color: "#c00", cursor: "pointer" }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic", margin: "0 0 16px 0" }}>
                    No projects selected yet. Use the searchable selector below to add projects.
                  </p>
                )}

                <div style={{ borderTop: "1px solid rgba(27, 56, 43, 0.08)", paddingTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "6px" }}>
                    Search &amp; Add Published Projects:
                  </label>
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search by project name or location..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(27, 56, 43, 0.2)",
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                    {projects
                      .filter((p) => {
                        if (sidebarProjectIds.includes(p.id)) return false;
                        if (!projectSearch.trim()) return true;
                        const q = projectSearch.toLowerCase();
                        return (
                          p.nameEn.toLowerCase().includes(q) ||
                          p.nameAr.toLowerCase().includes(q) ||
                          (p.locationEn && p.locationEn.toLowerCase().includes(q))
                        );
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            background: "#ffffff",
                            border: "1px solid rgba(27, 56, 43, 0.1)",
                            borderRadius: "6px",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                            {p.coverImageUrl && (
                              <img
                                src={p.coverImageUrl}
                                alt={p.nameEn}
                                style={{ width: "36px", height: "26px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }}
                              />
                            )}
                            <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--forest)" }}>{p.nameEn}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addSidebarProject(p.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              borderRadius: "4px",
                              border: "1px solid rgba(27, 56, 43, 0.2)",
                              background: "rgba(27, 56, 43, 0.06)",
                              color: "var(--forest)",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. PUBLISHING STATUS */}
      <section className="panel">
        <h2>6. Publishing</h2>
        <div className="bilingual">
          <label>
            Publishing Status
            <select name="status" defaultValue={item?.status ?? "DRAFT"}>
              <option value="DRAFT">DRAFT (Drafts are excluded from public routes)</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED (Archived articles are hidden from public)</option>
            </select>
          </label>

          <Field
            name="publicationDate"
            label="Publication Date"
            type="date"
            value={(item?.publicationDate ?? new Date()).toISOString().slice(0, 10)}
            required
          />
        </div>

        <div className="bilingual">
          <Field name="featuredOrder" label="Featured Order (Numeric)" type="number" value={item?.featuredOrder ?? 0} />
          <div style={{ paddingTop: "26px" }}>
            <Check name="featured" label="Pin as Featured Article in Journal Feed" checked={item?.featured} />
          </div>
        </div>
      </section>

      {/* 7. SEO & SOCIAL SHARE */}
      <section className="panel">
        <h2>7. SEO & Metadata</h2>
        <Bilingual base="seoTitle" label="SEO Title Tag" en={item?.seoTitleEn ?? ""} ar={item?.seoTitleAr ?? ""} />
        <Bilingual
          base="seoDescription"
          label="Meta Description"
          en={item?.seoDescriptionEn ?? ""}
          ar={item?.seoDescriptionAr ?? ""}
          textarea
        />
        <Field name="ogImageUrl" label="Social Sharing (OG) Image URL" value={item?.ogImageUrl ?? ""} />
      </section>
    </ActionForm>
  );
}
