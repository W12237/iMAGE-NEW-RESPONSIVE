import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/session", () => ({
  requireAdmin: vi.fn(),
  getAdmin: vi.fn().mockResolvedValue({ id: "admin-qa-id", email: "admin@image.local" }),
}));
import { prisma } from "./prisma";
import { processAndStoreMedia, ALLOWED_MEDIA_TYPES, hasValidSignature, normalizeMimeType } from "./storage";
import { processVisualTourUpload, deleteVisualTourAssets } from "./tours";
import { saveProject } from "@/app/admin/actions";
import { getProjectDetailContent, getProjectsPageContent } from "./content";
import fs from "fs/promises";
import path from "path";

// Helpers to build valid binary fixtures in-memory
function createJpegFixture(): Uint8Array {
  // SOI (0xFF, 0xD8), APP0 marker (0xFF, 0xE0), length 16, JFIF header
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
}

function createPngFixture(): Uint8Array {
  // PNG signature
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
}

function createWebpFixture(): Uint8Array {
  // RIFF .... WEBP
  const buf = new Uint8Array(16);
  buf.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  buf.set([0x08, 0x00, 0x00, 0x00], 4); // size
  buf.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  buf.set([0x56, 0x50, 0x38, 0x20], 12); // VP8
  return buf;
}

function createAvifFixture(): Uint8Array {
  // ....ftypavif
  const buf = new Uint8Array(16);
  buf.set([0x00, 0x00, 0x00, 0x1c], 0); // box size
  buf.set([0x66, 0x74, 0x79, 0x70], 4); // ftyp
  buf.set([0x61, 0x76, 0x69, 0x66], 8); // avif
  buf.set([0x00, 0x00, 0x00, 0x00], 12);
  return buf;
}

function createMp4Fixture(): Uint8Array {
  // ....ftypmp42
  const buf = new Uint8Array(16);
  buf.set([0x00, 0x00, 0x00, 0x18], 0); // box size
  buf.set([0x66, 0x74, 0x79, 0x70], 4); // ftyp
  buf.set([0x6d, 0x70, 0x34, 0x32], 8); // mp42
  buf.set([0x00, 0x00, 0x00, 0x00], 12);
  return buf;
}

function createWebmFixture(): Uint8Array {
  // EBML header: 0x1A, 0x45, 0xDF, 0xA3
  return new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]);
}

function createPdfFixture(): Uint8Array {
  // %PDF-1.4
  return new TextEncoder().encode("%PDF-1.4\n%EOF\n");
}

