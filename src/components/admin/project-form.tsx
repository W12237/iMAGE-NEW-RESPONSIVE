"use client";

import type { Project } from "@prisma/client";
import { saveProject, type UploadedMedia } from "@/app/admin/actions";
import { ActionForm } from "./action-form";
import { Bilingual, Check, Field } from "./fields";
import { MediaField } from "./media-field";

function galleryImages(item?: Project) {
  try {
    const parsed = JSON.parse(item?.gallery ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((image): image is string => typeof image === "string").slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

export function ProjectForm({ item, assets }: { item?: Project; assets: UploadedMedia[] }) {
  const gallery = galleryImages(item);

  return (
    <ActionForm action={saveProject} className="admin-form">
      <input type="hidden" name="id" value={item?.id} />

      {/* Basic Settings */}
      <section className="panel">
        <h2>Core Information</h2>
        <div className="bilingual">
          <Field name="slug" label="Slug (URL path)" value={item?.slug} required />
          <label>
            Status
            <select name="status" defaultValue={item?.status ?? "DRAFT"}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        </div>

        <div className="bilingual">
          <label>
            Project Type
            <select name="projectType" defaultValue={item?.projectType ?? "Residential"}>
              <option value="Residential">Residential / سكني</option>
              <option value="Commercial">Commercial / تجاري</option>
              <option value="Medical">Medical / طبي</option>
            </select>
          </label>
          <label>
            Progress Status
            <select name="progressStatus" defaultValue={item?.progressStatus ?? "Ongoing"}>
              <option value="Ongoing">Ongoing / قيد الإنشاء</option>
              <option value="Delivered">Delivered / تم التسليم</option>
              <option value="Upcoming">Upcoming / قريباً</option>
            </select>
          </label>
        </div>

        <Bilingual base="name" label="Project name" en={item?.nameEn} ar={item?.nameAr} required />
        <Bilingual base="location" label="Location" en={item?.locationEn} ar={item?.locationAr} required />
        <Bilingual base="shortDescription" label="Short description" en={item?.shortDescriptionEn} ar={item?.shortDescriptionAr} required />

        <div className="bilingual">
          <MediaField name="coverImageUrl" label="Cover / Main Hero Image" value={item?.coverImageUrl} assets={assets} kind="IMAGE" required />
          <MediaField name="logoUrl" label="Project Logo (Optional)" value={item?.logoUrl ?? ""} assets={assets} kind="IMAGE" />
        </div>

        <div className="bilingual">
          <label>
            Cover Image Focal Point
            <select name="coverImageFocalPoint" defaultValue={(item as any)?.coverImageFocalPoint ?? "center"}>
              <option value="center">Center (Balanced)</option>
              <option value="top">Top (Architecture roofline)</option>
              <option value="bottom">Bottom (Ground / landscape)</option>
              <option value="left">Left (Subject on left)</option>
              <option value="right">Right (Subject on right)</option>
            </select>
          </label>
          <Field name="ctaUrl" label="Custom Project Action URL (Optional, defaults to /[locale]/projects/[slug])" value={item?.ctaUrl ?? ""} />
        </div>

        <Bilingual base="coverImageAlt" label="Cover image alt text" en={item?.coverImageAltEn} ar={item?.coverImageAltAr} />
        <Bilingual base="ctaLabel" label="Custom Action Button Label (Optional, defaults to 'View Project')" en={item?.ctaLabelEn ?? ""} ar={item?.ctaLabelAr ?? ""} />

        <div className="bilingual">
          <Check name="featured" label="Featured on homepage & priority list" checked={item?.featured} />
          <Field name="featuredOrder" label="Featured order (0 = top priority)" type="number" value={item?.featuredOrder ?? 0} />
        </div>
      </section>

      {/* Project Detail Template (10 PRD Sections) */}
      <section className="panel">
        <h2>Project Detail Page (10 PRD Sections)</h2>
        <p className="hint">Configure rich content for the dedicated project detail page at /[locale]/projects/[slug].</p>

        <Bilingual
          base="fullDescription"
          label="Detailed Overview & Concept"
          en={item?.fullDescriptionEn ?? ""}
          ar={item?.fullDescriptionAr ?? ""}
          textarea
        />

        <div className="bilingual">
          <Field name="masterPlanUrl" label="Master Plan Image URL / Asset" value={item?.masterPlanUrl ?? ""} />
          <Field name="brochureUrl" label="Project Brochure Download URL (PDF)" value={item?.brochureUrl ?? ""} />
        </div>
        <Field name="videoTourUrl" label="Visual Tour / Virtual Video URL" value={item?.videoTourUrl ?? ""} />

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
            Key Facts (JSON array of &#123; label, value &#125;)
          </label>
          <textarea
            name="keyFacts"
            rows={3}
            defaultValue={item?.keyFacts ?? "[]"}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
            Highlights & Amenities (JSON array of &#123; title, description, icon &#125;)
          </label>
          <textarea
            name="highlights"
            rows={3}
            defaultValue={item?.highlights ?? "[]"}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
            Unit Types (JSON array of &#123; id, name, area, finishing, payment &#125;)
          </label>
          <textarea
            name="unitTypes"
            rows={4}
            defaultValue={item?.unitTypes ?? "[]"}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
            Nearby Destinations & Connectivity (JSON array of &#123; name, distance, type &#125;)
          </label>
          <textarea
            name="nearbyLocations"
            rows={3}
            defaultValue={item?.nearbyLocations ?? "[]"}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
            Construction Updates (JSON array of &#123; date, title, imageUrl, isVideo &#125;)
          </label>
          <textarea
            name="constructionUpdates"
            rows={3}
            defaultValue={item?.constructionUpdates ?? "[]"}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }}
          />
        </div>
      </section>

      {/* Opening diagram gallery */}
      <section className="panel">
        <h2>Opening Diagram & Project Gallery</h2>
        <p className="hint">Choose four project images. Together with the cover image above, these form the five rising panels and project gallery.</p>
        {Array.from({ length: 4 }, (_, index) => (
          <MediaField
            key={index}
            name={`galleryImage${index + 1}`}
            label={`Gallery image ${index + 1}`}
            value={gallery[index] ?? ""}
            assets={assets}
            kind="IMAGE"
          />
        ))}
      </section>

      {/* SEO */}
      <section className="panel">
        <h2>SEO & Social Sharing</h2>
        <Bilingual base="seoTitle" label="SEO title" en={item?.seoTitleEn ?? ""} ar={item?.seoTitleAr ?? ""} />
        <Bilingual base="seoDescription" label="SEO description" en={item?.seoDescriptionEn ?? ""} ar={item?.seoDescriptionAr ?? ""} />
        <Field name="ogImageUrl" label="OG image URL" value={item?.ogImageUrl ?? ""} />
      </section>
    </ActionForm>
  );
}
