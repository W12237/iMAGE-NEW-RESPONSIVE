"use client";

import React, { useState, useRef, useId } from "react";
import type { UploadedMedia } from "@/app/admin/actions";

export interface GalleryItemData {
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
  focalPoint?: string;
  visible?: boolean;
  mediaAssetId?: string;
  sortOrder?: number;
  filename?: string;
  status?: "ready" | "uploading" | "failed";
  errorMessage?: string;
}

export interface GallerySettingsData {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  introEn: string;
  introAr: string;
  showFilters: boolean;
  showCaptions: boolean;
  layout: "grid" | "carousel";
  coverUrl?: string;
}

interface ProjectGalleryManagerProps {
  items: GalleryItemData[];
  onChange: (items: GalleryItemData[]) => void;
  settings: GallerySettingsData;
  onSettingsChange: (settings: GallerySettingsData) => void;
  existingAssets: UploadedMedia[];
  projectName?: string;
}

const CATEGORIES = [
  { value: "RENDERS", labelEn: "Renders", labelAr: "التصميمات المعمارية" },
  { value: "CONSTRUCTION", labelEn: "Construction", labelAr: "أعمال الموقع" },
  { value: "INTERIOR", labelEn: "Interiors", labelAr: "التصميم الداخلي" },
  { value: "MASTER_PLAN", labelEn: "Master Plan", labelAr: "المخطط العام" },
];

