"use client";

import React, { useState, useTransition, useEffect, useCallback, useRef } from "react";
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
  deleteProjectVisualTour,
  setProjectStatus,
  type UploadedMedia,
  type ActionState,
} from "@/app/admin/actions";
import { MediaUploadField } from "./media-upload-field";
import { ProjectGalleryManager, type GallerySettingsData } from "./project-gallery-manager";

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

export type TabKey =
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
  { key: "gallery", labelEn: "Project Gallery", labelAr: "معرض المشروع", number: "08" },
  { key: "construction", labelEn: "Construction Updates", labelAr: "مستجدات البناء", number: "09" },
  { key: "brochure", labelEn: "Brochure & CTA", labelAr: "الكتيب والإجراءات", number: "10" },
  { key: "visual_tours", labelEn: "Visual Tours", labelAr: "الجولات الافتراضية", number: "11" },
  { key: "seo", labelEn: "SEO & Publishing", labelAr: "الظهور والنشر", number: "12" },
];

export interface GalleryItemState {
  id?: string;
  imageUrl: string;
  category: string;
  captionEn?: string;
  captionAr?: string;
  altEn?: string;
  altAr?: string;
  isVideo?: boolean;
  videoUrl?: string;
  posterUrl?: string;
  sortOrder?: number;
}

