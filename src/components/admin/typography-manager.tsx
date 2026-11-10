"use client";

import React, { useMemo, useState } from "react";
import { ActionForm } from "./action-form";
import { saveTypography } from "@/app/admin/actions";
import {
  TYPOGRAPHY_ROLES,
  APPROVED_FONT_WEIGHTS,
  BASELINE_TYPOGRAPHY,
  computeFluidClamp,
  type TypographyRole,
  type TypographyScope,
  type TypographyValues,
} from "@/lib/typography";

export interface StoredTypographySetting {
  key: string;
  fontSizeMobile?: number | null;
  fontSizeDesktop?: number | null;
  lineHeight?: number | null;
  fontWeight?: number | null;
}

interface ScopeOption {
  key: TypographyScope;
  labelEn: string;
  labelAr: string;
  description: string;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  {
    key: "global",
    labelEn: "Global Site Defaults",
    labelAr: "القيم الافتراضية العامة للموقع",
    description: "Base typography tokens applied across all pages and sections.",
  },
  {
    key: "home_projects",
    labelEn: "Homepage — Featured Projects",
    labelAr: "الرئيسية — معرض المشاريع المميزة",
    description: "Overrides for homepage projects heading, tags, and project card titles.",
  },
  {
    key: "home_hero",
    labelEn: "Homepage — Hero Experience",
    labelAr: "الرئيسية — واجهة الصفحة الأولى",
    description: "Overrides for hero impact statement and supporting note.",
  },
  {
    key: "home_living",
    labelEn: "Homepage — Lifestyle & Architecture",
    labelAr: "الرئيسية — الحياة والعمارة",
    description: "Overrides for the lifestyle narrative section.",
  },
  {
    key: "about_who_we_are",
    labelEn: "About — Who We Are",
    labelAr: "من نحن — التعريف المؤسسي",
    description: "Overrides for the institutional monograph and overview sections.",
  },
  {
    key: "journal",
    labelEn: "Journal — Editorial Stories",
    labelAr: "المقالات — القصص والافتتاحيات",
    description: "Overrides for editorial article cards and journal typography.",
  },
];

const ROLES: TypographyRole[] = [
  "heroHeading",
  "sectionHeading",
  "cardTitle",
  "body",
  "meta",
  "tag",
];