export function ProjectGalleryManager({
  items,
  onChange,
  settings,
  onSettingsChange,
  existingAssets,
  projectName = "Project",
}: ProjectGalleryManagerProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedLibraryUrls, setSelectedLibraryUrls] = useState<string[]>([]);

  // Item being replaced
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Expanded details drawer for individual items
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Upload state feedback
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Validate files before upload
  const validateFile = (file: File): { valid: boolean; error?: string; isVideo?: boolean } => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (type === "image/heic" || name.endsWith(".heic") || name.endsWith(".heif")) {
      return {
        valid: false,
        error: "Apple HEIC/HEIF photo format is not supported directly by web browsers. Please export or convert your photo to JPEG, PNG, or WebP before uploading.",
      };
    }

    const isImage =
      type.startsWith("image/") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp") ||
      name.endsWith(".avif");

    const isVideo =
      type.startsWith("video/") ||
      name.endsWith(".mp4") ||
      name.endsWith(".webm");

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: `"${file.name}" is not a supported format. Please upload JPEG, PNG, WebP, AVIF images or MP4, WebM videos.`,
      };
    }

    // Size checks: 30MB for images, 150MB for videos
    const maxSize = isVideo ? 150 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `"${file.name}" exceeds the maximum allowed size of ${isVideo ? "150MB" : "30MB"}.`,
      };
    }

    return { valid: true, isVideo };
  };

  // Upload a single file to /api/admin/media/upload
  const uploadSingleFile = async (file: File): Promise<{ url: string; assetId?: string; isVideo: boolean; name: string }> => {
    const val = validateFile(file);
    if (!val.valid) throw new Error(val.error);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", val.isVideo ? "VIDEO" : "IMAGE");

    const res = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      url: data.asset?.url || data.url,
      assetId: data.asset?.id,
      isVideo: val.isVideo || false,
      name: file.name,
    };
  };

  // Handle uploading multiple files
  const handleFilesSelected = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);

    const placeholderItems: GalleryItemData[] = fileArray.map((file, idx) => {
      const val = validateFile(file);
      return {
        id: `temp-${Date.now()}-${idx}`,
        imageUrl: "",
        category: "RENDERS",
        filename: file.name,
        isVideo: val.isVideo || false,
        status: "uploading",
        visible: true,
        sortOrder: items.length + idx,
      };
    });

    // Append placeholder cards immediately to show live progress
    const updated = [...items, ...placeholderItems];
    onChange(updated);

    const newItems = [...updated];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const targetIdx = items.length + i;
      try {
        const result = await uploadSingleFile(file);
        newItems[targetIdx] = {
          ...newItems[targetIdx],
          imageUrl: result.url,
          videoUrl: result.isVideo ? result.url : undefined,
          mediaAssetId: result.assetId,
          isVideo: result.isVideo,
          status: "ready",
          captionEn: "",
          captionAr: "",
          altEn: `${projectName} gallery photo`,
          altAr: `صورة من معرض ${projectName}`,
        };
      } catch (err: any) {
        newItems[targetIdx] = {
          ...newItems[targetIdx],
          status: "failed",
          errorMessage: err.message || "Upload failed",
        };
      }
      onChange([...newItems]);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Replace a specific gallery item's media asset
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (replacingIndex === null || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const result = await uploadSingleFile(file);
      const next = [...items];
      next[replacingIndex] = {
        ...next[replacingIndex],
        imageUrl: result.url,
        videoUrl: result.isVideo ? result.url : undefined,
        isVideo: result.isVideo,
        mediaAssetId: result.assetId,
        filename: result.name,
        status: "ready",
      };
      onChange(next);
      setReplacingIndex(null);
    } catch (err: any) {
      alert(`Replacement failed: ${err.message}`);
    }
  };

  // Reorder operations
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  // Remove item
  const handleRemove = (index: number) => {
    if (window.confirm("Remove this item from the project gallery? The media file will remain safely in your Media Library.")) {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
      if (expandedIndex === index) setExpandedIndex(null);
    }
  };

  // Update item field
  const handleUpdateItem = (index: number, patch: Partial<GalleryItemData>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  // Drag and drop event handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Choose from Media Library
  const handleAddFromLibrary = () => {
    const toAdd: GalleryItemData[] = selectedLibraryUrls.map((url, i) => {
      const asset = existingAssets.find((a) => a.url === url);
      const isVideo = asset?.kind === "VIDEO" || url.endsWith(".mp4") || url.endsWith(".webm");
      return {
        id: `lib-${Date.now()}-${i}`,
        imageUrl: url,
        videoUrl: isVideo ? url : undefined,
        isVideo,
        category: "RENDERS",
        captionEn: "",
        captionAr: "",
        altEn: `${projectName} view`,
        altAr: `مشهد من ${projectName}`,
        posterUrl: undefined,
        focalPoint: "center",
        mediaAssetId: asset?.id,
        visible: true,
        status: "ready",
        sortOrder: items.length + i,
      };
    });

    onChange([...items, ...toAdd]);
    setSelectedLibraryUrls([]);
    setLibraryModalOpen(false);
  };

  // Filtered library assets
  const filteredLibraryAssets = existingAssets.filter((asset) => {
    if (libraryFilter === "IMAGE" && asset.kind !== "IMAGE") return false;
    if (libraryFilter === "VIDEO" && asset.kind !== "VIDEO") return false;
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      const matchName = asset.filename?.toLowerCase().includes(q);
      const matchUrl = asset.url?.toLowerCase().includes(q);
      if (!matchName && !matchUrl) return false;
    }
    return true;
  });

  return (
    <div className="project-gallery-manager" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* =========================================================
          1. Project-Level Gallery Settings Panel
      ========================================================= */}
      <div
        className="gallery-settings-panel"
        style={{
          background: "#ffffff",
          border: "1px solid var(--line, #dfe4dc)",
          borderRadius: "10px",
          padding: "20px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--forest, #233d2c)", fontWeight: 600 }}>
              Project Gallery Section Configuration / إعدادات المعرض
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--muted, #5e6b63)" }}>
              Customize the public gallery heading, category filters, captions, and presentation layout.
            </p>
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "var(--forest, #233d2c)" }}
            />
            <span style={{ color: settings.enabled ? "var(--forest, #233d2c)" : "var(--muted, #5e6b63)" }}>
              {settings.enabled ? "Gallery Section: ENABLED" : "Gallery Section: DISABLED"}
            </span>
          </label>
        </div>

        {settings.enabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "14px", borderTop: "1px solid #edf1ea" }}>
            {/* Bilingual Title */}
            <div className="bilingual" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 600 }}>
                Section Title (English)
                <input
                  type="text"
                  value={settings.titleEn}
                  onChange={(e) => onSettingsChange({ ...settings, titleEn: e.target.value })}
                  placeholder="Project Gallery / Immersive Visual Experience"
                  style={{ padding: "8px 12px", border: "1px solid var(--line, #dfe4dc)", borderRadius: "6px" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 600 }}>
                عنوان القسم (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={settings.titleAr}
                  onChange={(e) => onSettingsChange({ ...settings, titleAr: e.target.value })}
                  placeholder="معرض المشروع / تفاصيل تلهم التجربة"
                  style={{ padding: "8px 12px", border: "1px solid var(--line, #dfe4dc)", borderRadius: "6px" }}
                />
              </label>
            </div>

            {/* Bilingual Intro */}
            <div className="bilingual" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 600 }}>
                Section Introduction (English)
                <input
                  type="text"
                  value={settings.introEn}
                  onChange={(e) => onSettingsChange({ ...settings, introEn: e.target.value })}
                  placeholder="A curated look into the architectural vision, interior craft, and construction progress."
                  style={{ padding: "8px 12px", border: "1px solid var(--line, #dfe4dc)", borderRadius: "6px" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 600 }}>
                مقدمة القسم (العربية)
                <input
                  type="text"
                  dir="rtl"
                  value={settings.introAr}
                  onChange={(e) => onSettingsChange({ ...settings, introAr: e.target.value })}
                  placeholder="نظرة معمقة في الرؤية المعمارية، والتصميمات الداخلية، ومراحل الإنجاز في الموقع."
                  style={{ padding: "8px 12px", border: "1px solid var(--line, #dfe4dc)", borderRadius: "6px" }}
                />
              </label>
            </div>

            {/* Display Options & Layout Preset */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", background: "#f8faf9", padding: "12px 16px", borderRadius: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.showFilters}
                  onChange={(e) => onSettingsChange({ ...settings, showFilters: e.target.checked })}
                  style={{ accentColor: "var(--forest, #233d2c)" }}
                />
                <span>Show Category Filter Tabs</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={settings.showCaptions}
                  onChange={(e) => onSettingsChange({ ...settings, showCaptions: e.target.checked })}
                  style={{ accentColor: "var(--forest, #233d2c)" }}
                />
                <span>Show Captions on Public Cards</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginInlineStart: "auto" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--forest, #233d2c)" }}>Layout Preset:</span>
                <select
                  value={settings.layout}
                  onChange={(e) => onSettingsChange({ ...settings, layout: e.target.value as "grid" | "carousel" })}
                  style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "12.5px", border: "1px solid var(--line, #dfe4dc)" }}
                >
                  <option value="grid">Balanced Architectural Grid</option>
                  <option value="carousel">Interactive Horizontal Carousel</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          2. Drag-and-Drop Multi-file Uploader & Actions Bar
      ========================================================= */}
      <div
        className={`gallery-uploader-dropzone ${isDragging ? "is-dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: isDragging ? "2px dashed #b36f55" : "2px dashed #cfd6ce",
          background: isDragging ? "rgba(179, 111, 85, 0.05)" : "#fcfbfa",
          borderRadius: "12px",
          padding: "32px 24px",
          textAlign: "center",
          transition: "all 0.2s ease",
          position: "relative",
        }}
      >
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          style={{ display: "none" }}
        />

        {/* Hidden input for single-file replacement */}
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          onChange={handleReplaceFile}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#edf1ea",
              display: "grid",
              placeItems: "center",
              color: "var(--forest, #233d2c)",
              fontSize: "22px",
            }}
          >
            📸
          </div>

          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "var(--forest, #233d2c)" }}>
              Drag &amp; Drop Images or Videos Here
            </h4>
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--muted, #5e6b63)" }}>
              Select multiple files from your computer or choose from your existing Media Library.
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#8a968e" }}>
              Supported: JPEG, PNG, WebP, AVIF, MP4, WebM • Max 30MB per image, 150MB per video
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>{isUploading ? "Uploading Files..." : "↑ Upload Images & Videos"}</span>
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSelectedLibraryUrls([]);
                setLibraryModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <span>🖼️ Choose from Media Library ({existingAssets.length})</span>
            </button>
          </div>

          {uploadError && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 14px",
                borderRadius: "6px",
                background: "#fef2f2",
                color: "#991b1b",
                fontSize: "12px",
                border: "1px solid #fecaca",
                textAlign: "start",
                maxWidth: "600px",
              }}
            >
              <strong>Upload Notice:</strong> {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          3. Gallery Overview & Album Filter Summary
      ========================================================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "12px 18px",
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid var(--line, #dfe4dc)",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", fontSize: "12.5px" }}>
          <strong style={{ color: "var(--forest, #233d2c)" }}>Total Items: {items.length}</strong>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Images: {items.filter((i) => !i.isVideo).length}</span>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Videos: {items.filter((i) => i.isVideo).length}</span>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Renders: {items.filter((i) => i.category === "RENDERS").length}</span>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Construction: {items.filter((i) => i.category === "CONSTRUCTION").length}</span>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Interiors: {items.filter((i) => i.category === "INTERIOR").length}</span>
          <span style={{ color: "#a5b0a7" }}>•</span>
          <span style={{ color: "var(--muted)" }}>Visible: {items.filter((i) => i.visible !== false).length}</span>
        </div>

        {items.length > 1 && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (window.confirm("Reverse the display order of all gallery items?")) {
                onChange([...items].reverse());
              }
            }}
            style={{ fontSize: "11.5px", padding: "4px 10px" }}
          >
            ⇅ Reverse Order
          </button>
        )}
      </div>

      {/* =========================================================
          4. Visual Media Cards List
      ========================================================= */}
      {items.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px dashed var(--line, #dfe4dc)",
          }}
        >
          <p style={{ margin: "0 0 14px", color: "var(--muted, #5e6b63)", fontSize: "14px" }}>
            No gallery items attached to this project yet.
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#8a968e" }}>
            Use the upload area above or select existing photos and videos from your library to build the project gallery.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const isCover = settings.coverUrl === item.imageUrl;

            return (
              <div
                key={item.id || `gallery-item-${idx}`}
                className={`gallery-admin-card ${item.visible === false ? "is-hidden" : ""}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr",
                  gap: "20px",
                  padding: "16px 20px",
                  background: item.visible === false ? "#faf9f8" : "#ffffff",
                  border: isCover ? "2px solid #b36f55" : "1px solid var(--line, #dfe4dc)",
                  borderRadius: "10px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                  opacity: item.status === "uploading" ? 0.75 : 1,
                  position: "relative",
                  transition: "border 0.2s ease",
                }}
              >
                {/* Left Column: Visual Thumbnail / Video Poster Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "140px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#162c20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.status === "uploading" ? (
                      <div style={{ color: "#ffffff", fontSize: "12px", textAlign: "center", padding: "10px" }}>
                        <div style={{ fontSize: "18px", marginBottom: "4px" }}>⏳</div>
                        Uploading...
                      </div>
                    ) : item.status === "failed" ? (
                      <div style={{ color: "#fca5a5", fontSize: "12px", textAlign: "center", padding: "10px" }}>
                        <div style={{ fontSize: "18px", marginBottom: "4px" }}>⚠️</div>
                        Upload Failed
                      </div>
                    ) : item.isVideo ? (
                      <>
                        {item.posterUrl || item.imageUrl ? (
                          <img
                            src={item.posterUrl || item.imageUrl}
                            alt={item.altEn || "Video thumbnail"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: item.focalPoint || "center",
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <span
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.9)",
                              color: "var(--forest, #233d2c)",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "14px",
                              paddingInlineStart: "2px",
                            }}
                          >
                            ▶
                          </span>
                        </div>
                      </>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.altEn || "Gallery image"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: item.focalPoint || "center",
                        }}
                      />
                    )}

                    {/* Badge Pill: Image vs Video */}
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        insetInlineStart: "8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background: item.isVideo ? "#fef3c7" : "#e0e7e1",
                        color: item.isVideo ? "#92400e" : "#152a20",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    >
                      {item.isVideo ? "🎥 VIDEO" : "🖼️ IMAGE"}
                    </span>

                    {/* Gallery Cover Marker */}
                    {isCover && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          insetInlineStart: "8px",
                          fontSize: "9.5px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "#b36f55",
                          color: "#ffffff",
                        }}
                      >
                        ⭐ Gallery Cover
                      </span>
                    )}
                  </div>

                  {/* Quick Card Controls */}
                  <div style={{ display: "flex", gap: "6px", justifyContent: "space-between" }}>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setReplacingIndex(idx);
                        replaceInputRef.current?.click();
                      }}
                      style={{ padding: "4px 8px", fontSize: "11px", flex: 1 }}
                      title="Replace file while keeping caption and position"
                    >
                      ↻ Replace
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        onSettingsChange({
                          ...settings,
                          coverUrl: isCover ? undefined : item.imageUrl,
                        });
                      }}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        color: isCover ? "#b36f55" : "inherit",
                      }}
                      title={isCover ? "Unset gallery cover" : "Use this image as the gallery section cover"}
                    >
                      {isCover ? "★ Cover" : "☆ Set Cover"}
                    </button>
                  </div>
                </div>

                {/* Right Column: Metadata, Category, Captions, Reorder & Actions */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Header Row: Position, Filename, Visibility & Reorder Controls */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest, #233d2c)" }}>
                          #{idx + 1}
                        </span>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--muted, #5e6b63)",
                            maxWidth: "260px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={item.filename || item.imageUrl}
                        >
                          {item.filename || item.imageUrl.split("/").pop() || "Untitled Media"}
                        </span>

                        {item.visible === false && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              background: "#fee2e2",
                              color: "#991b1b",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            HIDDEN FROM PUBLIC
                          </span>
                        )}
                      </div>

                      {/* Reorder and Delete Toolbar */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="secondary"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, "up")}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="Move item up"
                          aria-label={`Move item ${idx + 1} up`}
                        >
                          ↑ Up
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          disabled={idx === items.length - 1}
                          onClick={() => handleMove(idx, "down")}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          title="Move item down"
                          aria-label={`Move item ${idx + 1} down`}
                        >
                          ↓ Down
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: isExpanded ? "var(--forest, #233d2c)" : "inherit",
                          }}
                        >
                          {isExpanded ? "Collapse Details ▲" : "Edit Captions & Alt ▼"}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleRemove(idx)}
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          title="Remove item from project gallery"
                          aria-label={`Remove item ${idx + 1}`}
                        >
                          Remove ✕
                        </button>
                      </div>
                    </div>

                    {/* Main Bar: Category Selector & Visibility Switch */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--forest, #233d2c)" }}>
                          Album Category:
                        </span>
                        <select
                          value={item.category || "RENDERS"}
                          onChange={(e) => handleUpdateItem(idx, { category: e.target.value })}
                          style={{ padding: "5px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--line, #dfe4dc)" }}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.labelEn} ({cat.labelAr})
                            </option>
                          ))}
                        </select>
                      </div>

                      <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={item.visible !== false}
                          onChange={(e) => handleUpdateItem(idx, { visible: e.target.checked })}
                          style={{ accentColor: "var(--forest, #233d2c)" }}
                        />
                        <span style={{ fontWeight: item.visible !== false ? 600 : 400 }}>
                          {item.visible !== false ? "Visible in Gallery" : "Hidden from Public"}
                        </span>
                      </label>

                      {item.isVideo && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                          <span style={{ color: "var(--muted)" }}>Video poster:</span>
                          <input
                            type="text"
                            placeholder="Poster image URL (optional)"
                            value={item.posterUrl || ""}
                            onChange={(e) => handleUpdateItem(idx, { posterUrl: e.target.value })}
                            style={{ padding: "4px 8px", fontSize: "11.5px", width: "190px", border: "1px solid var(--line)" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Caption Preview snippet when collapsed */}
                    {!isExpanded && (item.captionEn || item.captionAr) && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--muted, #5e6b63)",
                          background: "#f8faf9",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          marginTop: "6px",
                        }}
                      >
                        <strong>Caption:</strong> {item.captionEn} {item.captionAr ? `• ${item.captionAr}` : ""}
                      </div>
                    )}

                    {/* Expanded Drawer: Bilingual Captions, Alt Text, and Focal Point */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "14px 16px",
                          background: "#f8faf9",
                          borderRadius: "8px",
                          border: "1px solid var(--line-subtle, #edf1ea)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Captions */}
                        <div className="bilingual" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 600 }}>
                            Caption (English)
                            <input
                              type="text"
                              value={item.captionEn || ""}
                              onChange={(e) => handleUpdateItem(idx, { captionEn: e.target.value })}
                              placeholder="e.g. Master suite with private landscaped terrace"
                              style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)" }}
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 600 }}>
                            الوصف والتعليق (العربية)
                            <input
                              type="text"
                              dir="rtl"
                              value={item.captionAr || ""}
                              onChange={(e) => handleUpdateItem(idx, { captionAr: e.target.value })}
                              placeholder="مثال: الجناح الرئيسي مع شرفة خاصة تطل على الحدائق"
                              style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)" }}
                            />
                          </label>
                        </div>

                        {/* Alt Text */}
                        <div className="bilingual" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 600 }}>
                            Alt Text / Accessibility (English)
                            <input
                              type="text"
                              value={item.altEn || ""}
                              onChange={(e) => handleUpdateItem(idx, { altEn: e.target.value })}
                              placeholder="Descriptive text for screen readers"
                              style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)" }}
                            />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 600 }}>
                            النص البديل لإمكانية الوصول (العربية)
                            <input
                              type="text"
                              dir="rtl"
                              value={item.altAr || ""}
                              onChange={(e) => handleUpdateItem(idx, { altAr: e.target.value })}
                              placeholder="نص وصفي لقارئات الشاشة"
                              style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid var(--line)" }}
                            />
                          </label>
                        </div>

                        {/* Image Focal Point */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 600 }}>Image Crop Focal Point:</span>
                          <select
                            value={item.focalPoint || "center"}
                            onChange={(e) => handleUpdateItem(idx, { focalPoint: e.target.value })}
                            style={{ padding: "4px 8px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "4px" }}
                          >
                            <option value="center">Center (Default)</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          5. Choose from Media Library Modal
      ========================================================= */}
      {libraryModalOpen && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLibraryModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(10, 20, 14, 0.75)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose Media from Library"
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #dfe4dc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--forest, #233d2c)" }}>
                  Choose from Media Library / اختر من مكتبة الوسائط
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  Select one or more assets to attach to {projectName} gallery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLibraryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div
              style={{
                padding: "12px 20px",
                background: "#f8faf9",
                borderBottom: "1px solid #dfe4dc",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search assets by filename..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  fontSize: "13px",
                }}
              />

              <div style={{ display: "flex", gap: "6px" }}>
                {(["ALL", "IMAGE", "VIDEO"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLibraryFilter(filter)}
                    className={libraryFilter === filter ? "primary" : "secondary"}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    {filter === "ALL" ? "All Media" : filter === "IMAGE" ? "Images Only" : "Videos Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Asset Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredLibraryAssets.length === 0 ? (
                <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--muted)", padding: "32px 0" }}>
                  No assets match your search in the media library.
                </p>
              ) : (
                filteredLibraryAssets.map((asset) => {
                  const isSelected = selectedLibraryUrls.includes(asset.url);
                  return (
                    <div
                      key={asset.url}
                      onClick={() => {
                        setSelectedLibraryUrls((prev) =>
                          prev.includes(asset.url) ? prev.filter((u) => u !== asset.url) : [...prev, asset.url]
                        );
                      }}
                      style={{
                        position: "relative",
                        border: isSelected ? "3px solid #b36f55" : "1px solid #dfe4dc",
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "#162c20",
                        height: "110px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {asset.kind === "VIDEO" ? (
                        <div style={{ color: "#ffffff", fontSize: "12px", textAlign: "center" }}>
                          <span style={{ fontSize: "20px" }}>🎥</span>
                          <div style={{ fontSize: "10px", padding: "0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {asset.filename}
                          </div>
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                        />
                      )}

                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            insetInlineEnd: "6px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#b36f55",
                            color: "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #dfe4dc",
                background: "#f8faf9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--forest, #233d2c)" }}>
                Selected: <strong>{selectedLibraryUrls.length}</strong> items
              </span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setLibraryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={selectedLibraryUrls.length === 0}
                  onClick={handleAddFromLibrary}
                >
                  Add Selected to Gallery (+{selectedLibraryUrls.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