export function ProjectEditor({ item, assets }: ProjectEditorProps) {
  const [projectId, setProjectId] = useState<string | undefined>(item?.id);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [isPending, startTransition] = useTransition();
  const [actionResult, setActionResult] = useState<ActionState>({});
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Controlled authoritative form state
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
    heroVideoPosterUrl: (item as any)?.heroVideoPosterUrl ?? "",
    logoUrl: item?.logoUrl ?? "",
    cardImageUrl: item?.cardImageUrl ?? "",
    coverImageAltEn: item?.coverImageAltEn ?? "",
    coverImageAltAr: item?.coverImageAltAr ?? "",
    coverImageFocalPoint: (item as any)?.coverImageFocalPoint ?? "center",

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

  const [galleryItems, setGalleryItems] = useState<GalleryItemState[]>(() => {
    if (item?.galleryItemList && item.galleryItemList.length > 0) {
      return item.galleryItemList.map((g) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        category: g.category || "RENDERS",
        captionEn: g.captionEn ?? "",
        captionAr: g.captionAr ?? "",
        altEn: g.altEn ?? "",
        altAr: g.altAr ?? "",
        isVideo: (g as any).isVideo ?? false,
        videoUrl: (g as any).videoUrl ?? "",
        posterUrl: (g as any).posterUrl ?? "",
        focalPoint: (g as any).focalPoint ?? "center",
        visible: (g as any).visible !== false,
        mediaAssetId: (g as any).mediaAssetId ?? undefined,
        sortOrder: g.sortOrder,
        status: "ready",
      }));
    }
    try {
      const parsed = JSON.parse(item?.gallery ?? "[]");
      return Array.isArray(parsed)
        ? parsed.map((url: string, i: number) => ({
            imageUrl: url,
            category: i % 2 === 0 ? "RENDERS" : "CONSTRUCTION",
            sortOrder: i,
            status: "ready",
            visible: true,
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [gallerySettings, setGallerySettings] = useState<GallerySettingsData>({
    enabled: (item as any)?.galleryEnabled !== false,
    titleEn: (item as any)?.galleryTitleEn ?? "",
    titleAr: (item as any)?.galleryTitleAr ?? "",
    introEn: (item as any)?.galleryIntroEn ?? "",
    introAr: (item as any)?.galleryIntroAr ?? "",
    showFilters: (item as any)?.galleryShowFilters !== false,
    showCaptions: (item as any)?.galleryShowCaptions !== false,
    layout: ((item as any)?.galleryLayout || "grid") as "grid" | "carousel",
    coverUrl: (item as any)?.galleryCoverUrl || undefined,
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

  // Visual tour state
  const [visualToursList, setVisualToursList] = useState<ProjectVisualTour[]>(item?.visualTours || []);
  const [tourUploadState, setTourUploadState] = useState<ActionState>({});
  const [isUploadingTour, setIsUploadingTour] = useState(false);
  const [activePreviewTour, setActivePreviewTour] = useState<ProjectVisualTour | null>(null);

  // BeforeUnload warning when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Synchronize field change into authoritative state
  const handleFieldChange = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setActionResult({});
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Reorder helpers for repeatable items
  const moveItem = <T,>(arr: T[], idx: number, direction: "up" | "down"): T[] => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= arr.length) return arr;
    const copy = [...arr];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    return copy;
  };

  // Submit all project changes
  const handleSave = async (desiredStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    const targetStatus = desiredStatus || formData.status || "DRAFT";
    setActionResult({});

    // Client-side validation when attempting to publish
    if (targetStatus === "PUBLISHED") {
      const errors: Record<string, string> = {};
      if (!formData.nameEn.trim()) errors.nameEn = "English name is required to publish.";
      if (!formData.locationEn.trim()) errors.locationEn = "Location is required to publish.";
      if (!formData.shortDescriptionEn.trim()) errors.shortDescriptionEn = "Short description is required to publish.";
      if (!formData.coverImageUrl.trim()) errors.coverImageUrl = "Desktop cover image is required to publish.";

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        // Switch to the first tab that has an error
        if (errors.nameEn) setActiveTab("basic");
        else if (errors.coverImageUrl) setActiveTab("hero");
        else if (errors.shortDescriptionEn) setActiveTab("overview");
        else if (errors.locationEn) setActiveTab("location");

        setActionResult({
          error: "Please complete all required fields before publishing: " + Object.values(errors).join(" "),
        });
        return;
      }
    } else {
      // Draft mode: only require a name
      if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
        setValidationErrors({ nameEn: "Please enter an English name for the project draft." });
        setActiveTab("basic");
        setActionResult({ error: "Please enter at least an English name for this project." });
        return;
      }
    }

    startTransition(async () => {
      const fd = new FormData();
      if (projectId) fd.set("id", projectId);

      // Build safe auto slug if missing
      let finalSlug = formData.slug.trim();
      if (!finalSlug) {
        finalSlug = formData.nameEn
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/&/g, " and ")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .replace(/-+/g, "-");
      }

      Object.entries(formData).forEach(([k, v]) => {
        if (k === "status") {
          fd.set("status", targetStatus);
        } else if (k === "slug") {
          fd.set("slug", finalSlug);
        } else if (typeof v === "boolean") {
          if (v) fd.set(k, "on");
        } else {
          fd.set(k, String(v ?? ""));
        }
      });

      // Repeatable items as serialized JSON with clean sortOrder
      fd.set("keyFactsJson", JSON.stringify(keyFacts.map((item, i) => ({ ...item, sortOrder: i }))));
      fd.set("highlightsJson", JSON.stringify(highlights.map((item, i) => ({ ...item, sortOrder: i }))));
      fd.set("unitTypesJson", JSON.stringify(unitTypes.map((item, i) => ({ ...item, sortOrder: i }))));
      // Project Gallery Configuration & Repeatable Items
      fd.set("galleryEnabled", String(gallerySettings.enabled));
      fd.set("galleryTitleEn", gallerySettings.titleEn);
      fd.set("galleryTitleAr", gallerySettings.titleAr);
      fd.set("galleryIntroEn", gallerySettings.introEn);
      fd.set("galleryIntroAr", gallerySettings.introAr);
      fd.set("galleryShowFilters", String(gallerySettings.showFilters));
      fd.set("galleryShowCaptions", String(gallerySettings.showCaptions));
      fd.set("galleryLayout", gallerySettings.layout);
      if (gallerySettings.coverUrl) {
        fd.set("galleryCoverUrl", gallerySettings.coverUrl);
      }
      fd.set("galleryItemsJson", JSON.stringify(galleryItems.map((item, i) => ({ ...item, sortOrder: i }))));
      fd.set("constructionUpdatesJson", JSON.stringify(constructionUpdates.map((item, i) => ({ ...item, sortOrder: i }))));
      fd.set("connectivityJson", JSON.stringify(connectivity.map((item, i) => ({ ...item, sortOrder: i }))));

      try {
        const res = await saveProject({}, fd);
        setActionResult(res);
        if (res.success) {
          setIsDirty(false);
          setValidationErrors({});
          setFormData((prev) => ({ ...prev, status: targetStatus, slug: finalSlug }));
          if (res.projectId) {
            setProjectId(res.projectId);
            if (!projectId && typeof window !== "undefined") {
              window.history.replaceState(null, "", `/admin/projects/${res.projectId}`);
            }
          }
        }
      } catch (err: any) {
        setActionResult({ error: err.message || "An unexpected error occurred while saving." });
      }
    });
  };

  // Handle tour upload without destructive page reload
  const handleTourUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectId) {
      setTourUploadState({ error: "Please save the project draft first before uploading a visual tour." });
      return;
    }
    const form = e.currentTarget;
    const tourFd = new FormData(form);
    tourFd.set("projectId", projectId);

    setIsUploadingTour(true);
    setTourUploadState({});

    try {
      const res = await uploadProjectVisualTour({}, tourFd);
      setTourUploadState(res);
      if (res.success) {
        form.reset();
        // Append optimistic tour representation or fetch updated
        setVisualToursList((prev) => [
          ...prev,
          {
            id: `tour-${Date.now()}`,
            projectId: projectId,
            titleEn: String(tourFd.get("titleEn") || "Visual Tour"),
            titleAr: String(tourFd.get("titleAr") || "جولة افتراضية"),
            descriptionEn: String(tourFd.get("descriptionEn") || ""),
            descriptionAr: String(tourFd.get("descriptionAr") || ""),
            localeTarget: String(tourFd.get("localeTarget") || "ALL"),
            publicationState: "PUBLISHED",
            processingState: "READY",
            isDefault: tourFd.get("isDefault") === "on",
            sourceType: "HTML",
            originalFilename: "tour.zip",
            storageKey: null,
            mimeType: "application/zip",
            assetVersion: "v1",
            uploadedSize: 0,
            extractedSize: 0,
            extractedPrefix: "/uploads/tours",
            entryFilePath: "index.html",
            posterUrl: null,
            assetCount: 1,
            processingError: null,
            publishedAt: new Date(),
            sortOrder: prev.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setTourUploadState({ error: err.message || "Tour upload failed." });
    } finally {
      setIsUploadingTour(false);
    }
  };

  const previewEnUrl = formData.slug ? `/en/projects/${formData.slug}${formData.status !== "PUBLISHED" ? "?preview=true" : ""}` : "#";
  const previewArUrl = formData.slug ? `/ar/projects/${formData.slug}${formData.status !== "PUBLISHED" ? "?preview=true" : ""}` : "#";

  return (
    <div className="project-editor-container" style={{ position: "relative" }}>
      {/* Persistent Status & Action Bar */}
      <div
        className="project-editor-toolbar"
        style={{
          position: "sticky",
          top: "0",
          zIndex: 100,
          background: "#ffffff",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "12px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            className={`status-badge status-${formData.status.toLowerCase()}`}
            style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px" }}
          >
            {formData.status}
          </span>
          <span style={{ fontSize: "13px", color: isDirty ? "#b45309" : "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isDirty ? "#f59e0b" : "#22c55e" }} />
            {isPending ? "Saving..." : isDirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Live Preview Links */}
          {formData.slug && (
            <>
              <Link
                href={previewEnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                title="Preview English Project Page"
              >
                Preview EN ↗
              </Link>
              <Link
                href={previewArUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                title="Preview Arabic Project Page"
              >
                معاينة بالعربية ↗
              </Link>
            </>
          )}

          {/* Save Draft Action */}
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={isPending}
            className="secondary"
            style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600 }}
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>

          {/* Publish / Update Action */}
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={isPending}
            className="primary"
            style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 700 }}
          >
            {formData.status === "PUBLISHED" ? "Update Published Project" : "Publish Project"}
          </button>

          {/* Unpublish to Draft (if published) */}
          {formData.status === "PUBLISHED" && (
            <button
              type="button"
              onClick={() => handleSave("DRAFT")}
              disabled={isPending}
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                background: "transparent",
                border: "1px solid #d97706",
                color: "#d97706",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              title="Hide this project from the public website while retaining all content"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Notifications and Alerts */}
      {actionResult.error && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: "16px" }}>
          <strong>Error:</strong> {actionResult.error}
        </div>
      )}
      {actionResult.success && (
        <div className="admin-alert admin-alert--success" style={{ marginBottom: "16px" }}>
          <strong>Success:</strong> {actionResult.success}
        </div>
      )}

      {/* Section Navigation Tabs */}
      <nav
        className="project-editor-tabs-nav"
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--line)",
        }}
        aria-label="Project Editor Sections"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasError =
            (tab.key === "basic" && validationErrors.nameEn) ||
            (tab.key === "hero" && validationErrors.coverImageUrl) ||
            (tab.key === "overview" && validationErrors.shortDescriptionEn) ||
            (tab.key === "location" && validationErrors.locationEn);

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
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                <span style={{ fontSize: "10px", opacity: isActive ? 0.8 : 0.5 }}>{tab.number}</span>
                {hasError && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />}
              </div>
              <span>{tab.labelEn}</span>
              <span style={{ fontSize: "11px", opacity: 0.8, direction: "rtl" }}>{tab.labelAr}</span>
            </button>
          );
        })}
      </nav>

      {/* All Panels Kept Mounted in DOM — display toggled to preserve 100% of inputs */}
      <div className="admin-form-panels">
        {/* =========================================================
            TAB 1: Basic Information
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "basic" ? "block" : "none" }}>
          <h2>01. Basic Project Information</h2>
          <p className="hint">Core system identifiers, publication state, project categorization, and delivery milestone.</p>

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
              {validationErrors.nameEn && <span className="field-error" style={{ color: "#dc2626", fontSize: "12px" }}>{validationErrors.nameEn}</span>}
            </label>

            <label>
              اسم المشروع (العربية) *
              <input
                type="text"
                dir="rtl"
                value={formData.nameAr}
                onChange={(e) => handleFieldChange("nameAr", e.target.value)}
                placeholder="مثال: سولايا"
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
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

          <div className="bilingual" style={{ marginTop: "16px" }}>
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

          <div className="bilingual" style={{ marginTop: "16px" }}>
            <label>
              Project Type *
              <select value={formData.projectType} onChange={(e) => handleFieldChange("projectType", e.target.value)}>
                <option value="Residential">Residential / سكني</option>
                <option value="Commercial">Commercial / تجاري</option>
                <option value="Mixed-use">Mixed-use / متعدد الاستخدامات</option>
                <option value="Medical">Medical / طبي</option>
                <option value="Coastal">Coastal / ساحلي</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleFieldChange("featured", e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Featured on Homepage</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Order:</span>
                <input
                  type="number"
                  value={formData.featuredOrder}
                  onChange={(e) => handleFieldChange("featuredOrder", parseInt(e.target.value) || 0)}
                  style={{ width: "60px", padding: "4px 8px" }}
                />
              </label>
            </div>
          </div>
        </section>

        {/* =========================================================
            TAB 2: Hero & Branding
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "hero" ? "block" : "none" }}>
          <h2>02. Hero Section &amp; Visual Identity</h2>
          <p className="hint">Upload architectural cover photography, mobile responsive hero crop, project logo, and video assets.</p>

          <div className="bilingual">
            <label>
              Hero Impact Statement (English)
              <input
                type="text"
                value={formData.heroTitleEn}
                onChange={(e) => handleFieldChange("heroTitleEn", e.target.value)}
                placeholder="A Considered Architectural Vision"
              />
            </label>

            <label>
              العبارة الرئيسية للواجهة (العربية)
              <input
                type="text"
                dir="rtl"
                value={formData.heroTitleAr}
                onChange={(e) => handleFieldChange("heroTitleAr", e.target.value)}
                placeholder="رؤية معمارية متفردة في قلب المدينة"
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
            <label>
              Hero Introduction Deck (English)
              <textarea
                rows={3}
                value={formData.heroDescriptionEn}
                onChange={(e) => handleFieldChange("heroDescriptionEn", e.target.value)}
                placeholder="Brief narrative introducing the development..."
              />
            </label>

            <label>
              مقدمة الواجهة (العربية)
              <textarea
                rows={3}
                dir="rtl"
                value={formData.heroDescriptionAr}
                onChange={(e) => handleFieldChange("heroDescriptionAr", e.target.value)}
                placeholder="نبذة تقديمية تظهر في واجهة صفحة المشروع..."
              />
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <MediaUploadField
              name="coverImageUrl"
              label="Desktop Cover / Main Hero Image"
              value={formData.coverImageUrl}
              kind="IMAGE"
              required
              showFocalPoint
              focalPointName="coverImageFocalPoint"
              focalPointValue={formData.coverImageFocalPoint}
              altEnName="coverImageAltEn"
              altEnValue={formData.coverImageAltEn}
              altArName="coverImageAltAr"
              altArValue={formData.coverImageAltAr}
              existingAssets={assets}
              helpText="Primary architectural photograph used for project hero, cards, and social sharing."
              onChange={(url) => handleFieldChange("coverImageUrl", url)}
            />
            {validationErrors.coverImageUrl && (
              <span className="field-error" style={{ color: "#dc2626", fontSize: "12px", display: "block", marginTop: "-12px", marginBottom: "16px" }}>
                {validationErrors.coverImageUrl}
              </span>
            )}

            <MediaUploadField
              name="mobileHeroImageUrl"
              label="Mobile Hero Image (Optional Portrait Crop)"
              value={formData.mobileHeroImageUrl}
              kind="IMAGE"
              existingAssets={assets}
              helpText="Optimized vertical crop for mobile screens. If omitted, desktop cover will be used."
              onChange={(url) => handleFieldChange("mobileHeroImageUrl", url)}
            />

            <MediaUploadField
              name="heroVideoUrl"
              label="Hero Background Video (Optional MP4 / WebM)"
              value={formData.heroVideoUrl}
              kind="VIDEO"
              showPoster
              posterName="heroVideoPosterUrl"
              posterValue={formData.heroVideoPosterUrl}
              existingAssets={assets}
              helpText="Ambient looping video background for the project detail hero."
              onChange={(url) => handleFieldChange("heroVideoUrl", url)}
            />

            <div className="bilingual">
              <MediaUploadField
                name="logoUrl"
                label="Project Emblem / Logo (Optional)"
                value={formData.logoUrl}
                kind="IMAGE"
                existingAssets={assets}
                helpText="Transparent PNG or SVG mark displayed beside the project title."
                onChange={(url) => handleFieldChange("logoUrl", url)}
              />

              <MediaUploadField
                name="cardImageUrl"
                label="Portfolio Card Image (Optional override)"
                value={formData.cardImageUrl}
                kind="IMAGE"
                existingAssets={assets}
                helpText="Custom thumbnail for portfolio listing cards. Defaults to cover image if empty."
                onChange={(url) => handleFieldChange("cardImageUrl", url)}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            TAB 3: Overview & Facts
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "overview" ? "block" : "none" }}>
          <h2>03. Project Overview &amp; Key Facts</h2>
          <p className="hint">Bilingual short summary, detailed narrative, and structured key architectural facts.</p>

          <div className="bilingual">
            <label>
              Short Summary / Promise (English) *
              <textarea
                rows={3}
                value={formData.shortDescriptionEn}
                onChange={(e) => handleFieldChange("shortDescriptionEn", e.target.value)}
                placeholder="A quieter expression of modern living."
                required
              />
              {validationErrors.shortDescriptionEn && (
                <span className="field-error" style={{ color: "#dc2626", fontSize: "12px" }}>{validationErrors.shortDescriptionEn}</span>
              )}
            </label>

            <label>
              الملخص والوعد المعماري (العربية) *
              <textarea
                rows={3}
                dir="rtl"
                value={formData.shortDescriptionAr}
                onChange={(e) => handleFieldChange("shortDescriptionAr", e.target.value)}
                placeholder="تعبير أكثر هدوءاً عن حياة المدينة."
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
            <label>
              Full Architectural Concept (English)
              <textarea
                rows={6}
                value={formData.fullDescriptionEn}
                onChange={(e) => handleFieldChange("fullDescriptionEn", e.target.value)}
                placeholder="Detailed architectural story and monograph for the project detail page..."
              />
            </label>

            <label>
              السرد المعماري والقصة الكاملة (العربية)
              <textarea
                rows={6}
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
                <h3 style={{ margin: 0, fontSize: "15px", color: "var(--ink)" }}>Key Facts ({keyFacts.length})</h3>
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
                key={fact.id || `fact-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 90px",
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
                  placeholder="Label (e.g. Footprint)"
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
                  placeholder="التسمية (مثال: المساحة)"
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
                  placeholder="Value (e.g. 45 Feddan)"
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
                  placeholder="القيمة (مثال: ٤٥ فدان)"
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setKeyFacts(moveItem(keyFacts, idx, "up"));
                      setIsDirty(true);
                    }}
                    disabled={idx === 0}
                    style={{ padding: "4px 6px", fontSize: "11px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKeyFacts(moveItem(keyFacts, idx, "down"));
                      setIsDirty(true);
                    }}
                    disabled={idx === keyFacts.length - 1}
                    style={{ padding: "4px 6px", fontSize: "11px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKeyFacts(keyFacts.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            TAB 4: Highlights
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "highlights" ? "block" : "none" }}>
          <h2>04. Highlights &amp; Amenities</h2>
          <p className="hint">Curated architectural features, landscape amenities, and signature design elements.</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total highlights: {highlights.length}</span>
            <button
              type="button"
              onClick={() => {
                setHighlights((prev) => [
                  ...prev,
                  { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", imageUrl: "", sortOrder: prev.length },
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
              key={h.id || `highlight-${idx}`}
              style={{
                padding: "16px",
                background: "#fbfcfb",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong>Highlight #{idx + 1}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlights(moveItem(highlights, idx, "up"));
                      setIsDirty(true);
                    }}
                    disabled={idx === 0}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlights(moveItem(highlights, idx, "down"));
                      setIsDirty(true);
                    }}
                    disabled={idx === highlights.length - 1}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHighlights(highlights.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove ✕
                  </button>
                </div>
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

              <div style={{ marginTop: "10px" }}>
                <MediaUploadField
                  name={`highlight_image_${idx}`}
                  label="Highlight Photo (Optional)"
                  value={h.imageUrl}
                  kind="IMAGE"
                  existingAssets={assets}
                  onChange={(url) => {
                    const updated = [...highlights];
                    updated[idx].imageUrl = url;
                    setHighlights(updated);
                    setIsDirty(true);
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* =========================================================
            TAB 5: Unit Types
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "unit_types" ? "block" : "none" }}>
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
                    areaEn: "",
                    areaAr: "",
                    finishingEn: "Fully Finished",
                    finishingAr: "تشطيب كامل",
                    paymentPlanEn: "10% down payment, up to 8 years",
                    paymentPlanAr: "مقدم ١٠٪ وتقسيط حتى ٨ سنوات",
                    imageUrl: "",
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
              key={u.id || `unit-${idx}`}
              style={{
                padding: "16px",
                background: "#fbfcfb",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong>Unit #{idx + 1}: {u.titleEn || "Untitled Unit"}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypes(moveItem(unitTypes, idx, "up"));
                      setIsDirty(true);
                    }}
                    disabled={idx === 0}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypes(moveItem(unitTypes, idx, "down"));
                      setIsDirty(true);
                    }}
                    disabled={idx === unitTypes.length - 1}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypes(unitTypes.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove ✕
                  </button>
                </div>
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
                  placeholder="Unit Title (e.g. 3-Bedroom Villa)"
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
                  placeholder="اسم الوحدة (مثال: فيلا ٣ غرف)"
                />
              </div>

              <div className="bilingual" style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  value={u.areaEn}
                  onChange={(e) => {
                    const updated = [...unitTypes];
                    updated[idx].areaEn = e.target.value;
                    setUnitTypes(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Area Range (e.g. 210 – 340 sqm)"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={u.areaAr}
                  onChange={(e) => {
                    const updated = [...unitTypes];
                    updated[idx].areaAr = e.target.value;
                    setUnitTypes(updated);
                    setIsDirty(true);
                  }}
                  placeholder="المساحة (مثال: ٢١٠ - ٣٤٠ م²)"
                />
              </div>

              <div className="bilingual" style={{ marginTop: "8px" }}>
                <input
                  type="text"
                  value={u.paymentPlanEn}
                  onChange={(e) => {
                    const updated = [...unitTypes];
                    updated[idx].paymentPlanEn = e.target.value;
                    setUnitTypes(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Payment Plan (English)"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={u.paymentPlanAr}
                  onChange={(e) => {
                    const updated = [...unitTypes];
                    updated[idx].paymentPlanAr = e.target.value;
                    setUnitTypes(updated);
                    setIsDirty(true);
                  }}
                  placeholder="خطة السداد (العربية)"
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <MediaUploadField
                  name={`unit_image_${idx}`}
                  label="Unit Rendering / Floor Plan Visual"
                  value={u.imageUrl}
                  kind="IMAGE"
                  existingAssets={assets}
                  onChange={(url) => {
                    const updated = [...unitTypes];
                    updated[idx].imageUrl = url;
                    setUnitTypes(updated);
                    setIsDirty(true);
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* =========================================================
            TAB 6: Master Plan
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "master_plan" ? "block" : "none" }}>
          <h2>06. Master Plan Presentation</h2>
          <p className="hint">High-resolution architectural master layout with zoom viewer support.</p>

          <MediaUploadField
            name="masterPlanUrl"
            label="Master Plan Image Asset"
            value={formData.masterPlanUrl}
            kind="IMAGE"
            existingAssets={assets}
            helpText="Detailed masterplan schematic. Visitors can zoom and pan this image on the live page."
            onChange={(url) => handleFieldChange("masterPlanUrl", url)}
          />
        </section>

        {/* =========================================================
            TAB 7: Location & Access
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "location" ? "block" : "none" }}>
          <h2>07. Location &amp; Connectivity</h2>
          <p className="hint">Geographic coordinates, map URLs, and key driving distances to major landmarks.</p>

          <div className="bilingual">
            <label>
              Location Name (English) *
              <input
                type="text"
                value={formData.locationEn}
                onChange={(e) => handleFieldChange("locationEn", e.target.value)}
                placeholder="e.g. New Cairo"
                required
              />
              {validationErrors.locationEn && (
                <span className="field-error" style={{ color: "#dc2626", fontSize: "12px" }}>{validationErrors.locationEn}</span>
              )}
            </label>

            <label>
              اسم الموقع والمدينة (العربية) *
              <input
                type="text"
                dir="rtl"
                value={formData.locationAr}
                onChange={(e) => handleFieldChange("locationAr", e.target.value)}
                placeholder="مثال: القاهرة الجديدة"
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
            <label>
              Detailed Address (English)
              <input
                type="text"
                value={formData.addressEn}
                onChange={(e) => handleFieldChange("addressEn", e.target.value)}
                placeholder="e.g. Golden Square, North 90th Street"
              />
            </label>

            <label>
              العنوان التفصيلي (العربية)
              <input
                type="text"
                dir="rtl"
                value={formData.addressAr}
                onChange={(e) => handleFieldChange("addressAr", e.target.value)}
                placeholder="مثال: المربع الذهبي، شارع التسعين الشمالي"
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
            <label>
              Latitude Coordinate
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => handleFieldChange("latitude", e.target.value)}
                placeholder="e.g. 30.0275"
              />
            </label>

            <label>
              Longitude Coordinate
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => handleFieldChange("longitude", e.target.value)}
                placeholder="e.g. 31.4912"
              />
            </label>
          </div>

          <label style={{ marginTop: "16px" }}>
            Google Maps Destination URL
            <input
              type="text"
              value={formData.mapUrl}
              onChange={(e) => handleFieldChange("mapUrl", e.target.value)}
              placeholder="https://maps.google.com/?q=..."
            />
          </label>

          {/* Repeatable Connectivity Destinations */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", color: "var(--ink)" }}>Nearby Landmarks &amp; Access ({connectivity.length})</h3>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Driving duration to major hubs, universities, and transit axes.</span>
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
                + Add Landmark
              </button>
            </div>

            {connectivity.map((c, idx) => (
              <div
                key={c.id || `conn-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 120px 90px",
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
                  value={c.destinationEn}
                  onChange={(e) => {
                    const updated = [...connectivity];
                    updated[idx].destinationEn = e.target.value;
                    setConnectivity(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Destination (e.g. AUC Campus)"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={c.destinationAr}
                  onChange={(e) => {
                    const updated = [...connectivity];
                    updated[idx].destinationAr = e.target.value;
                    setConnectivity(updated);
                    setIsDirty(true);
                  }}
                  placeholder="الوجهة (مثال: الجامعة الأمريكية)"
                />
                <input
                  type="text"
                  value={c.distanceOrDurationEn}
                  onChange={(e) => {
                    const updated = [...connectivity];
                    updated[idx].distanceOrDurationEn = e.target.value;
                    setConnectivity(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Duration (12 mins)"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={c.distanceOrDurationAr}
                  onChange={(e) => {
                    const updated = [...connectivity];
                    updated[idx].distanceOrDurationAr = e.target.value;
                    setConnectivity(updated);
                    setIsDirty(true);
                  }}
                  placeholder="المدة (١٢ دقيقة)"
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectivity(moveItem(connectivity, idx, "up"));
                      setIsDirty(true);
                    }}
                    disabled={idx === 0}
                    style={{ padding: "4px 6px", fontSize: "11px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectivity(moveItem(connectivity, idx, "down"));
                      setIsDirty(true);
                    }}
                    disabled={idx === connectivity.length - 1}
                    style={{ padding: "4px 6px", fontSize: "11px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectivity(connectivity.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            TAB 8: Project Gallery / معرض المشروع
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "gallery" ? "block" : "none" }}>
          <h2>08. Project Gallery / معرض المشروع</h2>
          <p className="hint">
            Directly upload photos and videos, select from your media library, organize into album categories, and customize public gallery presentation.
          </p>

          <ProjectGalleryManager
            items={galleryItems}
            onChange={(newItems) => {
              setGalleryItems(newItems);
              setIsDirty(true);
            }}
            settings={gallerySettings}
            onSettingsChange={(newSettings) => {
              setGallerySettings(newSettings);
              setIsDirty(true);
            }}
            existingAssets={assets}
            projectName={formData.nameEn || "Project"}
          />
        </section>

        {/* =========================================================
            TAB 9: Construction Updates
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "construction" ? "block" : "none" }}>
          <h2>09. Construction Updates &amp; Milestones</h2>
          <p className="hint">Dated progress reports, verified photography, and onsite construction updates.</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Total updates: {constructionUpdates.length}</span>
            <button
              type="button"
              onClick={() => {
                setConstructionUpdates((prev) => [
                  ...prev,
                  {
                    date: new Date().toISOString().split("T")[0],
                    titleEn: "",
                    titleAr: "",
                    descriptionEn: "",
                    descriptionAr: "",
                    imageUrl: "",
                    isVideo: false,
                    sortOrder: prev.length,
                  },
                ]);
                setIsDirty(true);
              }}
              className="secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              + Add Construction Milestone
            </button>
          </div>

          {constructionUpdates.map((u, idx) => (
            <div
              key={u.id || `update-${idx}`}
              style={{
                padding: "16px",
                background: "#fbfcfb",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong>Milestone #{idx + 1}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setConstructionUpdates(moveItem(constructionUpdates, idx, "up"));
                      setIsDirty(true);
                    }}
                    disabled={idx === 0}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConstructionUpdates(moveItem(constructionUpdates, idx, "down"));
                      setIsDirty(true);
                    }}
                    disabled={idx === constructionUpdates.length - 1}
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConstructionUpdates(constructionUpdates.filter((_, i) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="danger"
                    style={{ padding: "3px 8px", fontSize: "11px" }}
                  >
                    Remove ✕
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: "10px" }}>
                <label>
                  Update Date *
                  <input
                    type="date"
                    value={u.date}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].date = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                    required
                  />
                </label>
                <label>
                  Milestone Title (English) *
                  <input
                    type="text"
                    value={u.titleEn}
                    onChange={(e) => {
                      const updated = [...constructionUpdates];
                      updated[idx].titleEn = e.target.value;
                      setConstructionUpdates(updated);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Concrete Pouring Completed"
                  />
                </label>
                <label>
                  عنوان المرحلة (العربية) *
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
                    placeholder="مثال: اكتمال الصبات الخرسانية"
                  />
                </label>
              </div>

              <div className="bilingual" style={{ marginTop: "10px" }}>
                <textarea
                  rows={2}
                  value={u.descriptionEn}
                  onChange={(e) => {
                    const updated = [...constructionUpdates];
                    updated[idx].descriptionEn = e.target.value;
                    setConstructionUpdates(updated);
                    setIsDirty(true);
                  }}
                  placeholder="Milestone description and progress note..."
                />
                <textarea
                  rows={2}
                  dir="rtl"
                  value={u.descriptionAr}
                  onChange={(e) => {
                    const updated = [...constructionUpdates];
                    updated[idx].descriptionAr = e.target.value;
                    setConstructionUpdates(updated);
                    setIsDirty(true);
                  }}
                  placeholder="وصف المرحلة وملاحظات التقدم الميداني..."
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <MediaUploadField
                  name={`update_media_${idx}`}
                  label="Onsite Progress Photo or Video"
                  value={u.imageUrl}
                  kind={u.isVideo ? "VIDEO" : "IMAGE"}
                  existingAssets={assets}
                  onChange={(url, asset) => {
                    const updated = [...constructionUpdates];
                    updated[idx].imageUrl = url;
                    updated[idx].isVideo = asset?.kind === "VIDEO";
                    setConstructionUpdates(updated);
                    setIsDirty(true);
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* =========================================================
            TAB 10: Brochure & CTA
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "brochure" ? "block" : "none" }}>
          <h2>10. Official Brochure Download &amp; Custom CTA</h2>
          <p className="hint">Direct PDF brochure upload and customized primary action destinations.</p>

          <MediaUploadField
            name="brochureUrl"
            label="Official Project Brochure (PDF Document)"
            value={formData.brochureUrl}
            kind="DOCUMENT"
            existingAssets={assets}
            helpText="Upload the official project catalog or PDF brochure (up to 40 MB). Visitors can download this directly from the detail page."
            onChange={(url) => handleFieldChange("brochureUrl", url)}
          />

          <div className="bilingual" style={{ marginTop: "20px" }}>
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

          <label style={{ marginTop: "14px" }}>
            Custom Target URL (Optional override)
            <input
              type="text"
              value={formData.ctaUrl}
              onChange={(e) => handleFieldChange("ctaUrl", e.target.value)}
              placeholder="e.g. https://... or leave empty to use default detail page"
            />
          </label>
        </section>

        {/* =========================================================
            TAB 11: Visual Tours
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "visual_tours" ? "block" : "none" }}>
          <h2>11. Project HTML Visual Tours (Active Content)</h2>
          <p className="hint">
            Upload self-contained HTML visual tours (.html) or complete ZIP packages (.zip) containing index.html and all local assets.
            Tours are automatically processed with strict path traversal defenses and hosted in sandboxed viewers.
          </p>

          {!projectId ? (
            <div style={{ padding: "24px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "20px" }}>
              <strong style={{ color: "#92400e", display: "block", marginBottom: "6px" }}>Save Draft First</strong>
              <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#92400e" }}>
                Visual tours require an assigned project record. Save your current edits as a draft to upload and manage tours.
              </p>
              <button
                type="button"
                onClick={() => handleSave("DRAFT")}
                disabled={isPending}
                className="primary"
                style={{ fontSize: "12px", padding: "8px 16px" }}
              >
                {isPending ? "Saving Draft..." : "Save Draft & Enable Tours"}
              </button>
            </div>
          ) : (
            <>
              {/* Existing visual tours list */}
              {visualToursList.length > 0 ? (
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>
                    Configured Visual Tours ({visualToursList.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {visualToursList.map((tour) => (
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
                          <form
                            action={async (fd) => {
                              if (confirm(`Delete visual tour "${tour.titleEn}"? This removes all extracted files.`)) {
                                await deleteProjectVisualTour(fd);
                                setVisualToursList((prev) => prev.filter((t) => t.id !== tour.id));
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={tour.id} />
                            <button
                              type="submit"
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
                      <input type="checkbox" name="isDefault" defaultChecked={!visualToursList.length} />
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
            </>
          )}
        </section>

        {/* =========================================================
            TAB 12: SEO & Publishing
        ========================================================= */}
        <section className="panel" style={{ display: activeTab === "seo" ? "block" : "none" }}>
          <h2>12. Search Engine Optimization &amp; Social Previews</h2>
          <p className="hint">Custom meta titles, descriptions, and OpenGraph social sharing image.</p>

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
                placeholder="سولايا — إيمدج للتطوير العقاري"
              />
            </label>
          </div>

          <div className="bilingual" style={{ marginTop: "16px" }}>
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

          <div style={{ marginTop: "16px" }}>
            <MediaUploadField
              name="ogImageUrl"
              label="Social Sharing (OpenGraph) Image"
              value={formData.ogImageUrl}
              kind="IMAGE"
              existingAssets={assets}
              helpText="Image preview used when sharing this project link on Facebook, LinkedIn, Twitter, and WhatsApp. Defaults to cover image if empty."
              onChange={(url) => handleFieldChange("ogImageUrl", url)}
            />
          </div>
        </section>
      </div>

      {/* Persistent Bottom Save Bar */}
      <div
        style={{
          marginTop: "28px",
          paddingTop: "20px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={isPending}
            className="secondary"
            style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600 }}
          >
            {isPending ? "Saving Draft..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("PUBLISHED")}
            disabled={isPending}
            className="primary"
            style={{ padding: "10px 22px", fontSize: "13px", fontWeight: 700 }}
          >
            {formData.status === "PUBLISHED" ? "Save & Keep Published" : "Publish Project"}
          </button>
        </div>

        <Link href="/admin/projects" className="secondary" style={{ padding: "10px 16px", fontSize: "13px" }}>
          ← Cancel &amp; Return to Projects List
        </Link>
      </div>

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