describe("Complete Project Creation, Editing, Media & Publishing Workflow (QA Suite)", () => {
  const testProjectSlug = "qa-automated-destination";
  let createdProjectId: string | null = null;
  const createdMediaIds: string[] = [];

  afterAll(async () => {
    // Clean up test records
    if (createdProjectId) {
      await prisma.projectRedirect.deleteMany({ where: { targetSlug: testProjectSlug } });
      await prisma.projectVisualTour.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectKeyFact.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectHighlight.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectUnitType.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectGalleryItem.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectConstructionUpdate.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectConnectivity.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.project.deleteMany({ where: { id: createdProjectId } });
    }

    if (createdMediaIds.length > 0) {
      await prisma.mediaAsset.deleteMany({ where: { id: { in: createdMediaIds } } });
    }
  });

  // -------------------------------------------------------------
  // 1. Media Validation & Upload Pipeline
  // -------------------------------------------------------------
  describe("Media Storage & Upload Pipeline Validation", () => {
    it("validates and accepts valid JPEG fixtures", async () => {
      const bytes = createJpegFixture();
      expect(hasValidSignature(bytes, "image/jpeg")).toBe(true);

      const file = new File([bytes as any], "architectural-facade.jpg", { type: "image/jpeg" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      expect(result.asset?.kind).toBe("IMAGE");
      expect(result.asset?.url).toMatch(/^\/uploads\//);
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts valid PNG fixtures", async () => {
      const bytes = createPngFixture();
      expect(hasValidSignature(bytes, "image/png")).toBe(true);

      const file = new File([bytes as any], "project-emblem.png", { type: "image/png" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      expect(result.asset?.kind).toBe("IMAGE");
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts valid WebP fixtures", async () => {
      const bytes = createWebpFixture();
      expect(hasValidSignature(bytes, "image/webp")).toBe(true);

      const file = new File([bytes as any], "interior-lounge.webp", { type: "image/webp" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts valid AVIF fixtures", async () => {
      const bytes = createAvifFixture();
      expect(hasValidSignature(bytes, "image/avif")).toBe(true);

      const file = new File([bytes as any], "landscape-view.avif", { type: "image/avif" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts compatible MP4 video files", async () => {
      const bytes = createMp4Fixture();
      expect(hasValidSignature(bytes, "video/mp4")).toBe(true);

      const file = new File([bytes as any], "drone-flyover.mp4", { type: "video/mp4" });
      const result = await processAndStoreMedia(file, "VIDEO");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      expect(result.asset?.kind).toBe("VIDEO");
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts compatible WebM video files", async () => {
      const bytes = createWebmFixture();
      expect(hasValidSignature(bytes, "video/webm")).toBe(true);

      const file = new File([bytes as any], "architectural-loop.webm", { type: "video/webm" });
      const result = await processAndStoreMedia(file, "VIDEO");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      expect(result.asset?.kind).toBe("VIDEO");
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("validates and accepts PDF project brochures", async () => {
      const bytes = createPdfFixture();
      expect(hasValidSignature(bytes, "application/pdf")).toBe(true);

      const file = new File([bytes as any], "luxury-brochure.pdf", { type: "application/pdf" });
      const result = await processAndStoreMedia(file, "DOCUMENT");
      expect(result.error).toBeUndefined();
      expect(result.asset).toBeDefined();
      expect(result.asset?.kind).toBe("DOCUMENT");
      if (result.asset) createdMediaIds.push(result.asset.id);
    });

    it("accurately detects and rejects Apple HEIC with actionable guidance", async () => {
      const file = new File([new Uint8Array([0, 1, 2, 3])], "IMG_4901.heic", { type: "image/heic" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toContain("Apple HEIC/HEIF photo format is not supported");
      expect(result.error).toContain("convert or export");
    });

    it("rejects corrupted files where binary magic bytes do not match extension", async () => {
      const fakeBytes = new TextEncoder().encode("Not a real JPEG image file");
      const file = new File([fakeBytes], "corrupted.jpg", { type: "image/jpeg" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toContain("file content does not match its reported format");
    });

    it("rejects files exceeding maximum size threshold", async () => {
      const rule = ALLOWED_MEDIA_TYPES["image/jpeg"];
      const oversizedBytes = new Uint8Array(rule.maxBytes + 1024);
      // Valid start
      oversizedBytes.set([0xff, 0xd8, 0xff, 0xe0]);
      const file = new File([oversizedBytes as any], "giant-hero.jpg", { type: "image/jpeg" });
      const result = await processAndStoreMedia(file, "IMAGE");
      expect(result.error).toContain("exceeds the maximum size limit");
    });
  });

  // -------------------------------------------------------------
  // 2. Project Creation & Tab-Safe Persistence Workflow
  // -------------------------------------------------------------
  describe("Project Creation & Draft Persistence", () => {
    it("allows creating an incomplete initial draft with minimal input", async () => {
      const fd = new FormData();
      fd.set("nameEn", "QA Automated Destination");
      fd.set("nameAr", "وجهة الفحص الآلي");
      fd.set("status", "DRAFT");

      const res = await saveProject({}, fd);
      expect(res.error).toBeUndefined();
      expect(res.success).toBeDefined();
      expect(res.projectId).toBeDefined();
      createdProjectId = res.projectId!;

      const saved = await prisma.project.findUnique({
        where: { id: createdProjectId },
      });
      expect(saved).not.toBeNull();
      expect(saved?.status).toBe("DRAFT");
      expect(saved?.nameEn).toBe("QA Automated Destination");
      expect(saved?.slug).toBe(testProjectSlug);
    });

    it("saves and persists distinct data across all editor tabs without data loss", async () => {
      expect(createdProjectId).toBeDefined();

      const fd = new FormData();
      fd.set("id", createdProjectId!);
      fd.set("slug", testProjectSlug);
      fd.set("status", "DRAFT");
      fd.set("nameEn", "QA Automated Destination");
      fd.set("nameAr", "وجهة الفحص الآلي");

      // Hero & Branding tab
      fd.set("heroTitleEn", "Visionary Architecture");
      fd.set("heroTitleAr", "عمارة ذات رؤية");
      fd.set("heroDescriptionEn", "Exclusive sanctuaries designed for distinguished living.");
      fd.set("heroDescriptionAr", "ملاذات سكنية حصرية صُممت لحياة استثنائية.");
      fd.set("coverImageUrl", "/uploads/hero-test.jpg");
      fd.set("mobileHeroImageUrl", "/uploads/hero-mobile-test.jpg");
      fd.set("heroVideoUrl", "/uploads/hero-video-test.mp4");
      fd.set("logoUrl", "/uploads/logo-test.png");
      fd.set("cardImageUrl", "/uploads/card-test.jpg");

      // Overview tab
      fd.set("shortDescriptionEn", "Modern community in New Cairo.");
      fd.set("shortDescriptionAr", "مجتمع عصري في القاهرة الجديدة.");
      fd.set("fullDescriptionEn", "Full comprehensive description spanning multiple architectural details.");
      fd.set("fullDescriptionAr", "وصف تفصيلي شامل يتناول مختلف الجوانب المعمارية للمشروع.");
      fd.set("projectType", "Mixed-Use");
      fd.set("progressStatus", "Under Construction");

      // Repeatable Key Facts
      fd.set(
        "keyFactsJson",
        JSON.stringify([
          { labelEn: "Total Area", labelAr: "المساحة الإجمالية", valueEn: "85", valueAr: "٨٥", unitEn: "Acres", unitAr: "فدان" },
          { labelEn: "Greenery", labelAr: "المساحات الخضراء", valueEn: "82", valueAr: "٨٢", unitEn: "%", unitAr: "٪" },
        ])
      );

      // Repeatable Highlights
      fd.set(
        "highlightsJson",
        JSON.stringify([
          { titleEn: "Central Park", titleAr: "الحديقة المركزية", descriptionEn: "Vibrant botanical park.", descriptionAr: "حديقة نباتية نابضة." },
        ])
      );

      // Repeatable Unit Types
      fd.set(
        "unitTypesJson",
        JSON.stringify([
          { titleEn: "Sky Villa", titleAr: "سكاي فيلا", areaRange: "320 - 450 sqm", finishingEn: "Fully Finished", finishingAr: "تشطيب كامل", paymentPlanEn: "10% Down Payment", paymentPlanAr: "١٠٪ مقدم" },
        ])
      );

      // Master Plan
      fd.set("masterPlanUrl", "/uploads/masterplan-test.jpg");

      // Location & Access
      fd.set("locationEn", "New Cairo, Golden Square");
      fd.set("locationAr", "القاهرة الجديدة، المربع الذهبي");
      fd.set("latitude", "30.0131");
      fd.set("longitude", "31.4988");
      fd.set(
        "connectivityJson",
        JSON.stringify([
          { destinationEn: "AUC Campus", destinationAr: "الجامعة الأمريكية", distanceOrDurationEn: "7 mins", distanceOrDurationAr: "٧ دقائق", travelType: "CAR" },
        ])
      );

      // Project Gallery (Mixed Image and Video)
      fd.set("galleryEnabled", "true");
      fd.set("galleryTitleEn", "Architectural Impressions");
      fd.set("galleryTitleAr", "لقطات معمارية");
      fd.set("galleryIntroEn", "A curated visual walkthrough of the residence.");
      fd.set("galleryIntroAr", "جولة بصرية مختارة للمشروع.");
      fd.set("galleryLayout", "grid");
      fd.set(
        "galleryItemsJson",
        JSON.stringify([
          { imageUrl: "/uploads/render-1.jpg", category: "RENDERS", captionEn: "Grand Plaza", captionAr: "الساحة الكبرى", isVideo: false },
          { imageUrl: "/uploads/interior-1.jpg", category: "INTERIOR", captionEn: "Double-height living", captionAr: "غرفة معيشة بارتفاع مزدوج", isVideo: false },
          { imageUrl: "/uploads/walkthrough.mp4", videoUrl: "/uploads/walkthrough.mp4", category: "RENDERS", captionEn: "Evening Walkthrough", captionAr: "جولة مسائية", isVideo: true },
        ])
      );

      // Construction Updates
      fd.set(
        "constructionUpdatesJson",
        JSON.stringify([
          { date: "2026-03-01", titleEn: "Foundations Complete", titleAr: "اكتمال الأساسات", isVideo: false },
        ])
      );

      // Brochure & CTA
      fd.set("brochureUrl", "/uploads/official-brochure.pdf");
      fd.set("ctaLabelEn", "Schedule Private Viewing");
      fd.set("ctaLabelAr", "حجز موعد للمعاينة");
      fd.set("ctaUrl", "/contact?project=qa-automated");

      // SEO
      fd.set("seoTitleEn", "QA Automated Destination | Image Developments");
      fd.set("seoTitleAr", "وجهة الفحص الآلي | إيمدج للتطوير العقاري");
      fd.set("seoDescriptionEn", "Exclusive architectural monograph.");
      fd.set("seoDescriptionAr", "توثيق معماري حصري للمشروع.");

      const res = await saveProject({}, fd);
      expect(res.error).toBeUndefined();
      expect(res.success).toBeDefined();

      // Verify persistence in database
      const project = await prisma.project.findUnique({
        where: { id: createdProjectId! },
        include: {
          keyFactsList: true,
          highlightsList: true,
          unitTypesList: true,
          galleryItemList: true,
          constructionUpdatesList: true,
          connectivityList: true,
        },
      });

      expect(project).not.toBeNull();
      expect(project?.heroTitleEn).toBe("Visionary Architecture");
      expect(project?.heroTitleAr).toBe("عمارة ذات رؤية");
      expect(project?.coverImageUrl).toBe("/uploads/hero-test.jpg");
      expect(project?.brochureUrl).toBe("/uploads/official-brochure.pdf");
      expect(project?.galleryTitleEn).toBe("Architectural Impressions");
      expect(project?.keyFactsList.length).toBe(2);
      expect(project?.highlightsList.length).toBe(1);
      expect(project?.unitTypesList.length).toBe(1);
      expect(project?.galleryItemList.length).toBe(3);
      expect(project?.constructionUpdatesList.length).toBe(1);
      expect(project?.connectivityList.length).toBe(1);
    });

    it("keeps draft projects private from public listings until published", async () => {
      // Query public listing
      const publicProjects = await getProjectsPageContent("en");
      const inList = publicProjects.projects.find((p) => p.slug === testProjectSlug);
      expect(inList).toBeUndefined();

      // Query public detail page (should return null when not published)
      const publicDetail = await getProjectDetailContent("en", testProjectSlug, false);
      expect(publicDetail).toBeNull();

      // Preview mode should allow admin viewing
      const previewDetail = await getProjectDetailContent("en", testProjectSlug, true);
      expect(previewDetail).not.toBeNull();
      expect(previewDetail?.project.name).toBe("QA Automated Destination");
    });

    it("publishes project and renders complete bilingual content to public visitors", async () => {
      expect(createdProjectId).toBeDefined();

      // Publish project
      const fd = new FormData();
      fd.set("id", createdProjectId!);
      fd.set("slug", testProjectSlug);
      fd.set("status", "PUBLISHED");
      fd.set("nameEn", "QA Automated Destination");
      fd.set("nameAr", "وجهة الفحص الآلي");
      fd.set("shortDescriptionEn", "Modern community in New Cairo.");
      fd.set("shortDescriptionAr", "مجتمع عصري في القاهرة الجديدة.");
      fd.set("locationEn", "New Cairo, Golden Square");
      fd.set("locationAr", "القاهرة الجديدة، المربع الذهبي");
      fd.set("coverImageUrl", "/uploads/hero-test.jpg");

      const res = await saveProject({}, fd);
      expect(res.error).toBeUndefined();
      expect(res.success).toBeDefined();

      // Verify public query now returns the published project
      const publicDetailEn = await getProjectDetailContent("en", testProjectSlug, false);
      expect(publicDetailEn).not.toBeNull();
      expect(publicDetailEn?.project.name).toBe("QA Automated Destination");
      expect(publicDetailEn?.project.location).toBe("New Cairo, Golden Square");
      expect(publicDetailEn?.project.gallerySettings?.title).toBe("Architectural Impressions");
      expect(publicDetailEn?.project.galleryItems?.length).toBe(3);

      const publicDetailAr = await getProjectDetailContent("ar", testProjectSlug, false);
      expect(publicDetailAr).not.toBeNull();
      expect(publicDetailAr?.project.name).toBe("وجهة الفحص الآلي");
      expect(publicDetailAr?.project.location).toBe("القاهرة الجديدة، المربع الذهبي");
      expect(publicDetailAr?.project.gallerySettings?.title).toBe("لقطات معمارية");
    });

    it("unpublishes project safely and removes public access immediately", async () => {
      expect(createdProjectId).toBeDefined();

      const fd = new FormData();
      fd.set("id", createdProjectId!);
      fd.set("slug", testProjectSlug);
      fd.set("status", "DRAFT");
      fd.set("nameEn", "QA Automated Destination");

      const res = await saveProject({}, fd);
      expect(res.error).toBeUndefined();

      const publicDetail = await getProjectDetailContent("en", testProjectSlug, false);
      expect(publicDetail).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. Visual Tour Workflow Verification
  // -------------------------------------------------------------
  describe("Visual Tour Sandbox Verification", () => {
    let createdTourId: string | null = null;

    afterAll(async () => {
      if (createdTourId) {
        await deleteVisualTourAssets(createdTourId).catch(() => undefined);
        await prisma.projectVisualTour.deleteMany({ where: { id: createdTourId } });
      }
    });

    it("uploads and verifies a standalone HTML visual tour", async () => {
      const htmlContent = `<!DOCTYPE html><html><head><title>360 Tour</title></head><body><div id="viewer">Panorama</div></body></html>`;
      const file = new File([new TextEncoder().encode(htmlContent)], "panorama.html", { type: "text/html" });

      const result = await processVisualTourUpload(file);
      expect(result.success).toBe(true);
      expect(result.sourceType).toBe("HTML");
      expect(result.tourId).toBeDefined();
      createdTourId = result.tourId!;

      // Verify file exists on disk
      const filePath = path.join(process.cwd(), "public", "tours", result.tourId!, "index.html");
      const diskContent = await fs.readFile(filePath, "utf8");
      expect(diskContent).toContain("360 Tour");
    });

    it("rejects malicious visual tour archives attempting directory traversal", async () => {
      // Simulate invalid file with traversal name
      const file = new File([new Uint8Array([1, 2, 3])], "../evil.html", { type: "text/html" });
      const result = await processVisualTourUpload(file);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