export function TypographyManager({
  initialSettings,
}: {
  initialSettings: StoredTypographySetting[];
}) {
  const [activeScope, setActiveScope] = useState<TypographyScope>("global");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [previewLocale, setPreviewLocale] = useState<"en" | "ar">("en");

  // State map: key = `${sectionKey}_${role}` -> TypographyValues
  const [settingsMap, setSettingsMap] = useState<Record<string, TypographyValues>>(() => {
    const map: Record<string, TypographyValues> = {};
    for (const s of initialSettings) {
      if (s.key) {
        const parts = s.key.split(":");
        if (parts.length >= 2) {
          const k = `${parts[0]}_${parts[1]}`;
          map[k] = {
            fontSizeMobile: s.fontSizeMobile ?? undefined,
            fontSizeDesktop: s.fontSizeDesktop ?? undefined,
            lineHeight: s.lineHeight ?? undefined,
            fontWeight: s.fontWeight ?? undefined,
          };
        }
      }
    }
    return map;
  });

  // Helper to read current effective values (falling back from section override -> global -> baseline)
  const getEffectiveValues = (scope: TypographyScope, role: TypographyRole) => {
    const sectionVals = settingsMap[`${scope}_${role}`];
    const globalVals = settingsMap[`global_${role}`];
    const baseline = BASELINE_TYPOGRAPHY[role][previewLocale];

    const mobile = sectionVals?.fontSizeMobile ?? globalVals?.fontSizeMobile ?? baseline.fontSizeMobile!;
    const desktop = sectionVals?.fontSizeDesktop ?? globalVals?.fontSizeDesktop ?? baseline.fontSizeDesktop!;
    const lh = sectionVals?.lineHeight ?? globalVals?.lineHeight ?? baseline.lineHeight!;
    const weight = sectionVals?.fontWeight ?? globalVals?.fontWeight ?? baseline.fontWeight!;

    const isSectionOverridden = Boolean(
      scope !== "global" &&
      (sectionVals?.fontSizeMobile !== undefined ||
       sectionVals?.fontSizeDesktop !== undefined ||
       sectionVals?.lineHeight !== undefined ||
       sectionVals?.fontWeight !== undefined)
    );

    const isGlobalOverridden = Boolean(
      globalVals?.fontSizeMobile !== undefined ||
      globalVals?.fontSizeDesktop !== undefined ||
      globalVals?.lineHeight !== undefined ||
      globalVals?.fontWeight !== undefined
    );

    return {
      mobile,
      desktop,
      lineHeight: lh,
      fontWeight: weight,
      isSectionOverridden,
      isGlobalOverridden,
      rawSection: sectionVals,
      rawGlobal: globalVals,
    };
  };

  const handleUpdate = (
    role: TypographyRole,
    field: keyof TypographyValues,
    value: number | undefined
  ) => {
    const k = `${activeScope}_${role}`;
    setSettingsMap((prev) => {
      const current = prev[k] || {};
      const updated = { ...current, [field]: value };
      
      // If all properties undefined/empty, clean up key
      const hasAny = Object.values(updated).some((v) => v !== undefined && v !== null && !isNaN(v));
      if (!hasAny) {
        const next = { ...prev };
        delete next[k];
        return next;
      }
      return { ...prev, [k]: updated };
    });
  };

  const handleResetRole = (role: TypographyRole) => {
    const k = `${activeScope}_${role}`;
    setSettingsMap((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const handleResetSection = () => {
    if (activeScope === "global") {
      if (!confirm("Are you sure you want to reset all global typography overrides to design defaults?")) return;
    } else {
      if (!confirm(`Reset all overrides for "${activeScope}" so it inherits from global defaults?`)) return;
    }

    setSettingsMap((prev) => {
      const next = { ...prev };
      for (const role of ROLES) {
        delete next[`${activeScope}_${role}`];
      }
      return next;
    });
  };

  // Prepare submission JSON payload for ActionForm
  const submissionJson = useMemo(() => {
    const list: Array<{
      sectionKey: string;
      role: TypographyRole;
      fontSizeMobile: number | null;
      fontSizeDesktop: number | null;
      lineHeight: number | null;
      fontWeight: number | null;
    }> = [];

    for (const scopeOpt of SCOPE_OPTIONS) {
      for (const role of ROLES) {
        const k = `${scopeOpt.key}_${role}`;
        const val = settingsMap[k];
        if (val) {
          list.push({
            sectionKey: scopeOpt.key,
            role,
            fontSizeMobile: val.fontSizeMobile ?? null,
            fontSizeDesktop: val.fontSizeDesktop ?? null,
            lineHeight: val.lineHeight ?? null,
            fontWeight: val.fontWeight ?? null,
          });
        }
      }
    }
    return JSON.stringify(list);
  }, [settingsMap]);

  return (
    <div className="typography-cms-container" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Scope Navigation Tabs */}
      <section className="panel" style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0 }}>Select Typography Scope</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              Configure site-wide typography or customize dedicated sections. Overrides inherit unspecified values from Global Defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetSection}
            className="btn-featured-secondary"
            style={{ fontSize: "12px", padding: "6px 14px", minHeight: "36px" }}
          >
            {activeScope === "global" ? "Reset All Globals to Default" : "Reset Section to Inherit"}
          </button>
        </div>

        <div
          role="tablist"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "12px",
          }}
        >
          {SCOPE_OPTIONS.map((opt) => {
            const isActive = activeScope === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveScope(opt.key)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid var(--forest)" : "1px solid rgba(0,0,0,0.08)",
                  background: isActive ? "var(--forest)" : "rgba(0,0,0,0.02)",
                  color: isActive ? "#ffffff" : "var(--foreground)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{opt.labelEn}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Controls (Left) & Live Preview (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" }}>
        
        {/* Left Column: Role Editors & Action Form */}
        <ActionForm action={saveTypography} className="admin-form" submitLabel="Publish All Typography Settings">
          <input type="hidden" name="typographyJson" value={submissionJson} />

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {ROLES.map((role) => {
              const cfg = TYPOGRAPHY_ROLES[role];
              const effective = getEffectiveValues(activeScope, role);
              const activeInputVals = settingsMap[`${activeScope}_${role}`] || {};
              const clampExpression = computeFluidClamp(effective.mobile, effective.desktop);

              return (
                <section
                  key={role}
                  className="panel"
                  style={{
                    border: effective.isSectionOverridden ? "1px solid rgba(42, 69, 52, 0.35)" : "1px solid var(--border)",
                    boxShadow: effective.isSectionOverridden ? "0 4px 14px rgba(27, 48, 34, 0.05)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{cfg.labelEn}</h3>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>({cfg.labelAr})</span>
                        {activeScope !== "global" && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 600,
                              background: effective.isSectionOverridden ? "rgba(42, 69, 52, 0.1)" : "rgba(0, 0, 0, 0.05)",
                              color: effective.isSectionOverridden ? "var(--forest)" : "var(--muted)",
                            }}
                          >
                            {effective.isSectionOverridden ? "Section Override Active" : "Inheriting from Global"}
                          </span>
                        )}
                      </div>
                      <p className="hint" style={{ margin: "4px 0 0" }}>{cfg.descriptionEn}</p>
                    </div>

                    {(activeInputVals.fontSizeMobile !== undefined ||
                      activeInputVals.fontSizeDesktop !== undefined ||
                      activeInputVals.lineHeight !== undefined ||
                      activeInputVals.fontWeight !== undefined) && (
                      <button
                        type="button"
                        onClick={() => handleResetRole(role)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--muted)",
                          fontSize: "12px",
                          textDecoration: "underline",
                          cursor: "pointer",
                          padding: "2px 4px",
                        }}
                      >
                        Reset Role
                      </button>
                    )}
                  </div>

                  {/* Safe Range Guidance Strip */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                      background: "rgba(0,0,0,0.025)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      color: "var(--muted)",
                      marginBottom: "14px",
                    }}
                  >
                    <span><strong>Mobile Range:</strong> {cfg.safeMinMobile}px – {cfg.safeMaxMobile}px</span>
                    <span>•</span>
                    <span><strong>Desktop Range:</strong> {cfg.safeMinDesktop}px – {cfg.safeMaxDesktop}px</span>
                    <span>•</span>
                    <span><strong>Line Height:</strong> {cfg.minLineHeight} – {cfg.maxLineHeight}</span>
                  </div>

                  {/* 4-Field Grid: Mobile Size, Desktop Size, Line Height, Weight */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px" }}>
                    {/* Mobile Size */}
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, marginBottom: "5px" }}>
                        Mobile Size (px)
                      </label>
                      <input
                        type="number"
                        min={cfg.safeMinMobile}
                        max={cfg.safeMaxMobile}
                        placeholder={`${effective.mobile} (default)`}
                        value={activeInputVals.fontSizeMobile ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Number(e.target.value);
                          handleUpdate(role, "fontSizeMobile", v);
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    {/* Desktop Size */}
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, marginBottom: "5px" }}>
                        Desktop Size (px)
                      </label>
                      <input
                        type="number"
                        min={cfg.safeMinDesktop}
                        max={cfg.safeMaxDesktop}
                        placeholder={`${effective.desktop} (default)`}
                        value={activeInputVals.fontSizeDesktop ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Number(e.target.value);
                          handleUpdate(role, "fontSizeDesktop", v);
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    {/* Line Height */}
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, marginBottom: "5px" }}>
                        Line Height
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min={cfg.minLineHeight}
                        max={cfg.maxLineHeight}
                        placeholder={`${effective.lineHeight} (default)`}
                        value={activeInputVals.lineHeight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Number(e.target.value);
                          handleUpdate(role, "lineHeight", v);
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
                        }}
                      />
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, marginBottom: "5px" }}>
                        Font Weight
                      </label>
                      <select
                        value={activeInputVals.fontWeight ?? ""}
                        onChange={(e) => {
                          const v = e.target.value === "" ? undefined : Number(e.target.value);
                          handleUpdate(role, "fontWeight", v);
                        }}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
                        }}
                      >
                        <option value="">Inherit ({effective.fontWeight})</option>
                        {APPROVED_FONT_WEIGHTS.map((w) => (
                          <option key={w.value} value={w.value}>
                            {w.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Computed Fluid Clamp Formula */}
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>
                    Interpolated: <code style={{ background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: "3px" }}>{clampExpression}</code>
                  </div>
                </section>
              );
            })}
          </div>
        </ActionForm>

        {/* Right Column: Sticky Live Interactive Component Preview */}
        <div style={{ position: "sticky", top: "24px" }}>
          <section className="panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Live Component Preview</h2>

              {/* Viewport & Locale Switchers */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: previewViewport === "desktop" ? "var(--forest)" : "transparent",
                      color: previewViewport === "desktop" ? "#ffffff" : "var(--foreground)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: previewViewport === "mobile" ? "var(--forest)" : "transparent",
                      color: previewViewport === "mobile" ? "#ffffff" : "var(--foreground)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Mobile (390px)
                  </button>
                </div>

                <div style={{ display: "inline-flex", borderRadius: "6px", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewLocale("en")}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: previewLocale === "en" ? "var(--forest)" : "transparent",
                      color: previewLocale === "en" ? "#ffffff" : "var(--foreground)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLocale("ar")}
                    style={{
                      padding: "5px 10px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: previewLocale === "ar" ? "var(--forest)" : "transparent",
                      color: previewLocale === "ar" ? "#ffffff" : "var(--foreground)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    العربية
                  </button>
                </div>
              </div>
            </div>

            <p className="hint" style={{ margin: 0 }}>
              Live rendering of components using the effective typography styles for <strong>{activeScope}</strong>.
            </p>

            {/* Preview Frame */}
            <div
              dir={previewLocale === "ar" ? "rtl" : "ltr"}
              style={{
                width: previewViewport === "mobile" ? "390px" : "100%",
                maxWidth: "100%",
                margin: "0 auto",
                background: "#faf9f6",
                borderRadius: "14px",
                border: "1px solid rgba(42, 69, 52, 0.15)",
                padding: previewViewport === "mobile" ? "20px 16px" : "28px 24px",
                boxShadow: "0 8px 24px rgba(27, 48, 34, 0.06)",
                boxSizing: "border-box",
                transition: "width 0.2s ease",
              }}
            >
              {/* Section Header / Kicker */}
              <div
                style={{
                  fontSize: `${getEffectiveValues(activeScope, "meta")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                  lineHeight: getEffectiveValues(activeScope, "meta").lineHeight,
                  fontWeight: getEffectiveValues(activeScope, "meta").fontWeight,
                  color: "var(--forest)",
                  textTransform: previewLocale === "ar" ? "none" : "uppercase",
                  letterSpacing: previewLocale === "ar" ? "0" : "0.08em",
                  marginBottom: "8px",
                }}
              >
                {previewLocale === "ar" ? "مشاريع إيمدج للتطوير" : "FEATURED DEVELOPMENTS"}
              </div>

              {/* Section Heading */}
              <h2
                style={{
                  fontSize: `${getEffectiveValues(activeScope, "sectionHeading")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                  lineHeight: getEffectiveValues(activeScope, "sectionHeading").lineHeight,
                  fontWeight: getEffectiveValues(activeScope, "sectionHeading").fontWeight,
                  color: "var(--forest)",
                  margin: "0 0 12px",
                }}
              >
                {previewLocale === "ar"
                  ? "وجهات معمارية تصنع مستقبلاً جديداً"
                  : "Architectural destinations with perspective."}
              </h2>

              {/* Body Text */}
              <p
                style={{
                  fontSize: `${getEffectiveValues(activeScope, "body")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                  lineHeight: getEffectiveValues(activeScope, "body").lineHeight,
                  fontWeight: getEffectiveValues(activeScope, "body").fontWeight,
                  color: "var(--muted)",
                  margin: "0 0 20px",
                }}
              >
                {previewLocale === "ar"
                  ? "مجموعة مختارة من الوجهات السكنية والمختلطة التي تصنع ملامح جديدة للحياة الحضرية في مصر."
                  : "A curated collection of residential and mixed-use destinations shaping Egypt's urban landscape."}
              </p>

              {/* Location Tags Preview */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                <span
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "tag")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "tag").lineHeight,
                    fontWeight: 600,
                    background: "var(--forest)",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {previewLocale === "ar" ? "كافة المشاريع" : "All Projects"}
                </span>
                <span
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "tag")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "tag").lineHeight,
                    fontWeight: getEffectiveValues(activeScope, "tag").fontWeight,
                    background: "rgba(42, 69, 52, 0.04)",
                    border: "1px solid rgba(42, 69, 52, 0.16)",
                    color: "var(--forest)",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {previewLocale === "ar" ? "القاهرة الجديدة" : "New Cairo"}
                </span>
                <span
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "tag")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "tag").lineHeight,
                    fontWeight: getEffectiveValues(activeScope, "tag").fontWeight,
                    background: "rgba(42, 69, 52, 0.04)",
                    border: "1px solid rgba(42, 69, 52, 0.16)",
                    color: "var(--forest)",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {previewLocale === "ar" ? "زايد الجديدة" : "New Zayed"}
                </span>
              </div>

              {/* Sample Project Card */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid rgba(42, 69, 52, 0.1)",
                  padding: "16px",
                  boxShadow: "0 4px 16px rgba(27, 48, 34, 0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "meta")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    color: "var(--muted)",
                    marginBottom: "6px",
                  }}
                >
                  {previewLocale === "ar" ? "القاهرة الجديدة • سكني" : "New Cairo • Residential"}
                </div>
                <h3
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "cardTitle")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "cardTitle").lineHeight,
                    fontWeight: getEffectiveValues(activeScope, "cardTitle").fontWeight,
                    color: "var(--forest)",
                    margin: "0 0 8px",
                  }}
                >
                  {previewLocale === "ar" ? "كمباوند بيلانو" : "Belano Compound"}
                </h3>
                <p
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "body")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "body").lineHeight,
                    fontWeight: getEffectiveValues(activeScope, "body").fontWeight,
                    color: "var(--muted)",
                    margin: "0 0 14px",
                  }}
                >
                  {previewLocale === "ar"
                    ? "مجتمع سكني متكامل يجمع بين الهدوء والمساحات الخضراء والخدمات الذكية."
                    : "An integrated residential community harmonizing serenity, lush landscapes, and smart living."}
                </p>
                <button
                  type="button"
                  style={{
                    fontSize: `${getEffectiveValues(activeScope, "tag")[previewViewport === "mobile" ? "mobile" : "desktop"]}px`,
                    lineHeight: getEffectiveValues(activeScope, "tag").lineHeight,
                    fontWeight: 600,
                    background: "var(--forest)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  {previewLocale === "ar" ? "اكتشف المشروع ←" : "Explore Project →"}
                </button>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
