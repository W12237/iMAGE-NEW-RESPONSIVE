"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import type { StoredAsset, MediaKind } from "@/lib/storage/types";

export interface MediaUploadFieldProps {
  name: string;
  label: string;
  value?: string;
  kind?: MediaKind;
  required?: boolean;
  helpText?: string;
  existingAssets?: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    kind: string;
    posterUrl?: string | null;
    focalPoint?: string | null;
    altEn?: string | null;
    altAr?: string | null;
  }>;
  showFocalPoint?: boolean;
  focalPointName?: string;
  focalPointValue?: string;
  showPoster?: boolean;
  posterName?: string;
  posterValue?: string;
  altEnName?: string;
  altEnValue?: string;
  altArName?: string;
  altArValue?: string;
  onChange?: (val: string, asset?: Partial<StoredAsset>) => void;
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export function MediaUploadField({
  name,
  label,
  value = "",
  kind = "IMAGE",
  required = false,
  helpText,
  existingAssets = [],
  showFocalPoint = false,
  focalPointName,
  focalPointValue = "center",
  showPoster = false,
  posterName,
  posterValue = "",
  altEnName,
  altEnValue = "",
  altArName,
  altArValue = "",
  onChange,
}: MediaUploadFieldProps) {
  const [currentUrl, setCurrentUrl] = useState(value);
  const [focalPoint, setFocalPoint] = useState(focalPointValue);
  const [posterUrl, setPosterUrl] = useState(posterValue);
  const [altEn, setAltEn] = useState(altEnValue);
  const [altAr, setAltAr] = useState(altArValue);

  useEffect(() => {
    setCurrentUrl(value);
  }, [value]);

  useEffect(() => {
    setFocalPoint(focalPointValue);
  }, [focalPointValue]);

  useEffect(() => {
    setPosterUrl(posterValue);
  }, [posterValue]);

  useEffect(() => {
    setAltEn(altEnValue);
  }, [altEnValue]);

  useEffect(() => {
    setAltAr(altArValue);
  }, [altArValue]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showExternalInput, setShowExternalInput] = useState(
    Boolean(value && !value.startsWith("/uploads/") && !value.startsWith("http://localhost"))
  );
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("");
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const acceptMap: Record<MediaKind, string> = {
    IMAGE: "image/jpeg,image/png,image/webp,image/avif",
    VIDEO: "video/mp4,video/webm",
    DOCUMENT: "application/pdf",
  };

  const limitMap: Record<MediaKind, string> = {
    IMAGE: "JPEG, PNG, WebP, AVIF up to 12 MB",
    VIDEO: "MP4, WebM up to 100 MB",
    DOCUMENT: "PDF up to 40 MB",
  };

  // Upload handler via XMLHttpRequest for smooth progress feedback
  const uploadFile = useCallback(
    (file: File, isPosterUpload = false) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setLastFailedFile(file);

      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", isPosterUpload ? "IMAGE" : kind);

      if (altEn) fd.append("altEn", altEn);
      if (altAr) fd.append("altAr", altAr);
      if (focalPoint) fd.append("focalPoint", focalPoint);
      if (posterUrl) fd.append("posterUrl", posterUrl);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.asset) {
              setUploadStatus("success");
              setUploadProgress(null);
              setLastFailedFile(null);

              if (isPosterUpload) {
                setPosterUrl(data.asset.url);
                setSuccessMessage("Video poster uploaded successfully.");
              } else {
                setCurrentUrl(data.asset.url);
                setSuccessMessage(`File "${file.name}" uploaded successfully.`);
                if (onChange) {
                  onChange(data.asset.url, data.asset);
                }
              }
            } else {
              setUploadStatus("error");
              setErrorMessage(data.error || "Upload processing failed.");
            }
          } catch {
            setUploadStatus("error");
            setErrorMessage("Invalid server response.");
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploadStatus("error");
            setErrorMessage(data.error || `Upload failed with status ${xhr.status}.`);
          } catch {
            setUploadStatus("error");
            setErrorMessage(`Upload failed with status ${xhr.status}.`);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setUploadStatus("error");
        setErrorMessage("Network error during file upload. Check connection and retry.");
      });

      xhr.open("POST", "/api/admin/media/upload");
      xhr.send(fd);
    },
    [kind, altEn, altAr, focalPoint, posterUrl, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleRemove = () => {
    setCurrentUrl("");
    setSuccessMessage(null);
    setErrorMessage(null);
    if (onChange) onChange("", undefined);
  };

  const handleSelectFromLibrary = (asset: { url: string; altEn?: string | null; altAr?: string | null }) => {
    setCurrentUrl(asset.url);
    if (asset.altEn && !altEn) setAltEn(asset.altEn);
    if (asset.altAr && !altAr) setAltAr(asset.altAr);
    setIsLibraryOpen(false);
    setSuccessMessage("Asset selected from Media Library.");
    if (onChange) onChange(asset.url, asset as any);
  };

  // Filter library items for modal
  const filteredLibrary = existingAssets.filter((a) => {
    const matchesKind =
      kind === "IMAGE"
        ? a.kind === "IMAGE" || a.mimeType?.startsWith("image/")
        : kind === "VIDEO"
          ? a.kind === "VIDEO" || a.mimeType?.startsWith("video/")
          : a.kind === "DOCUMENT" || a.mimeType === "application/pdf";
    if (!matchesKind) return false;
    if (!libraryFilter.trim()) return true;
    const q = libraryFilter.toLowerCase();
    return a.filename.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
  });

  return (
    <div className="media-upload-field" style={{ marginBottom: "20px" }}>
      {/* Hidden inputs to pass data to standard form submissions */}
      <input type="hidden" name={name} value={currentUrl} required={required} />
      {showFocalPoint && focalPointName && <input type="hidden" name={focalPointName} value={focalPoint} />}
      {showPoster && posterName && <input type="hidden" name={posterName} value={posterUrl} />}
      {altEnName && <input type="hidden" name={altEnName} value={altEn} />}
      {altArName && <input type="hidden" name={altArName} value={altAr} />}

      {/* Field Label and Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
          {label} {required && <span style={{ color: "#b91c1c" }}>*</span>}
        </label>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "2px 8px",
            borderRadius: "4px",
            background: kind === "VIDEO" ? "#fef3c7" : kind === "DOCUMENT" ? "#fee2e2" : "#e0e7e1",
            color: kind === "VIDEO" ? "#92400e" : kind === "DOCUMENT" ? "#991b1b" : "#152a20",
          }}
        >
          {kind}
        </span>
      </div>

      {helpText && <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px" }}>{helpText}</p>}

      {/* Preview Card if Asset Exists */}
      {currentUrl ? (
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "8px",
            background: "#ffffff",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: kind === "DOCUMENT" ? "90px" : "240px", background: "#111827" }}>
            {kind === "IMAGE" ? (
              <Image
                src={currentUrl}
                alt={altEn || label}
                fill
                style={{ objectFit: "cover", objectPosition: focalPoint }}
                sizes="(max-width: 900px) 100vw, 600px"
              />
            ) : kind === "VIDEO" ? (
              <video
                src={currentUrl}
                poster={posterUrl || undefined}
                controls
                muted
                playsInline
                preload="metadata"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "100%", padding: "16px", background: "#f8fafc", color: "#1e293b" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#fee2e2", display: "grid", placeItems: "center", color: "#dc2626", fontWeight: "bold" }}>
                  PDF
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUrl.split("/").pop()}
                  </strong>
                  <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline" }}>
                    Open PDF in new tab ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div
            style={{
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--line)",
              background: "#fafafa",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
              {currentUrl}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: "11px", padding: "4px 10px" }}
              >
                Replace
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setIsLibraryOpen(true)}
                style={{ fontSize: "11px", padding: "4px 10px" }}
              >
                Library
              </button>
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag-and-Drop Dropzone when no asset selected */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? "var(--forest, #2a4534)" : "var(--line, #d1d5db)"}`,
            borderRadius: "8px",
            padding: "28px 16px",
            textAlign: "center",
            background: isDragging ? "rgba(42, 69, 52, 0.05)" : "#fafafa",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "10px",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ marginBottom: "8px", color: "var(--forest, #2a4534)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <strong style={{ display: "block", fontSize: "14px", color: "var(--ink)", marginBottom: "4px" }}>
            Click to upload or drag &amp; drop {kind.toLowerCase()}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "12px" }}>
            {limitMap[kind]}
          </span>
          <div style={{ display: "inline-flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              Browse Files
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setIsLibraryOpen(true)}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              Choose from Media Library
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMap[kind]}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />

      {/* Uploading Progress Bar */}
      {uploadStatus === "uploading" && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "10px 14px", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#166534", marginBottom: "4px" }}>
            <span>Uploading file to storage...</span>
            <span>{uploadProgress !== null ? `${uploadProgress}%` : "Processing..."}</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "#dcfce7", borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${uploadProgress ?? 100}%`,
                height: "100%",
                background: "var(--forest, #2a4534)",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Error state with Retry button */}
      {errorMessage && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#991b1b" }}>{errorMessage}</span>
          {lastFailedFile && (
            <button
              type="button"
              className="secondary"
              onClick={() => uploadFile(lastFailedFile)}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Success notification */}
      {successMessage && !errorMessage && (
        <p style={{ fontSize: "12px", color: "#166534", margin: "4px 0 10px" }}>
          ✓ {successMessage}
        </p>
      )}

      {/* Optional Metadata Controls: Focal Point & Poster & Alt Text */}
      {(showFocalPoint || showPoster || altEnName) && currentUrl && (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid var(--line)",
            borderRadius: "6px",
            padding: "12px",
            marginTop: "10px",
            display: "grid",
            gap: "10px",
          }}
        >
          {showFocalPoint && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                Image Focal Point
              </label>
              <select
                value={focalPoint}
                onChange={(e) => {
                  setFocalPoint(e.target.value);
                  if (onChange) onChange(currentUrl, { focalPoint: e.target.value });
                }}
                style={{ width: "100%", maxWidth: "240px", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
              >
                <option value="center">Center (Balanced)</option>
                <option value="top">Top (Architecture Roofline)</option>
                <option value="bottom">Bottom (Landscape / Ground)</option>
                <option value="left">Left (Subject on Left)</option>
                <option value="right">Right (Subject on Right)</option>
              </select>
            </div>
          )}

          {showPoster && kind === "VIDEO" && (
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                Video Poster Frame Image
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="URL to poster image..."
                  style={{ flex: 1, padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => posterInputRef.current?.click()}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  Upload Poster
                </button>
                <input
                  ref={posterInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, true);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          )}

          {altEnName && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                  Alt Description (English)
                </label>
                <input
                  type="text"
                  value={altEn}
                  onChange={(e) => setAltEn(e.target.value)}
                  placeholder="Describe image content..."
                  style={{ width: "100%", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
                />
              </div>
              {altArName && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                    النص البديل (العربية)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={altAr}
                    onChange={(e) => setAltAr(e.target.value)}
                    placeholder="وصف محتوى الصورة..."
                    style={{ width: "100%", padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* External URL Fallback Accordion */}
      <div style={{ marginTop: "6px" }}>
        <button
          type="button"
          onClick={() => setShowExternalInput((prev) => !prev)}
          style={{ background: "none", border: "none", padding: 0, color: "var(--muted)", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
        >
          {showExternalInput ? "Hide external URL input" : "Or enter external URL directly"}
        </button>
        {showExternalInput && (
          <div style={{ marginTop: "6px" }}>
            <input
              type="text"
              value={currentUrl}
              onChange={(e) => {
                setCurrentUrl(e.target.value);
                if (onChange) onChange(e.target.value);
              }}
              placeholder="https://example.com/asset.jpg"
              style={{ width: "100%", padding: "6px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--line)" }}
            />
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      {isLibraryOpen && (
        <div
          className="media-library-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLibraryOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
        >
          <div
            className="media-library-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Media Library — ${label}`}
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--ink)" }}>Choose From Media Library</h3>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Showing compatible {kind.toLowerCase()} assets</span>
              </div>
              <button type="button" onClick={() => setIsLibraryOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>
                ✕
              </button>
            </div>

            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "#fafafa" }}>
              <input
                type="text"
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                placeholder="Search media by filename..."
                style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
              />
            </div>

            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {filteredLibrary.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                  {filteredLibrary.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectFromLibrary(asset)}
                      style={{
                        border: currentUrl === asset.url ? "2px solid var(--forest, #2a4534)" : "1px solid var(--line)",
                        borderRadius: "6px",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "#ffffff",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", height: "100px", background: "#f3f4f6" }}>
                        {asset.kind === "VIDEO" ? (
                          <video src={asset.url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : asset.kind === "DOCUMENT" ? (
                          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#dc2626", fontWeight: "bold" }}>PDF</div>
                        ) : (
                          <Image src={asset.url} alt={asset.filename} fill style={{ objectFit: "cover" }} sizes="160px" />
                        )}
                      </div>
                      <div style={{ padding: "6px 8px", fontSize: "11px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                          {asset.filename}
                        </span>
                        <span style={{ color: "var(--muted)" }}>{formatBytes(asset.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                  <p>No compatible {kind.toLowerCase()} assets found.</p>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setIsLibraryOpen(false);
                      fileInputRef.current?.click();
                    }}
                    style={{ fontSize: "12px", padding: "6px 14px", marginTop: "8px" }}
                  >
                    Upload New {kind}
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="secondary" onClick={() => setIsLibraryOpen(false)} style={{ fontSize: "12px", padding: "6px 14px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

