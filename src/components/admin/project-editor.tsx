"use client";

import React, { useState, useTransition, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import type {
  Project,
  ProjectKeyFact,
  ProjectHighlight,
  ProjectUnitType,
  ProjectGalleryItem,
  ProjectConstructionUpdate,
  ProjectConnectivity,
  ProjectVisualTour,
} from "@prisma/client";
import {
  saveProject,
  uploadProjectVisualTour,
  updateProjectVisualTour,
  deleteProjectVisualTour,
  type UploadedMedia,
  type ActionState,
} from "@/app/admin/actions";
import { MediaField } from "./media-field";

export type ProjectWithRelations = Project & {
  keyFactsList?: ProjectKeyFact[];
  highlightsList?: ProjectHighlight[];
  unitTypesList?: ProjectUnitType[];
  galleryItemList?: ProjectGalleryItem[];
  constructionUpdatesList?: ProjectConstructionUpdate[];
  connectivityList?: ProjectConnectivity[];
  visualTours?: ProjectVisualTour[];
};

interface ProjectEditorProps {
  item?: ProjectWithRelations | null;
  assets: UploadedMedia[];
}

type TabKey =
  | "basic"
  | "hero"
  | "overview"
  | "highlights"
  | "unit_types"
  | "master_plan"
  | "location"
  | "gallery"
  | "construction"
  | "brochure"
  | "visual_tours"
  | "seo";

const TABS: Array<{ key: TabKey; labelEn: string; labelAr: string; number: string }> = [
  { key: "basic", labelEn: "Basic Info", labelAr: "المعلومات الأساسية", number: "01" },
  { key: "hero", labelEn: "Hero & Branding", labelAr: "الواجهة والهوية", number: "02" },
  { key: "overview", labelEn: "Overview & Facts", labelAr: "نظرة عامة وحقائق", number: "03" },
  { key: "highlights", labelEn: "Highlights", labelAr: "أبرز المميزات", number: "04" },
  { key: "unit_types", labelEn: "Unit Types", labelAr: "أنواع الوحدات", number: "05" },
  { key: "master_plan", labelEn: "Master Plan", labelAr: "المخطط العام", number: "06" },
  { key: "location", labelEn: "Location & Access", labelAr: "الموقع والوصول", number: "07" },
  { key: "gallery", labelEn: "Gallery", labelAr: "معرض الصور", number: "08" },
  { key: "construction", labelEn: "Construction Updates", labelAr: "مستجدات البناء", number: "09" },
  { key: "brochure", labelEn: "Brochure & CTA", labelAr: "الكتيب والإجراءات", number: "10" },
  { key: "visual_tours", labelEn: "Visual Tours", labelAr: "الجولات الافتراضية", number: "11" },
  { key: "seo", labelEn: "SEO & Publishing", labelAr: "الظهور والنشر", number: "12" },
];

export function ProjectEditor({ item, assets }: ProjectEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [isPending, startTransition] = useTransition();
  const [actionResult, setActionResult] = useState<ActionState>({});
  const [isDirty, setIsDirty] = useState(false);

  // Controlled form state
  const [formData, setFormData] = useState({
    slug: item?.slug ?? "",
    projectCode: item?.projectCode ?? "",
    status: item?.status ?? "DRAFT",
    projectType: item?.projectType ?? "Residential",
    progressStatus: item?.progressStatus ?? "Ongoing",
    featured: item?.featured ?? false,
    featuredOrder: item?.featuredOrder ?? 0,

    nameEn: item?.nameEn ?? "",
    nameAr: item?.nameAr ?? "",
    heroTitleEn: item?.heroTitleEn ?? item?.nameEn ?? "",
    heroTitleAr: item?.heroTitleAr ?? item?.nameAr ?? "",
    heroDescriptionEn: item?.heroDescriptionEn ?? item?.shortDescriptionEn ?? "",
    heroDescriptionAr: item?.heroDescriptionAr ?? item?.shortDescriptionAr ?? "",
    coverImageUrl: item?.coverImageUrl ?? "",
    mobileHeroImageUrl: item?.mobileHeroImageUrl ?? "",
    heroVideoUrl: item?.heroVideoUrl ?? "",
    logoUrl: item?.logoUrl ?? "",
    cardImageUrl: item?.cardImageUrl ?? "",
    coverImageAltEn: item?.coverImageAltEn ?? "",
    coverImageAltAr: item?.coverImageAltAr ?? "",
    coverImageFocalPoint: item?.coverImageFocalPoint ?? "center",

    shortDescriptionEn: item?.shortDescriptionEn ?? "",
    shortDescriptionAr: item?.shortDescriptionAr ?? "",
    fullDescriptionEn: item?.fullDescriptionEn ?? "",
    fullDescriptionAr: item?.fullDescriptionAr ?? "",

    masterPlanUrl: item?.masterPlanUrl ?? "",
    brochureUrl: item?.brochureUrl ?? "",
    videoTourUrl: item?.videoTourUrl ?? "",
    ctaLabelEn: item?.ctaLabelEn ?? "",
    ctaLabelAr: item?.ctaLabelAr ?? "",
    ctaUrl: item?.ctaUrl ?? "",

    locationEn: item?.locationEn ?? "",
    locationAr: item?.locationAr ?? "",
    addressEn: item?.addressEn ?? "",
    addressAr: item?.addressAr ?? "",
    directionsUrl: item?.directionsUrl ?? "",
    latitude: item?.latitude?.toString() ?? "",
    longitude: item?.longitude?.toString() ?? "",
    mapUrl: item?.mapUrl ?? "",

    seoTitleEn: item?.seoTitleEn ?? "",
    seoTitleAr: item?.seoTitleAr ?? "",
    seoDescriptionEn: item?.seoDescriptionEn ?? "",
    seoDescriptionAr: item?.seoDescriptionAr ?? "",
    ogImageUrl: item?.ogImageUrl ?? "",
  });

  // Repeatable items state
  const [keyFacts, setKeyFacts] = useState<
    Array<{ id?: string; labelEn: string; labelAr: string; valueEn: string; valueAr: string; unitEn?: string; unitAr?: string; icon?: string; sortOrder?: number }>
  >(() => {
    if (item?.keyFactsList && item.keyFactsList.length > 0) {
      return item.keyFactsList.map((k) => ({
        id: k.id,
        labelEn: k.labelEn,
        labelAr: k.labelAr,
        valueEn: k.valueEn,
        valueAr: k.valueAr,
        unitEn: k.unitEn ?? "",
        unitAr: k.unitAr ?? "",
        icon: k.icon ?? "",
        sortOrder: k.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.keyFacts ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [highlights, setHighlights] = useState<
    Array<{ id?: string; titleEn: string; titleAr: string; descriptionEn: string; descriptionAr: string; imageUrl?: string; icon?: string; sortOrder?: number }>
  >(() => {
    if (item?.highlightsList && item.highlightsList.length > 0) {
      return item.highlightsList.map((h) => ({
        id: h.id,
        titleEn: h.titleEn,
        titleAr: h.titleAr,
        descriptionEn: h.descriptionEn,
        descriptionAr: h.descriptionAr,
        imageUrl: h.imageUrl ?? "",
        icon: h.icon ?? "",
        sortOrder: h.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.highlights ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [unitTypes, setUnitTypes] = useState<
    Array<{ id?: string; titleEn: string; titleAr: string; areaEn?: string; areaAr?: string; areaRange?: string; areaUnit?: string; finishingEn?: string; finishingAr?: string; descriptionEn?: string; descriptionAr?: string; paymentPlanEn?: string; paymentPlanAr?: string; imageUrl?: string; floorPlanUrl?: string; sortOrder?: number }>
  >(() => {
    if (item?.unitTypesList && item.unitTypesList.length > 0) {
      return item.unitTypesList.map((u) => ({
        id: u.id,
        titleEn: u.titleEn,
        titleAr: u.titleAr,
        areaEn: u.areaEn ?? "",
        areaAr: u.areaAr ?? "",
        areaRange: u.areaRange ?? "",
        areaUnit: u.areaUnit ?? "sqm",
        finishingEn: u.finishingEn ?? "",
        finishingAr: u.finishingAr ?? "",
        descriptionEn: u.descriptionEn ?? "",
        descriptionAr: u.descriptionAr ?? "",
        paymentPlanEn: u.paymentPlanEn ?? "",
        paymentPlanAr: u.paymentPlanAr ?? "",
        imageUrl: u.imageUrl ?? "",
        floorPlanUrl: u.floorPlanUrl ?? "",
        sortOrder: u.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.unitTypes ?? "[]");
      return Array.isArray(parsed)
        ? parsed.map((p) => ({
            id: p.id,
            titleEn: p.nameEn || p.titleEn || "",
            titleAr: p.nameAr || p.titleAr || "",
            areaEn: p.areaEn || "",
            areaAr: p.areaAr || "",
            areaRange: p.areaRange || "",
            areaUnit: p.areaUnit || "sqm",
            finishingEn: p.finishingEn || "",
            finishingAr: p.finishingAr || "",
            paymentPlanEn: p.paymentEn || p.paymentPlanEn || "",
            paymentPlanAr: p.paymentAr || p.paymentPlanAr || "",
            imageUrl: p.image || p.imageUrl || "",
            floorPlanUrl: p.floorPlanUrl || "",
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [galleryItems, setGalleryItems] = useState<
    Array<{ id?: string; imageUrl: string; category: string; captionEn?: string; captionAr?: string; altEn?: string; altAr?: string; sortOrder?: number }>
  >(() => {
    if (item?.galleryItemList && item.galleryItemList.length > 0) {
      return item.galleryItemList.map((g) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        category: g.category,
        captionEn: g.captionEn ?? "",
        captionAr: g.captionAr ?? "",
        altEn: g.altEn ?? "",
        altAr: g.altAr ?? "",
        sortOrder: g.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.gallery ?? "[]");
      return Array.isArray(parsed)
        ? parsed.map((url: string, i: number) => ({
            imageUrl: url,
            category: i % 2 === 0 ? "RENDERS" : "CONSTRUCTION",
            sortOrder: i,
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [constructionUpdates, setConstructionUpdates] = useState<
    Array<{ id?: string; date: string; titleEn: string; titleAr: string; descriptionEn?: string; descriptionAr?: string; imageUrl?: string; isVideo?: boolean; videoUrl?: string; sortOrder?: number }>
  >(() => {
    if (item?.constructionUpdatesList && item.constructionUpdatesList.length > 0) {
      return item.constructionUpdatesList.map((u) => ({
        id: u.id,
        date: u.date ? new Date(u.date).toISOString().split("T")[0] : "",
        titleEn: u.titleEn,
        titleAr: u.titleAr,
        descriptionEn: u.descriptionEn ?? "",
        descriptionAr: u.descriptionAr ?? "",
        imageUrl: u.imageUrl ?? "",
        isVideo: u.isVideo,
        videoUrl: u.videoUrl ?? "",
        sortOrder: u.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.constructionUpdates ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [connectivity, setConnectivity] = useState<
    Array<{ id?: string; destinationEn: string; destinationAr: string; distanceOrDurationEn: string; distanceOrDurationAr: string; travelType?: string; sortOrder?: number }>
  >(() => {
    if (item?.connectivityList && item.connectivityList.length > 0) {
      return item.connectivityList.map((c) => ({
        id: c.id,
        destinationEn: c.destinationEn,
        destinationAr: c.destinationAr,
        distanceOrDurationEn: c.distanceOrDurationEn,
        distanceOrDurationAr: c.distanceOrDurationAr,
        travelType: c.travelType,
        sortOrder: c.sortOrder,
      }));
    }
    try {
      const parsed = JSON.parse(item?.nearbyLocations ?? "[]");
      return Array.isArray(parsed)
        ? parsed.map((n) => ({
            destinationEn: n.nameEn || "",
            destinationAr: n.nameAr || "",
            distanceOrDurationEn: n.distanceEn || "",
            distanceOrDurationAr: n.distanceAr || "",
            travelType: n.type || "CAR",
          }))
        : [];
    } catch {
      return [];
    }
  });

  // Visual tour upload & preview state
  const [tourUploadState, setTourUploadState] = useState<ActionState>({});
  const [isUploadingTour, setIsUploadingTour] = useState(false);
  const [activePreviewTour, setActivePreviewTour] = useState<ProjectVisualTour | null>(null);

  // Helper for text inputs
  const handleFieldChange = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setActionResult({});
  };

  // Submit all project changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      if (item?.id) fd.set("id", item.id);

      Object.entries(formData).forEach(([k, v]) => {
        if (typeof v === "boolean") {
          if (v) fd.set(k, "on");
        } else {
          fd.set(k, String(v ?? ""));
        }
      });

      // Repeatable items as serialized JSON
      fd.set("keyFactsJson", JSON.stringify(keyFacts));
      fd.set("highlightsJson", JSON.stringify(highlights));
      fd.set("unitTypesJson", JSON.stringify(unitTypes));
      fd.set("galleryItemsJson", JSON.stringify(galleryItems));
      fd.set("constructionUpdatesJson", JSON.stringify(constructionUpdates));
      fd.set("connectivityJson", JSON.stringify(connectivity));

      try {
        const res = await saveProject({}, fd);
        setActionResult(res);
        if (res.success) {
          setIsDirty(false);
        }
      } catch (err: any) {
        setActionResult({ error: err.message || "An unexpected error occurred while saving." });
      }
    });
  };

  // Handle tour upload
  const handleTourUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item?.id) {
      setTourUploadState({ error: "Please save the project first before uploading a visual tour." });
      return;
    }
    const form = e.currentTarget;
    const tourFd = new FormData(form);
    tourFd.set("projectId", item.id);

    setIsUploadingTour(true);
    setTourUploadState({});

    try {
      const res = await uploadProjectVisualTour({}, tourFd);
      setTourUploadState(res);
      if (res.success) {
        form.reset();
        window.location.reload();
      }
    } catch (err: any) {
      setTourUploadState({ error: err.message || "Tour upload failed." });
    } finally {
      setIsUploadingTour(false);
    }
  };

  const previewEnUrl = item ? `/en/projects/${formData.slug}?preview=true` : "#";
  const previewArUrl = item ? `/ar/projects/${formData.slug}?preview=true` : "#";

  return (
    <div className="project-editor-container">
      {/* Top action status banner */}
      {actionResult.error && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: "16px" }}>
          <strong>Error saving project:</strong> {actionResult.error}
        </div>
      )}
      {actionResult.success && (
        <div className="admin-alert admin-alert--success" style={{ marginBottom: "16px" }}>
          <strong>Saved:</strong> {actionResult.success}
        </div>
      )}

      {/* Unsaved changes bar */}
      {isDirty && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "6px",
            padding: "10px 16px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            color: "#92400e",
          }}
        >
          <span>You have unsaved changes in this project.</span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="primary"
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            {isPending ? "Saving Changes..." : "Save Project Now"}
          </button>
        </div>
      )}

      {/* Tabs Header Navigation */}
      <nav
        className="project-editor-tabs-nav"
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "var(--forest)" : "transparent",
                color: isActive ? "#ffffff" : "var(--ink)",
                cursor: "pointer",
                fontWeight: isActive ? 600 : 500,
                fontSize: "13px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "10px", opacity: isActive ? 0.8 : 0.5 }}>{tab.number}</span>
              <span>{tab.labelEn}</span>
              <span style={{ fontSize: "11px", opacity: 0.8, direction: "rtl" }}>{tab.labelAr}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Tab Panels Form */}
      <form onSubmit={handleSubmit} className="admin-form">
        {/* =========================================================
            TAB 1: Basic Information
        ========================================================= */}
        {activeTab === "basic" && (
          <section className="panel">
            <h2>01. Basic Project Information</h2>
            <p className="hint">Core system identifiers, publication state, project categorization, and delivery milestone.</p>

            <div className="bilingual">
              <label>
                Project Slug (URL Path) *
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFieldChange("slug", e.target.value)}
                  placeholder="e.g. solaya"
                  required
                />
                <span className="field-hint">Used for public URL: /projects/{formData.slug || "slug"}</span>
              </label>

              <label>
                Internal Project Code (Optional)
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => handleFieldChange("projectCode", e.target.value)}
                  placeholder="e.g. IMG-DEV-001"
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Publication State *
                <select value={formData.status} onChange={(e) => handleFieldChange("status", e.target.value)}>
                  <option value="DRAFT">DRAFT (Hidden from public portfolio)</option>
                  <option value="PUBLISHED">PUBLISHED (Visible on website)</option>
                  <option value="ARCHIVED">ARCHIVED (Preserved record)</option>
                </select>
              </label>

              <label>
                Delivery Status *
                <select value={formData.progressStatus} onChange={(e) => handleFieldChange("progressStatus", e.target.value)}>
                  <option value="Ongoing">Ongoing / قيد الإنشاء</option>
                  <option value="Delivered">Delivered / تم التسليم</option>
                  <option value="Upcoming">Upcoming / قريباً</option>
                </select>
              </label>
            </div>

            <div className="bilingual">
              <label>
                Project Type *
                <select value={formData.projectType} onChange={(e) => handleFieldChange("projectType", e.target.value)}>
                  <option value="Residential">Residential / سكني</option>
                  <option value="Commercial">Commercial / تجاري</option>
                  <option value="Medical">Medical / طبي</option>
                </select>
              </label>

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <label style={{ margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleFieldChange("featured", e.target.checked)}
                  />
                  <span>Featured in Portfolio &amp; Homepage</span>
                </label>

                <label style={{ margin: 0 }}>
                  Order (0 = Top)
                  <input
                    type="number"
                    value={formData.featuredOrder}
                    onChange={(e) => handleFieldChange("featuredOrder", parseInt(e.target.value, 10) || 0)}
                    style={{ width: "80px" }}
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 2: Hero & Branding
        ========================================================= */}
        {activeTab === "hero" && (
          <section className="panel">
            <h2>02. Hero Presentation &amp; Branding</h2>
            <p className="hint">Architectural hero imagery, localized titles, mobile backgrounds, and visual logo.</p>

            <div className="bilingual">
              <label>
                Project Name (English) *
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => handleFieldChange("nameEn", e.target.value)}
                  placeholder="e.g. Solaya"
                  required
                />
              </label>

              <label>
                اسم المشروع (العربية) *
                <input
                  type="text"
                  dir="rtl"
                  value={formData.nameAr}
                  onChange={(e) => handleFieldChange("nameAr", e.target.value)}
                  placeholder="مثال: سوليا"
                  required
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Hero Heading (English)
                <input
                  type="text"
                  value={formData.heroTitleEn}
                  onChange={(e) => handleFieldChange("heroTitleEn", e.target.value)}
                  placeholder="e.g. Solaya — Redefining Coastal Luxury"
                />
              </label>

              <label>
                عنوان واجهة المشروع (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={formData.heroTitleAr}
                  onChange={(e) => handleFieldChange("heroTitleAr", e.target.value)}
                  placeholder="مثال: سوليا — إعادة تعريف الفخامة الساحلية"
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Hero Description (English)
                <textarea
                  rows={3}
                  value={formData.heroDescriptionEn}
                  onChange={(e) => handleFieldChange("heroDescriptionEn", e.target.value)}
                  placeholder="Short introductory narrative for the hero banner..."
                />
              </label>

              <label>
                وصف واجهة المشروع (العربية)
                <textarea
                  rows={3}
                  dir="rtl"
                  value={formData.heroDescriptionAr}
                  onChange={(e) => handleFieldChange("heroDescriptionAr", e.target.value)}
                  placeholder="نبذة تقديمية تظهر في واجهة صفحة المشروع..."
                />
              </label>
            </div>

            <div className="bilingual">
              <MediaField
                name="coverImageUrl"
                label="Desktop Cover / Hero Image *"
                value={formData.coverImageUrl}
                assets={assets}
                kind="IMAGE"
                required
              />
              <MediaField
                name="mobileHeroImageUrl"
                label="Mobile Hero Image (Optional)"
                value={formData.mobileHeroImageUrl}
                assets={assets}
                kind="IMAGE"
              />
            </div>

            <div className="bilingual">
              <MediaField
                name="logoUrl"
                label="Project Emblem / Logo (Optional)"
                value={formData.logoUrl}
                assets={assets}
                kind="IMAGE"
              />
              <MediaField
                name="cardImageUrl"
                label="Portfolio Card Image (Optional override)"
                value={formData.cardImageUrl}
                assets={assets}
                kind="IMAGE"
              />
            </div>

            <div className="bilingual">
              <label>
                Cover Image Focal Point
                <select
                  value={formData.coverImageFocalPoint}
                  onChange={(e) => handleFieldChange("coverImageFocalPoint", e.target.value)}
                >
                  <option value="center">Center (Balanced)</option>
                  <option value="top">Top (Roofline / Architecture)</option>
                  <option value="bottom">Bottom (Landscape / Ground)</option>
                  <option value="left">Left (Focal subject on left)</option>
                  <option value="right">Right (Focal subject on right)</option>
                </select>
              </label>

              <label>
                Hero Video Stream URL (Optional, MP4 or WebM)
                <input
                  type="text"
                  value={formData.heroVideoUrl}
                  onChange={(e) => handleFieldChange("heroVideoUrl", e.target.value)}
                  placeholder="https://.../video.mp4"
                />
              </label>
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 3: Overview & Key Facts
        ========================================================= */}
        {activeTab === "overview" && (
          <section className="panel">
            <h2>03. Project Overview &amp; Key Facts</h2>
            <p className="hint">Executive summary, architectural narrative, and normalized key performance facts.</p>

            <div className="bilingual">
              <label>
                Short Summary (English) *
                <textarea
                  rows={2}
                  value={formData.shortDescriptionEn}
                  onChange={(e) => handleFieldChange("shortDescriptionEn", e.target.value)}
                  placeholder="Brief promise displayed on cards..."
                  required
                />
              </label>

              <label>
                نبذة موجزة (العربية) *
                <textarea
                  rows={2}
                  dir="rtl"
                  value={formData.shortDescriptionAr}
                  onChange={(e) => handleFieldChange("shortDescriptionAr", e.target.value)}
                  placeholder="وصف موجز للمشروع يظهر في البطاقات..."
                  required
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Detailed Concept &amp; Story (English)
                <textarea
                  rows={4}
                  value={formData.fullDescriptionEn}
                  onChange={(e) => handleFieldChange("fullDescriptionEn", e.target.value)}
                  placeholder="Full architectural narrative for the project details page..."
                />
              </label>

              <label>
                الرؤية المعمارية المتكاملة (العربية)
                <textarea
                  rows={4}
                  dir="rtl"
                  value={formData.fullDescriptionAr}
                  onChange={(e) => handleFieldChange("fullDescriptionAr", e.target.value)}
                  placeholder="السرد المعماري والقصة الكاملة لصفحة تفاصيل المشروع..."
                />
              </label>
            </div>

            {/* Repeatable Key Facts */}
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "var(--ink)" }}>Key Facts (Normalized)</h3>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>Add 3 to 4 verifiable project metrics (e.g., Total Area, Green Space %, Delivery Year).</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setKeyFacts((prev) => [
                      ...prev,
                      { labelEn: "", labelAr: "", valueEn: "", valueAr: "", unitEn: "", unitAr: "", sortOrder: prev.length },
                    ]);
                    setIsDirty(true);
                  }}
                  className="secondary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  + Add Key Fact
                </button>
              </div>

              {keyFacts.map((fact, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
                    gap: "10px",
                    alignItems: "center",
                    padding: "10px",
                    background: "#fbfcfb",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="text"
                    value={fact.labelEn}
                    onChange={(e) => {
                      const updated = [...keyFacts];
                      updated[idx].labelEn = e.target.value;
                      setKeyFacts(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Label (EN)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={fact.labelAr}
                    onChange={(e) => {
                      const updated = [...keyFacts];
                      updated[idx].labelAr = e.target.value;
                      setKeyFacts(updated);
                      setIsDirty(true);
                    }}
                    placeholder="التسمية (عربي)"
                  />
                  <input
                    type="text"
                    value={fact.valueEn}
                    onChange={(e) => {
                      const updated = [...keyFacts];
                      updated[idx].valueEn = e.target.value;
                      setKeyFacts(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Value (EN)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={fact.valueAr}
                    onChange={(e) => {
                      const updated = [...keyFacts];
                      updated[idx].valueAr = e.target.value;
                      setKeyFacts(updated);
                      setIsDirty(true);
                    }}
                    placeholder="القيمة (عربي)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setKeyFacts(keyFacts.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 4: Highlights
        ========================================================= */}
        {activeTab === "highlights" && (
          <section className="panel">
            <h2>04. Highlights &amp; Amenities</h2>
            <p className="hint">Curated architectural features, landscape amenities, and signature design elements.</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total highlights configured: {highlights.length}</span>
              <button
                type="button"
                onClick={() => {
                  setHighlights((prev) => [
                    ...prev,
                    { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", sortOrder: prev.length },
                  ]);
                  setIsDirty(true);
                }}
                className="secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                + Add Highlight
              </button>
            </div>

            {highlights.map((h, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  background: "#fbfcfb",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong>Highlight #{idx + 1}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlights(highlights.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove
                  </button>
                </div>
                <div className="bilingual">
                  <input
                    type="text"
                    value={h.titleEn}
                    onChange={(e) => {
                      const updated = [...highlights];
                      updated[idx].titleEn = e.target.value;
                      setHighlights(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Title (English)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={h.titleAr}
                    onChange={(e) => {
                      const updated = [...highlights];
                      updated[idx].titleAr = e.target.value;
                      setHighlights(updated);
                      setIsDirty(true);
                    }}
                    placeholder="العنوان (العربية)"
                  />
                </div>
                <div className="bilingual" style={{ marginTop: "8px" }}>
                  <textarea
                    rows={2}
                    value={h.descriptionEn}
                    onChange={(e) => {
                      const updated = [...highlights];
                      updated[idx].descriptionEn = e.target.value;
                      setHighlights(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Description (English)"
                  />
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={h.descriptionAr}
                    onChange={(e) => {
                      const updated = [...highlights];
                      updated[idx].descriptionAr = e.target.value;
                      setHighlights(updated);
                      setIsDirty(true);
                    }}
                    placeholder="الوصف (العربية)"
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* =========================================================
            TAB 5: Unit Types
        ========================================================= */}
        {activeTab === "unit_types" && (
          <section className="panel">
            <h2>05. Unit Types &amp; Layouts</h2>
            <p className="hint">Configured unit categories, areas, finishing specifications, and payment terms.</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total unit types: {unitTypes.length}</span>
              <button
                type="button"
                onClick={() => {
                  setUnitTypes((prev) => [
                    ...prev,
                    {
                      titleEn: "",
                      titleAr: "",
                      areaRange: "",
                      areaUnit: "sqm",
                      finishingEn: "Fully Finished",
                      finishingAr: "تشطيب كامل فندقي",
                      paymentPlanEn: "",
                      paymentPlanAr: "",
                      sortOrder: prev.length,
                    },
                  ]);
                  setIsDirty(true);
                }}
                className="secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                + Add Unit Type
              </button>
            </div>

            {unitTypes.map((u, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  background: "#fbfcfb",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong>Unit Type #{idx + 1}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypes(unitTypes.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove
                  </button>
                </div>

                <div className="bilingual">
                  <input
                    type="text"
                    value={u.titleEn}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].titleEn = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Unit Title (e.g. 2-Bedroom Chalet)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={u.titleAr}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].titleAr = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="اسم الوحدة (مثال: شاليه غرفتين)"
                  />
                </div>

                <div className="bilingual" style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    value={u.areaRange || ""}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].areaRange = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Area Range (e.g. 115 - 145 sqm)"
                  />
                  <input
                    type="text"
                    value={u.finishingEn || ""}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].finishingEn = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Finishing (e.g. Hotel-grade Fully Finished)"
                  />
                </div>

                <div className="bilingual" style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    value={u.paymentPlanEn || ""}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].paymentPlanEn = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Payment terms (e.g. 10% down payment, 8 years)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={u.paymentPlanAr || ""}
                    onChange={(e) => {
                      const updated = [...unitTypes];
                      updated[idx].paymentPlanAr = e.target.value;
                      setUnitTypes(updated);
                      setIsDirty(true);
                    }}
                    placeholder="شروط السداد (مثال: ١٠٪ مقدم وتقسيط ٨ سنوات)"
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* =========================================================
            TAB 6: Master Plan
        ========================================================= */}
        {activeTab === "master_plan" && (
          <section className="panel">
            <h2>06. Master Plan Presentation</h2>
            <p className="hint">High-resolution architectural master layout with zoom viewer support.</p>

            <MediaField
              name="masterPlanUrl"
              label="Master Plan Image Asset"
              value={formData.masterPlanUrl}
              assets={assets}
              kind="IMAGE"
            />
          </section>
        )}

        {/* =========================================================
            TAB 7: Location & Connectivity
        ========================================================= */}
        {activeTab === "location" && (
          <section className="panel">
            <h2>07. Location, Coordinates &amp; Connectivity</h2>
            <p className="hint">Geographic placement, directions links, and travel times to key destinations.</p>

            <div className="bilingual">
              <label>
                General Location Display Label (English) *
                <input
                  type="text"
                  value={formData.locationEn}
                  onChange={(e) => handleFieldChange("locationEn", e.target.value)}
                  placeholder="e.g. Ras El Hekma, North Coast"
                  required
                />
              </label>

              <label>
                تسمية الموقع العام (العربية) *
                <input
                  type="text"
                  dir="rtl"
                  value={formData.locationAr}
                  onChange={(e) => handleFieldChange("locationAr", e.target.value)}
                  placeholder="مثال: رأس الحكمة، الساحل الشمالي"
                  required
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Full Address / Specific District (English)
                <input
                  type="text"
                  value={formData.addressEn}
                  onChange={(e) => handleFieldChange("addressEn", e.target.value)}
                  placeholder="e.g. KM 214 Alexandria - Matrouh Road"
                />
              </label>

              <label>
                العنوان التفصيلي (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={formData.addressAr}
                  onChange={(e) => handleFieldChange("addressAr", e.target.value)}
                  placeholder="مثال: الكيلو ٢١٤ طريق الإسكندرية - مطروح"
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                Latitude
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleFieldChange("latitude", e.target.value)}
                  placeholder="e.g. 31.12345"
                />
              </label>

              <label>
                Longitude
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleFieldChange("longitude", e.target.value)}
                  placeholder="e.g. 27.98765"
                />
              </label>
            </div>

            <label>
              Google Maps / Directions URL (Optional override)
              <input
                type="text"
                value={formData.directionsUrl || formData.mapUrl}
                onChange={(e) => {
                  handleFieldChange("directionsUrl", e.target.value);
                  handleFieldChange("mapUrl", e.target.value);
                }}
                placeholder="https://maps.google.com/?q=..."
              />
            </label>

            {/* Repeatable Connectivity Items */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "var(--ink)" }}>Nearby Connectivity Points</h3>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>Key travel times (e.g. Alamein Airport — 20 mins).</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConnectivity((prev) => [
                      ...prev,
                      { destinationEn: "", destinationAr: "", distanceOrDurationEn: "", distanceOrDurationAr: "", travelType: "CAR", sortOrder: prev.length },
                    ]);
                    setIsDirty(true);
                  }}
                  className="secondary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  + Add Destination
                </button>
              </div>

              {connectivity.map((conn, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
                    gap: "10px",
                    alignItems: "center",
                    padding: "10px",
                    background: "#fbfcfb",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="text"
                    value={conn.destinationEn}
                    onChange={(e) => {
                      const updated = [...connectivity];
                      updated[idx].destinationEn = e.target.value;
                      setConnectivity(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Destination (EN)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={conn.destinationAr}
                    onChange={(e) => {
                      const updated = [...connectivity];
                      updated[idx].destinationAr = e.target.value;
                      setConnectivity(updated);
                      setIsDirty(true);
                    }}
                    placeholder="الوجهة (عربي)"
                  />
                  <input
                    type="text"
                    value={conn.distanceOrDurationEn}
                    onChange={(e) => {
                      const updated = [...connectivity];
                      updated[idx].distanceOrDurationEn = e.target.value;
                      setConnectivity(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Time (e.g. 20 Mins)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={conn.distanceOrDurationAr}
                    onChange={(e) => {
                      const updated = [...connectivity];
                      updated[idx].distanceOrDurationAr = e.target.value;
                      setConnectivity(updated);
                      setIsDirty(true);
                    }}
                    placeholder="المدة (مثال: ٢٠ دقيقة)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setConnectivity(connectivity.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================
            TAB 8: Gallery
        ========================================================= */}
        {activeTab === "gallery" && (
          <section className="panel">
            <h2>08. Architectural Gallery &amp; Category Albums</h2>
            <p className="hint">Categorized imagery: Renders, Construction Progress, and Interiors.</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total images in gallery: {galleryItems.length}</span>
              <button
                type="button"
                onClick={() => {
                  setGalleryItems((prev) => [
                    ...prev,
                    { imageUrl: "", category: "RENDERS", sortOrder: prev.length },
                  ]);
                  setIsDirty(true);
                }}
                className="secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                + Add Image to Gallery
              </button>
            </div>

            {galleryItems.map((g, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 80px",
                  gap: "10px",
                  alignItems: "center",
                  padding: "10px",
                  background: "#fbfcfb",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <input
                  type="text"
                  value={g.imageUrl}
                  onChange={(e) => {
                    const updated = [...galleryItems];
                    updated[idx].imageUrl = e.target.value;
                    setGalleryItems(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Image URL / Media Library Asset"
                />
                <select
                  value={g.category}
                  onChange={(e) => {
                    const updated = [...galleryItems];
                    updated[idx].category = e.target.value;
                    setGalleryItems(updated);
                    setIsDirty(true);
                  }}
                >
                  <option value="RENDERS">Renders / ريندر</option>
                  <option value="CONSTRUCTION">Construction / إنشاءات</option>
                  <option value="INTERIOR">Interior / ديكور</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryItems(galleryItems.filter((_, i) => i !== idx));
                    setIsDirty(true);
                  }}
                  className="danger"
                  style={{ padding: "4px 8px", fontSize: "11px" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </section>
        )}

        {/* =========================================================
            TAB 9: Construction Updates
        ========================================================= */}
        {activeTab === "construction" && (
          <section className="panel">
            <h2>09. Construction Updates &amp; Milestones</h2>
            <p className="hint">Dated progress reports, verified photography, and onsite construction updates.</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total updates: {constructionUpdates.length}</span>
              <button
                type="button"
                onClick={() => {
                  setConstructionUpdates((prev) => [
                    ...prev,
                    { date: new Date().toISOString().split("T")[0], titleEn: "", titleAr: "", imageUrl: "", sortOrder: prev.length },
                  ]);
                  setIsDirty(true);
                }}
                className="secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                + Add Update
              </button>
            </div>

            {constructionUpdates.map((u, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  background: "#fbfcfb",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong>Progress Report #{idx + 1}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setConstructionUpdates(constructionUpdates.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove
                  </button>
                </div>

                <div className="bilingual">
                  <input
                    type="date"
                    value={u.date}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].date = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                  />
                  <input
                    type="text"
                    value={u.imageUrl || ""}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].imageUrl = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Photo URL / Construction Site Image"
                  />
                </div>

                <div className="bilingual" style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    value={u.titleEn}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].titleEn = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                    placeholder="Update Title (English)"
                  />
                  <input
                    type="text"
                    dir="rtl"
                    value={u.titleAr}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].titleAr = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                    placeholder="عنوان التحديث (العربية)"
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* =========================================================
            TAB 10: Brochure & CTA
        ========================================================= */}
        {activeTab === "brochure" && (
          <section className="panel">
            <h2>10. Brochure Download &amp; Custom CTA</h2>
            <p className="hint">Official project PDF brochure and custom primary action overrides.</p>

            <label>
              Official Project Brochure (PDF Document URL)
              <input
                type="text"
                value={formData.brochureUrl}
                onChange={(e) => handleFieldChange("brochureUrl", e.target.value)}
                placeholder="/documents/solaya-brochure.pdf"
              />
            </label>

            <div className="bilingual" style={{ marginTop: "16px" }}>
              <label>
                Custom Action Label (English)
                <input
                  type="text"
                  value={formData.ctaLabelEn}
                  onChange={(e) => handleFieldChange("ctaLabelEn", e.target.value)}
                  placeholder="Defaults to 'View Project'"
                />
              </label>

              <label>
                تسمية الإجراء المخصص (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={formData.ctaLabelAr}
                  onChange={(e) => handleFieldChange("ctaLabelAr", e.target.value)}
                  placeholder="الافتراضي: 'عرض المشروع'"
                />
              </label>
            </div>

            <label style={{ marginTop: "12px" }}>
              Custom Target URL (Optional override)
              <input
                type="text"
                value={formData.ctaUrl}
                onChange={(e) => handleFieldChange("ctaUrl", e.target.value)}
                placeholder="Leave blank for standard details page"
              />
            </label>
          </section>
        )}

        {/* =========================================================
            TAB 12: SEO & Publishing
        ========================================================= */}
        {activeTab === "seo" && (
          <section className="panel">
            <h2>12. Search Optimization (SEO) &amp; Social Sharing</h2>
            <p className="hint">Search engine titles, meta descriptions, and Open Graph sharing cards.</p>

            <div className="bilingual">
              <label>
                SEO Title (English)
                <input
                  type="text"
                  value={formData.seoTitleEn}
                  onChange={(e) => handleFieldChange("seoTitleEn", e.target.value)}
                  placeholder="Solaya — Image Developments"
                />
              </label>

              <label>
                عنوان محركات البحث (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={formData.seoTitleAr}
                  onChange={(e) => handleFieldChange("seoTitleAr", e.target.value)}
                  placeholder="سوليا — إيمدج للتطوير العقاري"
                />
              </label>
            </div>

            <div className="bilingual">
              <label>
                SEO Description (English)
                <textarea
                  rows={3}
                  value={formData.seoDescriptionEn}
                  onChange={(e) => handleFieldChange("seoDescriptionEn", e.target.value)}
                  placeholder="Concise description for search results..."
                />
              </label>

              <label>
                وصف محركات البحث (العربية)
                <textarea
                  rows={3}
                  dir="rtl"
                  value={formData.seoDescriptionAr}
                  onChange={(e) => handleFieldChange("seoDescriptionAr", e.target.value)}
                  placeholder="وصف مختصر يظهر في نتائج البحث ومواقع التواصل..."
                />
              </label>
            </div>

            <label>
              Social Sharing (OG) Image URL
              <input
                type="text"
                value={formData.ogImageUrl}
                onChange={(e) => handleFieldChange("ogImageUrl", e.target.value)}
                placeholder="Defaults to project cover image"
              />
            </label>
          </section>
        )}

        {/* Persistent Save Bar for all tabs except visual tours which has its own upload form */}
        {activeTab !== "visual_tours" && (
          <div style={{ marginTop: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="submit" disabled={isPending} className="primary">
              {isPending ? "Saving Project..." : "Save Project"}
            </button>
            <Link href="/admin/projects" className="secondary">
              Cancel &amp; Return to List
            </Link>
          </div>
        )}
      </form>

      {/* =========================================================
          TAB 11: Visual Tours (Essential Requirement)
      ========================================================= */}
      {activeTab === "visual_tours" && (
        <section className="panel">
          <h2>11. Project HTML Visual Tours (Active Content)</h2>
          <p className="hint">
            Upload self-contained HTML visual tours (.html) or complete ZIP packages (.zip) containing index.html and all local assets.
            Tours are automatically processed with strict path traversal defenses, executable script blocking, and hosted in sandboxed viewers.
          </p>

          {/* Existing visual tours list */}
          {item?.visualTours && item.visualTours.length > 0 ? (
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>
                Configured Visual Tours ({item.visualTours.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {item.visualTours.map((tour) => (
                  <div
                    key={tour.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 100px 180px",
                      gap: "12px",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "#fbfcfb",
                      border: "1px solid var(--line)",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "14px", color: "var(--ink)" }}>{tour.titleEn}</strong>
                        <span style={{ fontSize: "13px", color: "var(--muted)" }}>({tour.titleAr})</span>
                        {tour.isDefault && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#166534",
                              background: "#dcfce7",
                              padding: "2px 8px",
                              borderRadius: "10px",
                            }}
                          >
                            ★ Default Tour
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "#f1f5f9",
                            color: "#475569",
                          }}
                        >
                          {tour.sourceType} • {tour.assetCount} file(s)
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Entry: <code>{tour.entryFilePath}</code> • Prefix: <code>{tour.extractedPrefix}</code>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`status-badge status-${tour.publicationState.toLowerCase()}`}
                        style={{ fontSize: "11px" }}
                      >
                        {tour.publicationState}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Target: <strong>{tour.localeTarget}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setActivePreviewTour(tour)}
                        className="secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        Preview ↗
                      </button>
                      <form action={deleteProjectVisualTour}>
                        <input type="hidden" name="id" value={tour.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm(`Delete visual tour "${tour.titleEn}"? This removes all extracted files.`)) {
                              e.preventDefault();
                            }
                          }}
                          className="danger"
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "20px", background: "#f8faf9", borderRadius: "6px", marginBottom: "24px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>No visual tours uploaded yet for this project.</p>
            </div>
          )}

          {/* Upload New Visual Tour Card */}
          <div
            style={{
              padding: "20px",
              background: "#ffffff",
              border: "1px dashed var(--forest)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px" }}>
              + Upload New HTML Visual Tour
            </h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 16px" }}>
              Accepted formats: Self-contained .html or complete .zip archive (up to 100 MB). All directories, panorama assets, scripts, and stylesheets in the ZIP are preserved.
            </p>

            {tourUploadState.error && (
              <div className="admin-alert admin-alert--error" style={{ marginBottom: "16px" }}>
                <strong>Upload Error:</strong> {tourUploadState.error}
              </div>
            )}
            {tourUploadState.success && (
              <div className="admin-alert admin-alert--success" style={{ marginBottom: "16px" }}>
                {tourUploadState.success}
              </div>
            )}

            <form onSubmit={handleTourUpload}>
              <div className="bilingual">
                <label>
                  Tour Title (English) *
                  <input type="text" name="titleEn" placeholder="e.g. 360° Virtual Walkthrough" required />
                </label>
                <label>
                  عنوان الجولة الافتراضية (العربية) *
                  <input type="text" dir="rtl" name="titleAr" placeholder="مثال: جولة افتراضية ٣٦٠ درجة" required />
                </label>
              </div>

              <div className="bilingual" style={{ marginTop: "12px" }}>
                <label>
                  Tour File (.html or .zip) *
                  <input
                    type="file"
                    name="tourFile"
                    accept=".zip,.html,.htm"
                    required
                    style={{ padding: "8px", background: "#f8faf9", borderRadius: "4px", border: "1px solid var(--line)" }}
                  />
                </label>

                <label>
                  Target Audience / Language
                  <select name="localeTarget" defaultValue="ALL">
                    <option value="ALL">Both Languages (English &amp; Arabic)</option>
                    <option value="en">English Only</option>
                    <option value="ar">Arabic Only</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: "12px", display: "flex", gap: "16px", alignItems: "center" }}>
                <label style={{ margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" name="isDefault" defaultChecked={!item?.visualTours?.length} />
                  <span>Set as default visual tour on project page</span>
                </label>
              </div>

              <div style={{ marginTop: "16px" }}>
                <button type="submit" disabled={isUploadingTour} className="primary">
                  {isUploadingTour ? "Extracting & Verifying Archive..." : "Upload & Publish Visual Tour"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Visual Tour In-CMS Sandboxed Preview Modal */}
      {activePreviewTour && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              color: "#ffffff",
            }}
          >
            <div>
              <strong style={{ fontSize: "16px" }}>{activePreviewTour.titleEn}</strong>
              <span style={{ fontSize: "13px", opacity: 0.7, marginInlineStart: "8px" }}>
                ({activePreviewTour.extractedPrefix}/{activePreviewTour.entryFilePath})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePreviewTour(null)}
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: "4px",
                padding: "6px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close Preview ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: "8px",
              overflow: "hidden",
              background: "#000000",
              position: "relative",
            }}
          >
            <iframe
              src={`${activePreviewTour.extractedPrefix}/${activePreviewTour.entryFilePath}`}
              title={activePreviewTour.titleEn}
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
