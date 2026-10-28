"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaField } from "./media-field";
import type { UploadedMedia } from "@/app/admin/actions";

export type NavigationEditorItem = {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
  visible: boolean;
  external: boolean;
  group?: string; // "primary" | "secondary"
  previewImageUrl?: string | null;
  previewImageUrlAr?: string | null;
  focalPoint?: string;
  sortOrder?: number;
};

export type GlobalMenuSettings = {
  menuMediaUrl: string;
  menuMediaAltEn?: string;
  menuMediaAltAr?: string;
  menuMediaFocalPoint?: string;
};

const emptyItem = (): NavigationEditorItem => ({
  id: `new-${crypto.randomUUID()}`,
  labelEn: "",
  labelAr: "",
  url: "",
  visible: true,
  external: false,
  group: "primary",
  previewImageUrl: "",
  previewImageUrlAr: "",
  focalPoint: "center",
});

const FOCAL_POINTS = [
  { value: "center", label: "Center (50% 50%)" },
  { value: "top", label: "Top (50% 20%)" },
  { value: "bottom", label: "Bottom (50% 80%)" },
  { value: "left", label: "Left (20% 50%)" },
  { value: "right", label: "Right (80% 50%)" },
];

export function NavigationEditor({
  initialItems,
  globalSettings,
  assets,
}: {
  initialItems: NavigationEditorItem[];
  globalSettings?: GlobalMenuSettings;
  assets: UploadedMedia[];
}) {
  const [items, setItems] = useState<NavigationEditorItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"items" | "preview">("items");
  const [expandedAr, setExpandedAr] = useState<Record<string, boolean>>({});

  // Preview tab interactive state
  const [previewHoveredUrl, setPreviewHoveredUrl] = useState<string | null>(null);
  const [previewHoveredFocal, setPreviewHoveredFocal] = useState<string>("center");
  const [previewMoreOpen, setPreviewMoreOpen] = useState(false);

  const defaultMenuUrl =
    globalSettings?.menuMediaUrl ||
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=86";
  const defaultMenuFocal = globalSettings?.menuMediaFocalPoint || "center";

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const updateItem = (id: string, patch: Partial<NavigationEditorItem>) => {
    setItems((curr) =>
      curr.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const primaryItems = items.filter((item) => (item.group || "primary") === "primary");
  const secondaryItems = items.filter((item) => item.group === "secondary");

  return (
    <>
      {/* Top Tab Bar: Edit vs Preview */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--line, #e2ded7)",
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          className={activeTab === "items" ? "primary" : "secondary"}
          onClick={() => setActiveTab("items")}
        >
          Navigation Configuration
        </button>
        <button
          type="button"
          className={activeTab === "preview" ? "primary" : "secondary"}
          onClick={() => setActiveTab("preview")}
        >
          Live Menu Preview
        </button>
      </div>

      {activeTab === "items" ? (
        <>
          {/* GLOBAL DEFAULT MENU IMAGE SETTING */}
          <section
            className="panel"
            style={{
              marginBottom: "24px",
              border: "1px solid var(--line, #e2ded7)",
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <div className="section-title">
              <div>
                <h2>Global Default Menu Image</h2>
                <p className="hint">
                  This image is displayed by default when the menu opens, and serves as the automatic fallback for links without a dedicated image.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginTop: "16px" }}>
              <MediaField
                name="defaultMenuMediaUrl"
                label="Global Menu Image"
                value={globalSettings?.menuMediaUrl || defaultMenuUrl}
                assets={assets}
                kind="IMAGE"
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <label>
                  Focal Point
                  <select
                    name="defaultMenuMediaFocalPoint"
                    defaultValue={globalSettings?.menuMediaFocalPoint || "center"}
                  >
                    {FOCAL_POINTS.map((fp) => (
                      <option key={fp.value} value={fp.value}>
                        {fp.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Image Alt Text (English)
                  <input
                    name="defaultMenuMediaAltEn"
                    defaultValue={globalSettings?.menuMediaAltEn || "Warm architectural interior"}
                  />
                </label>
                <label>
                  Image Alt Text (العربية)
                  <input
                    name="defaultMenuMediaAltAr"
                    dir="rtl"
                    defaultValue={globalSettings?.menuMediaAltAr || "تصميم داخلي معماري دافئ"}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* NAVIGATION ITEMS LIST */}
          <section
            className="panel"
            style={{
              border: "1px solid var(--line, #e2ded7)",
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <div className="section-title navigation-editor-title">
              <div>
                <h2>Header Menu Items</h2>
                <p className="hint">
                  The first 5 primary items appear directly in the menu list. Secondary items appear in the expandable &ldquo;More Pages&rdquo; group. Hovering or focusing any item swaps the photograph preview panel.
                </p>
              </div>
              <button
                className="secondary"
                type="button"
                onClick={() => setItems((curr) => [...curr, emptyItem()])}
              >
                + Add Menu Item
              </button>
            </div>

            <div className="nav-editor" style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "18px" }}>
              {items.map((item, index) => {
                const isSecondary = item.group === "secondary";
                const isArExpanded = !!expandedAr[item.id];

                return (
                  <div
                    className="nav-item-card"
                    key={item.id}
                    style={{
                      border: "1px solid var(--line, #e2ded7)",
                      borderRadius: "10px",
                      padding: "20px",
                      background: isSecondary ? "#faf8f5" : "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />

                    {/* Top Row: Index, Group Badge, Reordering & Remove */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        paddingBottom: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "#b36f55",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: isSecondary ? "rgba(179, 111, 85, 0.12)" : "rgba(21, 42, 32, 0.08)",
                            color: isSecondary ? "#964f37" : "#152a20",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {isSecondary ? "Secondary (More Pages)" : "Primary (Main Nav)"}
                        </span>
                        <strong style={{ fontSize: "14px", color: "var(--ink, #111)" }}>
                          {item.labelEn || "Untitled Item"}
                        </strong>
                      </div>

                      <div className="nav-item-actions" style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="secondary compact"
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label="Move up"
                          title="Move up"
                        >
                          ↑ Up
                        </button>
                        <button
                          className="secondary compact"
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === items.length - 1}
                          aria-label="Move down"
                          title="Move down"
                        >
                          ↓ Down
                        </button>
                        <button
                          className="media-remove compact"
                          type="button"
                          onClick={() =>
                            setItems((curr) => curr.filter((c) => c.id !== item.id))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Basic Item Details Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      <label>
                        English Label
                        <input
                          name={`labelEn_${item.id}`}
                          defaultValue={item.labelEn}
                          onChange={(e) => updateItem(item.id, { labelEn: e.target.value })}
                          required
                          maxLength={80}
                          placeholder="e.g. Careers"
                        />
                      </label>
                      <label>
                        Arabic Label (العربية)
                        <input
                          name={`labelAr_${item.id}`}
                          defaultValue={item.labelAr}
                          onChange={(e) => updateItem(item.id, { labelAr: e.target.value })}
                          dir="rtl"
                          required
                          maxLength={80}
                          placeholder="مثال: الوظائف"
                        />
                      </label>
                      <label>
                        URL Destination
                        <input
                          name={`url_${item.id}`}
                          defaultValue={item.url}
                          onChange={(e) => updateItem(item.id, { url: e.target.value })}
                          required
                          placeholder="/about or #top"
                          maxLength={500}
                        />
                      </label>
                      <label>
                        Menu Placement Group
                        <select
                          name={`group_${item.id}`}
                          value={item.group || "primary"}
                          onChange={(e) => updateItem(item.id, { group: e.target.value })}
                        >
                          <option value="primary">Primary (Top 5 visible)</option>
                          <option value="secondary">Secondary (More Pages group)</option>
                        </select>
                      </label>
                    </div>

                    {/* Flags: Visible & External */}
                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                      <label className="check" style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <input
                          name={`visible_${item.id}`}
                          type="checkbox"
                          defaultChecked={item.visible}
                          onChange={(e) => updateItem(item.id, { visible: e.target.checked })}
                        />
                        <span>Visible in public menu</span>
                      </label>
                      <label className="check" style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <input
                          name={`external_${item.id}`}
                          type="checkbox"
                          defaultChecked={item.external}
                          onChange={(e) => updateItem(item.id, { external: e.target.checked })}
                        />
                        <span>External link (opens in new tab)</span>
                      </label>
                    </div>

                    {/* PREVIEW IMAGE & FOCAL POINT ROW */}
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.02)",
                        border: "1px dashed rgba(42, 69, 52, 0.15)",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <strong>Link Preview Photograph</strong>
                        <span style={{ fontSize: "12px", color: "var(--muted, #666)" }}>
                          Focal point: <code>{item.focalPoint || "center"}</code>
                        </span>
                      </div>

                      <MediaField
                        name={`previewImageUrl_${item.id}`}
                        label="Hover / Keyboard Focus Preview Image"
                        value={item.previewImageUrl || ""}
                        assets={assets}
                        kind="IMAGE"
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "12px",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <label style={{ margin: 0, minWidth: "200px" }}>
                          Focal Point (Cropping Center)
                          <select
                            name={`focalPoint_${item.id}`}
                            defaultValue={item.focalPoint || "center"}
                            onChange={(e) => updateItem(item.id, { focalPoint: e.target.value })}
                          >
                            {FOCAL_POINTS.map((fp) => (
                              <option key={fp.value} value={fp.value}>
                                {fp.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: item.previewImageUrl ? "#2a6543" : "#8a6644",
                            fontStyle: "italic",
                          }}
                        >
                          {item.previewImageUrl
                            ? "✓ Dedicated item photograph active on hover/focus."
                            : "ℹ No item image set — will display the Global Default Menu Image."}
                        </p>
                      </div>

                      {/* Optional Arabic-Specific Image Toggle */}
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "10px" }}>
                        <button
                          type="button"
                          className="secondary compact"
                          onClick={() =>
                            setExpandedAr((c) => ({ ...c, [item.id]: !c[item.id] }))
                          }
                          style={{ fontSize: "12px" }}
                        >
                          {isArExpanded ? "▾ Hide Arabic Image Option" : "▸ Optional Arabic-Specific Image"}
                        </button>

                        {isArExpanded && (
                          <div style={{ marginTop: "10px" }}>
                            <MediaField
                              name={`previewImageUrlAr_${item.id}`}
                              label="Arabic Locale Preview Image (Optional)"
                              value={item.previewImageUrlAr || ""}
                              assets={assets}
                              kind="IMAGE"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!items.length && (
                <p className="empty">The menu is empty. Add a menu item to get started.</p>
              )}
            </div>
          </section>
        </>
      ) : (
        /* LIVE INTERACTIVE PREVIEW TAB */
        <section
          className="panel"
          style={{
            border: "1px solid var(--line, #e2ded7)",
            background: "#152a20",
            color: "#ffffff",
            padding: "32px",
            borderRadius: "14px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#b36f55" }}>
              CMS Interactive Preview
            </span>
            <h2 style={{ color: "#ffffff", margin: "4px 0 8px" }}>
              Simulated Menu Navigation
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0 }}>
              Hover or focus any link to preview its assigned image in the architectural arch panel on the right.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "36px",
              background: "#1b3327",
              borderRadius: "12px",
              padding: "28px",
              alignItems: "center",
            }}
          >
            {/* Links column */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#b36f55", marginBottom: "10px" }}>
                Primary Links ({primaryItems.length})
              </div>

              {primaryItems.map((item, i) => {
                const targetUrl = item.previewImageUrl || defaultMenuUrl;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => {
                      setPreviewHoveredUrl(targetUrl);
                      setPreviewHoveredFocal(item.focalPoint || "center");
                    }}
                    onFocus={() => {
                      setPreviewHoveredUrl(targetUrl);
                      setPreviewHoveredFocal(item.focalPoint || "center");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      transition: "color 0.2s ease, transform 0.2s ease",
                      color: previewHoveredUrl === targetUrl ? "#b36f55" : "#ffffff",
                    }}
                    tabIndex={0}
                  >
                    <span style={{ fontSize: "11px", color: "#b36f55", width: "20px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: 500 }}>
                      {item.labelEn || "Untitled"}
                    </span>
                    <span style={{ fontSize: "14px", opacity: 0.6, marginInlineStart: "auto" }}>
                      {item.labelAr}
                    </span>
                  </div>
                );
              })}

              {/* Expandable More Pages Preview Button */}
              {secondaryItems.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewMoreOpen((v) => !v)}
                    style={{
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px dashed rgba(255, 255, 255, 0.25)",
                      color: "#b36f55",
                      cursor: "pointer",
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    <span>More Pages ({secondaryItems.length})</span>
                    <span>{previewMoreOpen ? "▲" : "▼"}</span>
                  </button>

                  {previewMoreOpen && (
                    <div style={{ display: "flex", flexDirection: "column", paddingInlineStart: "12px", marginTop: "8px" }}>
                      {secondaryItems.map((item, idx) => {
                        const targetUrl = item.previewImageUrl || defaultMenuUrl;
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => {
                              setPreviewHoveredUrl(targetUrl);
                              setPreviewHoveredFocal(item.focalPoint || "center");
                            }}
                            onFocus={() => {
                              setPreviewHoveredUrl(targetUrl);
                              setPreviewHoveredFocal(item.focalPoint || "center");
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "14px",
                              padding: "7px 0",
                              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                              cursor: "pointer",
                              color: previewHoveredUrl === targetUrl ? "#b36f55" : "rgba(255, 255, 255, 0.9)",
                            }}
                            tabIndex={0}
                          >
                            <span style={{ fontSize: "10px", color: "#b36f55", width: "18px" }}>
                              {String(primaryItems.length + idx + 1).padStart(2, "0")}
                            </span>
                            <span style={{ fontSize: "16px" }}>
                              {item.labelEn || "Untitled"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview image arch panel */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "340px",
                  borderRadius: "100px 100px 0 0",
                  overflow: "hidden",
                  background: "#e5d6c5",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                }}
              >
                <Image
                  src={previewHoveredUrl || defaultMenuUrl}
                  alt="Navigation preview"
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: previewHoveredFocal || defaultMenuFocal,
                    transition: "all 0.3s ease",
                  }}
                  sizes="30vw"
                />
              </div>
              <span style={{ marginTop: "10px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                {previewHoveredUrl ? "Previewing assigned link photo" : "Showing global default menu photo"}
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
