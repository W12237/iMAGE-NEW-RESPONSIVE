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
  mobileVisible?: boolean;
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
  mobileVisible: true,
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

const STANDARD_PAGE_PRESETS = [
  { labelEn: "Home", labelAr: "الرئيسية", url: "#top", group: "primary" },
  { labelEn: "About Us", labelAr: "من نحن", url: "/about", group: "primary" },
  { labelEn: "Projects", labelAr: "المشاريع", url: "/projects", group: "primary" },
  { labelEn: "Contact Us", labelAr: "تواصل معنا", url: "/contact", group: "primary" },
  { labelEn: "Careers", labelAr: "الوظائف", url: "/careers", group: "secondary" },
  { labelEn: "Journal", labelAr: "يومياتنا", url: "/journal", group: "secondary" },
  { labelEn: "History", labelAr: "تاريخنا", url: "/history", group: "secondary" },
  { labelEn: "Team", labelAr: "فريقنا", url: "/team", group: "secondary" },
  { labelEn: "Partners", labelAr: "شركاؤنا", url: "/partners", group: "secondary" },
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
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
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

  const addPreset = (preset: typeof STANDARD_PAGE_PRESETS[number]) => {
    const newItem: NavigationEditorItem = {
      id: `new-${crypto.randomUUID()}`,
      labelEn: preset.labelEn,
      labelAr: preset.labelAr,
      url: preset.url,
      visible: true,
      mobileVisible: true,
      external: false,
      group: preset.group,
      previewImageUrl: "",
      previewImageUrlAr: "",
      focalPoint: "center",
    };
    setItems((curr) => [...curr, newItem]);
  };

  const primaryItems = items.filter((item) => item.visible && (item.group || "primary") === "primary");
  const secondaryItems = items.filter((item) => item.visible && item.group === "secondary");
  const mobileVisibleItems = items.filter((item) => item.mobileVisible !== false);

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
          Live Menu Preview (Desktop & Mobile)
        </button>
      </div>

      {activeTab === "items" ? (
        <>
          {/* GLOBAL DEFAULT MENU IMAGE SETTING */}
          <section className="panel" style={{ border: "1px solid var(--line, #e2ded7)", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", margin: "0 0 6px" }}>Global Default Menu Photograph</h2>
              <p className="hint" style={{ margin: 0 }}>
                This photograph appears in the desktop menu arch panel by default, and as a fallback for links that do not define a custom image.
              </p>
            </div>

            <MediaField
              name="defaultMenuMediaUrl"
              label="Default Menu Photograph URL"
              value={defaultMenuUrl}
              assets={assets}
              kind="IMAGE"
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
              <label>
                Default Image Focal Point (Cropping Center)
                <select
                  name="defaultMenuMediaFocalPoint"
                  defaultValue={defaultMenuFocal}
                >
                  {FOCAL_POINTS.map((fp) => (
                    <option key={fp.value} value={fp.value}>
                      {fp.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                English Image Description
                <input
                  name="defaultMenuMediaAltEn"
                  defaultValue={globalSettings?.menuMediaAltEn || "Image Developments architecture"}
                  placeholder="e.g. Modern architectural façade"
                />
              </label>

              <label>
                Arabic Image Description (العربية)
                <input
                  name="defaultMenuMediaAltAr"
                  defaultValue={globalSettings?.menuMediaAltAr || "العمارة المعاصرة في إيمدج"}
                  dir="rtl"
                  placeholder="مثال: واجهة معمارية راقية"
                />
              </label>
            </div>
          </section>

          {/* NAVIGATION ITEMS LIST */}
          <section className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--line, #e2ded7)", paddingBottom: "14px" }}>
              <div>
                <h2 style={{ fontSize: "16px", margin: "0 0 4px" }}>Menu Links & Mobile Visibility</h2>
                <p className="hint" style={{ margin: 0 }}>
                  Customize the navigation links. Each link can be displayed on desktop, mobile, or both. All mobile-enabled links appear directly in the mobile menu view.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* Quick Add Presets */}
                <div style={{ position: "relative", display: "inline-block" }}>
                  <select
                    onChange={(e) => {
                      const preset = STANDARD_PAGE_PRESETS.find((p) => p.url === e.target.value);
                      if (preset) {
                        addPreset(preset);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      border: "1px solid var(--border)",
                      background: "#faf9f6",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>+ Add Page Shortcut...</option>
                    {STANDARD_PAGE_PRESETS.map((p) => (
                      <option key={p.url} value={p.url}>
                        {p.labelEn} ({p.labelAr})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="secondary"
                  type="button"
                  onClick={() => setItems((curr) => [...curr, emptyItem()])}
                >
                  + Add Custom Link
                </button>
              </div>
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

                    {/* Top Row: Group Badge, Reordering & Remove */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        paddingBottom: "12px",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                          {isSecondary ? "Secondary Group" : "Primary Group"}
                        </span>
                        <strong style={{ fontSize: "14px", color: "var(--ink, #111)" }}>
                          {item.labelEn || "Untitled Item"}
                        </strong>
                        {item.labelAr && (
                          <span style={{ fontSize: "13px", color: "var(--muted)", direction: "rtl" }}>
                            ({item.labelAr})
                          </span>
                        )}
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
                          <option value="primary">Primary (Main Desktop Nav)</option>
                          <option value="secondary">Secondary (More Pages on Desktop)</option>
                        </select>
                      </label>
                    </div>

                    {/* Device Visibility Controls */}
                    <div
                      style={{
                        display: "flex",
                        gap: "24px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        padding: "8px 12px",
                        background: "rgba(0, 0, 0, 0.02)",
                        borderRadius: "6px",
                      }}
                    >
                      <label className="check" style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <input
                          name={`visible_${item.id}`}
                          type="checkbox"
                          defaultChecked={item.visible}
                          onChange={(e) => updateItem(item.id, { visible: e.target.checked })}
                        />
                        <span style={{ fontWeight: 600 }}>Visible on Desktop Menu</span>
                      </label>

                      <label className="check" style={{ display: "inline-flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <input
                          name={`mobileVisible_${item.id}`}
                          type="checkbox"
                          defaultChecked={item.mobileVisible !== false}
                          onChange={(e) => updateItem(item.id, { mobileVisible: e.target.checked })}
                        />
                        <span style={{ fontWeight: 600, color: "var(--forest, #152a20)" }}>
                          Visible on Mobile Menu (All Links View)
                        </span>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#b36f55" }}>
                CMS Interactive Preview
              </span>
              <h2 style={{ color: "#ffffff", margin: "4px 0 6px" }}>
                {previewViewport === "mobile" ? "Mobile Menu View (All Links)" : "Desktop Menu View"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: 0 }}>
                {previewViewport === "mobile"
                  ? "Direct view of all mobile-enabled links as displayed on smartphone viewports, without index numbers."
                  : "Desktop view with hover arch photograph on the right, without index numbers."}
              </p>
            </div>

            {/* Viewport Switcher */}
            <div style={{ display: "inline-flex", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setPreviewViewport("desktop")}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: previewViewport === "desktop" ? "#b36f55" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Desktop Menu
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport("mobile")}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: previewViewport === "mobile" ? "#b36f55" : "transparent",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Mobile Menu ({mobileVisibleItems.length} Links)
              </button>
            </div>
          </div>

          {previewViewport === "mobile" ? (
            /* MOBILE PREVIEW SIMULATOR (All links rendered directly without numbers) */
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: "390px",
                  maxWidth: "100%",
                  background: "#152a20",
                  border: "2px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: "24px",
                  padding: "24px 20px",
                  boxShadow: "0 20px 48px rgba(0, 0, 0, 0.45)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {/* Mobile Top Controls Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>English / العربية</span>
                  </div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#b36f55", fontWeight: 600 }}>
                    Mobile Menu
                  </span>
                </div>

                {/* All Mobile Links List */}
                <div style={{ display: "flex", flexDirection: "column", maxHeight: "420px", overflowY: "auto" }}>
                  {mobileVisibleItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: item.group === "secondary" ? "10px 0" : "12px 0",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                      }}
                    >
                      <span style={{
                        fontSize: item.group === "secondary" ? "16px" : "20px",
                        fontWeight: item.group === "secondary" ? 400 : 500,
                        color: item.group === "secondary" ? "rgba(255,255,255,0.85)" : "#ffffff",
                      }}>
                        {item.labelEn || "Untitled"}
                      </span>
                      <span style={{ fontSize: "13px", opacity: 0.6, direction: "rtl" }}>
                        {item.labelAr}
                      </span>
                    </div>
                  ))}

                  {!mobileVisibleItems.length && (
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", padding: "16px 0" }}>
                      No links are marked as visible on mobile.
                    </p>
                  )}
                </div>

                {/* Mobile Call Back CTA */}
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "999px",
                    background: "#b36f55",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13.5px",
                    cursor: "pointer",
                  }}
                >
                  Request a Call Back / اطلب اتصالاً
                </button>

                {/* Mobile Footer Contact */}
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
                  17087 • hello@imagedevelopments.com
                </div>
              </div>
            </div>
          ) : (
            /* DESKTOP PREVIEW */
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

                {primaryItems.map((item) => {
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
                      <span style={{ fontSize: "20px", fontWeight: 500 }}>
                        {item.labelEn || "Untitled"}
                      </span>
                      <span style={{ fontSize: "14px", opacity: 0.6, marginInlineStart: "auto", direction: "rtl" }}>
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
                        {secondaryItems.map((item) => {
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
                              <span style={{ fontSize: "16px" }}>
                                {item.labelEn || "Untitled"}
                              </span>
                              <span style={{ fontSize: "13px", opacity: 0.6, marginInlineStart: "auto", direction: "rtl" }}>
                                {item.labelAr}
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
          )}
        </section>
      )}
    </>
  );
}
