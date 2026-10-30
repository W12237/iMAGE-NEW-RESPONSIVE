import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { deleteProject, saveProjectsCollectionSettings, saveProjectsHero } from "../../actions";
import { DeleteActionButton } from "@/components/admin/delete-action-button";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual, Check } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { ProjectListManager } from "@/components/admin/project-list-manager";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [items, home, images] = await Promise.all([
    prisma.project.findMany({
      include: { visualTours: true },
      orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } }),
    prisma.mediaAsset.findMany({
      where: { kind: "IMAGE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, filename: true, mimeType: true, size: true, kind: true },
    }),
  ]);

  const publishedCount = items.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = items.filter((p) => p.status === "DRAFT").length;

  return (
    <>
      <header className="page-head">
        <div>
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/admin">CMS</Link>
            <span className="sep">/</span>
            <strong>Projects</strong>
          </nav>
          <h1>Projects Portfolio</h1>
          <span>
            Manage public developments, architectural imagery, localized summaries, and featured presentation order.
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="secondary" href="/en/projects" target="_blank">
            View Live Page ↗
          </Link>
          <Link className="primary" href="/admin/projects/new">
            + New Project
          </Link>
        </div>
      </header>

      {/* Projects Collection & Cards Section Settings Panel */}
      <section className="panel" style={{ marginBottom: "28px" }}>
        <ActionForm action={saveProjectsCollectionSettings} className="admin-form" submitLabel="Save Projects Collection Settings">
          <div className="section-title">
            <div>
              <h2>Projects Collection & Listing Section</h2>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Control section visibility, bilingual heading (&quot;Projects&quot; / &quot;المشاريع&quot;), optional introduction, default CTA action label, and portfolio presentation order.
              </span>
            </div>
            <Check name="projectsEnabled" label="Section Visible" checked={home.projectsEnabled} />
          </div>

          <Bilingual
            base="projectsHeading"
            label="Section Heading"
            en={home.projectsHeadingEn || "Projects"}
            ar={home.projectsHeadingAr || "المشاريع"}
            required
          />

          <Bilingual
            base="projectsDescription"
            label="Optional Section Introduction / Supporting Note"
            en={home.projectsDescriptionEn || ""}
            ar={home.projectsDescriptionAr || ""}
            textarea
          />

          <Bilingual
            base="projectsExplore"
            label="Default Project Card Action Label"
            en={home.projectsExploreEn || "View Project"}
            ar={home.projectsExploreAr || "عرض المشروع"}
            required
          />

          {/* Quick Display Order & Featured Manager */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
              Project Presentation &amp; Display Order
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
              Toggle featured priority, set numerical order (0 = top priority), and adjust publication status for all portfolio items.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((project) => (
                <div
                  key={project.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 130px 100px 110px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#fbfcfb",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                  }}
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <div style={{ width: "48px", height: "34px", position: "relative", borderRadius: "4px", overflow: "hidden", background: "#e0e7e1" }}>
                    {project.coverImageUrl && (
                      <Image src={project.coverImageUrl} alt={project.nameEn} fill style={{ objectFit: "cover" }} sizes="48px" />
                    )}
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block" }}>{project.nameEn}</strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{project.locationEn}</span>
                  </div>
                  <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", margin: 0, cursor: "pointer" }}>
                    <input type="checkbox" name={`projectFeatured_${project.id}`} defaultChecked={project.featured} />
                    <span>Featured</span>
                  </label>
                  <div>
                    <label htmlFor={`order-${project.id}`} style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "2px" }}>Order</label>
                    <input
                      id={`order-${project.id}`}
                      type="number"
                      name={`projectOrder_${project.id}`}
                      defaultValue={project.featuredOrder}
                      style={{ width: "70px", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
                    />
                  </div>
                  <div>
                    <label htmlFor={`status-${project.id}`} style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "2px" }}>Status</label>
                    <select
                      id={`status-${project.id}`}
                      name={`projectStatus_${project.id}`}
                      defaultValue={project.status}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ActionForm>
      </section>

      {/* Projects Page Hero Settings Panel */}
      <section className="panel" style={{ marginBottom: "28px" }}>
        <ActionForm action={saveProjectsHero} className="admin-form" submitLabel="Save Projects Hero">
          <div className="section-title">
            <div>
              <h2>Projects Page Architectural Hero</h2>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Control the full-width architectural opening, localized headline, introduction, and CTA actions for the Projects page.
              </span>
            </div>
            <Check name="projectsHeroEnabled" label="Hero Visible" checked={home.projectsHeroEnabled} />
          </div>

          <Bilingual base="projectsHeroEyebrow" label="Breadcrumb / Eyebrow Label" en={home.projectsHeroEyebrowEn} ar={home.projectsHeroEyebrowAr} />
          <Bilingual base="projectsHeroTitle" label="Main Heading (H1)" en={home.projectsHeroTitleEn} ar={home.projectsHeroTitleAr} required />
          <Bilingual base="projectsHeroDescription" label="Introduction / Supporting Description" en={home.projectsHeroDescriptionEn} ar={home.projectsHeroDescriptionAr} textarea required />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            <MediaField name="projectsHeroImageUrl" label="Desktop Hero Background Image" value={home.projectsHeroImageUrl || undefined} assets={images} kind="IMAGE" />
            <MediaField name="projectsHeroMobileImageUrl" label="Mobile Hero Background Image (Optional)" value={home.projectsHeroMobileImageUrl || undefined} assets={images} kind="IMAGE" />
          </div>

          <div className="field-group" style={{ marginTop: "12px" }}>
            <label htmlFor="projectsHeroFocalPoint" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
              Image Focal Point
            </label>
            <select
              id="projectsHeroFocalPoint"
              name="projectsHeroFocalPoint"
              defaultValue={home.projectsHeroFocalPoint || "center"}
              style={{ width: "100%", maxWidth: "320px", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--line)" }}
            >
              <option value="center">Center (Balanced)</option>
              <option value="top">Top (Architecture Roofline)</option>
              <option value="bottom">Bottom (Landscape / Ground)</option>
              <option value="left">Left (Focal Subject on Left)</option>
              <option value="right">Right (Focal Subject on Right)</option>
            </select>
          </div>

          <Bilingual base="projectsHeroImageAlt" label="Image Alt / Description" en={home.projectsHeroImageAltEn} ar={home.projectsHeroImageAltAr} />
          <Bilingual base="projectsHeroPrimaryCta" label="Primary CTA Label (Scrolls to Collection)" en={home.projectsHeroPrimaryCtaEn} ar={home.projectsHeroPrimaryCtaAr} required />
          <Bilingual base="projectsHeroSecondaryCta" label="Secondary CTA Label (Opens Enquiry Popup)" en={home.projectsHeroSecondaryCtaEn} ar={home.projectsHeroSecondaryCtaAr} required />

          {/* Projects Page Cinematic Reload / Opening Animation Settings */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
                  Cinematic Reload &amp; Opening Animation
                </h3>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Play the signature full-screen architectural montage when visitors reload or open the Projects page (customizable headline &amp; toggle).
                </span>
              </div>
              <Check name="projectsOpeningEnabled" label="Active on Page Reload" checked={home.projectsOpeningEnabled ?? true} />
            </div>

            <Bilingual
              base="projectsOpeningHeadline"
              label="Opening Animation Headline / Subtitle"
              en={home.projectsOpeningHeadlineEn || "Our Portfolio"}
              ar={home.projectsOpeningHeadlineAr || "محفظة المشاريع"}
              required
            />
          </div>
        </ActionForm>
      </section>

      {/* Portfolio Quick Summary Bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          marginBottom: "20px",
          padding: "14px 20px",
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line)",
          fontSize: "13px",
          color: "var(--muted)",
        }}
      >
        <span>
          Total: <strong style={{ color: "var(--ink)" }}>{items.length}</strong>
        </span>
        <span style={{ color: "var(--line)" }}>•</span>
        <span>
          Published: <strong style={{ color: "#185b2a" }}>{publishedCount}</strong>
        </span>
        <span style={{ color: "var(--line)" }}>•</span>
        <span>
          Drafts: <strong style={{ color: "#854d0e" }}>{draftCount}</strong>
        </span>
      </div>

      <ProjectListManager items={items} />
    </>
  );
}
