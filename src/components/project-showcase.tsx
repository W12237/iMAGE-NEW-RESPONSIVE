"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { HomeContent } from "@/content/home";
import { useEnquiryModal } from "./enquiry-provider";

// Canonical location definitions for Image Developments portfolio
export interface CanonicalLocation {
  id: string;
  nameEn: string;
  nameAr: string;
  keywords: string[];
}

export const CANONICAL_LOCATIONS: CanonicalLocation[] = [
  {
    id: "new-cairo",
    nameEn: "New Cairo",
    nameAr: "القاهرة الجديدة",
    keywords: ["new cairo", "قاهرة جديدة", "القاهرة الجديدة", "fifth settlement", "التجمع"],
  },
  {
    id: "new-zayed",
    nameEn: "New Zayed",
    nameAr: "زايد الجديدة",
    keywords: ["new zayed", "زايد جديدة", "الشيخ زايد", "sheikh zayed", "زايد الجديدة"],
  },
  {
    id: "north-coast",
    nameEn: "North Coast",
    nameAr: "الساحل الشمالي",
    keywords: ["north coast", "ساحل", "الساحل الشمالي", "sahel"],
  },
  {
    id: "october",
    nameEn: "6th of October",
    nameAr: "السادس من أكتوبر",
    keywords: ["october", "أكتوبر", "6 october", "السادس من أكتوبر"],
  },
  {
    id: "new-capital",
    nameEn: "New Capital",
    nameAr: "العاصمة الإدارية",
    keywords: ["new capital", "administrative capital", "العاصمة الإدارية"],
  },
];

/**
 * Resolves a project's location fields into a stable canonical ID,
 * filtering out bare street addresses (axes, roads) without inventing fake categories.
 */
export function resolveProjectLocationId(p: {
  location?: string;
  locationEn?: string;
  locationAr?: string;
}): string | null {
  const text = `${p.locationEn || ""} ${p.locationAr || ""} ${p.location || ""}`.toLowerCase();

  for (const cat of CANONICAL_LOCATIONS) {
    if (cat.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return cat.id;
    }
  }

  // If not matching canonical, but has a valid location name (not a pure street address with axis/road/محور/شارع)
  const isStreetAddress = /(axis|street|st\.|road|محور|شارع)/i.test(text);
  if (!isStreetAddress && (p.locationEn || p.location)) {
    const raw = (p.locationEn || p.location || "").trim();
    if (raw.length > 2) {
      return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
  }

  return null;
}

// Project Types
export const PROJECT_TYPES = [
  { id: "ALL", labelEn: "All Types", labelAr: "كافة الأنواع" },
  { id: "Residential", labelEn: "Residential", labelAr: "سكني" },
  { id: "Commercial", labelEn: "Commercial", labelAr: "تجاري" },
  { id: "Medical", labelEn: "Medical", labelAr: "طبي" },
] as const;

// Project Statuses (delivery/construction progress)
export const PROJECT_STATUSES = [
  { id: "ALL", labelEn: "All Statuses", labelAr: "كافة الحالات" },
  { id: "Ongoing", labelEn: "Ongoing", labelAr: "قيد التنفيذ" },
  { id: "Delivered", labelEn: "Delivered", labelAr: "تم التسليم" },
  { id: "Upcoming", labelEn: "Upcoming", labelAr: "قريبًا" },
] as const;

function formatProjectCount(count: number, ar: boolean): string {
  if (ar) {
    if (count === 0) return "لا توجد مشاريع متاحة";
    if (count === 1) return "مشروع واحد متاح";
    if (count === 2) return "مشروعان متاحان";
    if (count >= 3 && count <= 10) return `${count} مشاريع متاحة`;
    return `${count} مشروعاً متاحاً`;
  }
  return count === 1 ? "1 Project Available" : `${count} Projects Available`;
}

type DropdownKey = "location" | "type" | "status";

export function ProjectShowcase({
  copy,
  label,
}: {
  copy: HomeContent;
  label?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  const filterBarRef = useRef<HTMLDivElement>(null);
  const triggerRefs = {
    location: useRef<HTMLButtonElement>(null),
    type: useRef<HTMLButtonElement>(null),
    status: useRef<HTMLButtonElement>(null),
  };
  const listboxRefs = {
    location: useRef<HTMLDivElement>(null),
    type: useRef<HTMLDivElement>(null),
    status: useRef<HTMLDivElement>(null),
  };

  const reduce = useReducedMotion();
  const { openEnquiry } = useEnquiryModal();

  const total = copy.projects?.length ?? 0;
  const ar = copy.locale === "ar";
  const mediaTouchStart = useRef<{ x: number; y: number } | null>(null);

  // Derive available locations from published projects
  const availableLocations = useMemo(() => {
    const map = new Map<string, { id: string; nameEn: string; nameAr: string }>();
    (copy.projects ?? []).forEach((p) => {
      const locId = resolveProjectLocationId(p);
      if (locId) {
        const canonical = CANONICAL_LOCATIONS.find((c) => c.id === locId);
        if (canonical) {
          map.set(locId, { id: canonical.id, nameEn: canonical.nameEn, nameAr: canonical.nameAr });
        } else if (!map.has(locId)) {
          map.set(locId, {
            id: locId,
            nameEn: p.locationEn || p.location || locId,
            nameAr: p.locationAr || p.location || locId,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [copy.projects]);

  // Combined AND Filtering Logic
  const filteredProjects = useMemo(() => {
    return (copy.projects ?? []).filter((p) => {
      // 1. Location match
      if (selectedLocation !== "ALL") {
        const locId = resolveProjectLocationId(p);
        if (locId !== selectedLocation) return false;
      }
      // 2. Type match
      if (selectedType !== "ALL") {
        const pType = (p.projectType || "Residential").toLowerCase();
        if (pType !== selectedType.toLowerCase()) return false;
      }
      // 3. Status match
      if (selectedStatus !== "ALL") {
        const pStatus = (p.progressStatus || "Ongoing").toLowerCase();
        if (pStatus !== selectedStatus.toLowerCase()) return false;
      }
      return true;
    });
  }, [copy.projects, selectedLocation, selectedType, selectedStatus]);

  const hasActiveFilters =
    selectedLocation !== "ALL" || selectedType !== "ALL" || selectedStatus !== "ALL";

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSelectedLocation("ALL");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setActiveIndex(0);
    setActiveDropdown(null);
    setAnnouncement(
      ar
        ? "تمت إعادة ضبط جميع الفلاتر وعرض كافة المشاريع"
        : "Filters reset. Showing all projects."
    );
  }, [ar]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        filterBarRef.current &&
        !filterBarRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Handle Escape key to close open dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDropdown) {
        e.preventDefault();
        const currentDropdown = activeDropdown;
        setActiveDropdown(null);
        triggerRefs[currentDropdown]?.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDropdown]);

  // Announce polite screen reader update when filter results change
  useEffect(() => {
    const msg = formatProjectCount(filteredProjects.length, ar);
    setAnnouncement(msg);
  }, [filteredProjects.length, ar]);

  if (!total) return null;

  const sectionKicker = label || copy.projectsSection?.heading || copy.common.projects;
  const sectionTitle = copy.projectsSection?.heading || label || copy.common.projects;
  const sectionDesc = copy.projectsSection?.description;
  const exploreLabel = copy.projectsSection?.exploreLabel || copy.common.explore;
  const enquireLabel = copy.projectsSection?.enquireLabel || (ar ? "استفسر الآن" : "Enquire");
  const viewAllLabel = copy.projectsSection?.viewAllLabel || (ar ? "جميع المشاريع" : "View All Projects");

  const locationFilterLabel =
    copy.projectsSection?.locationFilterLabel || (ar ? "الموقع" : "Location");
  const typeFilterLabel =
    copy.projectsSection?.typeFilterLabel || (ar ? "نوع المشروع" : "Project Type");
  const statusFilterLabel =
    copy.projectsSection?.statusFilterLabel || (ar ? "حالة المشروع" : "Project Status");
  const resetFilterLabel =
    copy.projectsSection?.resetFilterLabel || (ar ? "إعادة ضبط الفلاتر" : "Reset Filters");

  const spacing = copy.projectsSection?.spacing || "standard";
  const theme = copy.projectsSection?.theme || "light";
  const imagePos = copy.projectsSection?.imagePosition || "start";

  // Clamp active index in case projects change
  const safeIndex = activeIndex >= filteredProjects.length ? 0 : activeIndex;
  const activeProject = filteredProjects[safeIndex];

  const matchingInquiry = activeProject
    ? copy.inquiryProjects?.find(
        (ip) => ip.name.toLowerCase() === activeProject.name.toLowerCase()
      )
    : null;
  const resolvedProjectId =
    matchingInquiry?.id ||
    activeProject?.id ||
    activeProject?.name.toLowerCase().replace(/\s+/g, "-") ||
    "";

  const primaryActionHref = activeProject
    ? activeProject.ctaUrl && !activeProject.ctaUrl.startsWith("#")
      ? activeProject.ctaUrl
      : `/${copy.locale}/projects/${activeProject.slug || activeProject.id || resolvedProjectId}`
    : "#";

  const primaryActionLabel = activeProject?.ctaLabel || exploreLabel;

  const handleEnquire = (p: typeof activeProject) => {
    if (!p) return;
    openEnquiry({
      projectId: resolvedProjectId,
      projectName: p.name,
      enquiryType: "project",
      sourceCta: "home-featured-projects",
    });
  };

  // Selected value display strings
  const selectedLocationDisplay =
    selectedLocation === "ALL"
      ? ar
        ? "كافة المواقع"
        : "All Locations"
      : availableLocations.find((l) => l.id === selectedLocation)?.[
          ar ? "nameAr" : "nameEn"
        ] || selectedLocation;

  const selectedTypeDisplay =
    selectedType === "ALL"
      ? ar
        ? "كافة الأنواع"
        : "All Types"
      : PROJECT_TYPES.find((t) => t.id.toLowerCase() === selectedType.toLowerCase())?.[
          ar ? "labelAr" : "labelEn"
        ] || selectedType;

  const selectedStatusDisplay =
    selectedStatus === "ALL"
      ? ar
        ? "كافة الحالات"
        : "All Statuses"
      : PROJECT_STATUSES.find(
          (s) => s.id.toLowerCase() === selectedStatus.toLowerCase()
        )?.[ar ? "labelAr" : "labelEn"] || selectedStatus;

  // Active project badge labels (localized)
  const projectTypeBadge = activeProject?.projectType
    ? PROJECT_TYPES.find(
        (t) => t.id.toLowerCase() === activeProject.projectType?.toLowerCase()
      )?.[ar ? "labelAr" : "labelEn"] || activeProject.projectType
    : null;

  const projectStatusBadge = activeProject?.progressStatus
    ? PROJECT_STATUSES.find(
        (s) => s.id.toLowerCase() === activeProject.progressStatus?.toLowerCase()
      )?.[ar ? "labelAr" : "labelEn"] || activeProject.progressStatus
    : null;

  const projectLocationBadge =
    activeProject?.location ||
    (ar ? activeProject?.locationAr : activeProject?.locationEn) ||
    null;

  const sectionBg =
    theme === "light" && copy.backgrounds.projects
      ? `rgb(${copy.backgrounds.projects})`
      : undefined;

  // Keyboard navigation within listbox items
  const handleListboxKeyDown = (
    e: React.KeyboardEvent,
    dropdownKey: DropdownKey,
    optionsLength: number
  ) => {
    const listbox = listboxRefs[dropdownKey].current;
    if (!listbox) return;

    const items = Array.from(
      listbox.querySelectorAll<HTMLButtonElement>('[role="option"]')
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % optionsLength;
      items[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + optionsLength) % optionsLength;
      items[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[optionsLength - 1]?.focus();
    } else if (e.key === "Tab") {
      setActiveDropdown(null);
    }
  };

  return (
    <section
      id="projects"
      className={`featured-projects-section featured-projects--${spacing} featured-projects--${theme}`}
      style={sectionBg ? { backgroundColor: sectionBg } : undefined}
      aria-labelledby="featured-projects-title"
    >
      {/* Anchor for backward compatibility with #developments */}
      <div id="developments" style={{ position: "absolute", top: 0 }} aria-hidden="true" />

      {/* Screen Reader Polite Live Region for Filter Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="stage-pad featured-projects-container">
        {/* Section Header */}
        <header className="featured-projects-head">
          <div className="featured-projects-head-text">
            <div className="featured-projects-kicker">
              <span>{sectionKicker}</span>
            </div>
            <h2 id="featured-projects-title" className="featured-projects-title">
              {sectionTitle}
            </h2>
            {sectionDesc && (
              <p className="featured-projects-desc">{sectionDesc}</p>
            )}
          </div>

          <Link
            href={`/${copy.locale}/projects`}
            className="featured-projects-all-link"
            aria-label={`${viewAllLabel} (${ar ? "المشاريع" : "Projects"})`}
          >
            <span>{viewAllLabel}</span>
            <b aria-hidden="true">{ar ? "←" : "→"}</b>
          </Link>
        </header>

        {/* Professional 3-Field Architectural Filter Bar */}
        <div className="homepage-filter-wrapper" ref={filterBarRef}>
          <div
            className="homepage-filter-bar"
            role="region"
            aria-label={ar ? "تصفية المشاريع" : "Filter projects"}
          >
            {/* 1. Location / الموقع */}
            <div className="homepage-filter-segment">
              <button
                ref={triggerRefs.location}
                type="button"
                id="filter-trigger-location"
                aria-haspopup="listbox"
                aria-expanded={activeDropdown === "location"}
                aria-controls="filter-listbox-location"
                aria-label={`${locationFilterLabel}: ${selectedLocationDisplay}`}
                className={`homepage-filter-trigger ${
                  selectedLocation !== "ALL" ? "has-value" : ""
                } ${activeDropdown === "location" ? "is-active" : ""}`}
                onClick={() =>
                  setActiveDropdown((prev) => (prev === "location" ? null : "location"))
                }
              >
                {/* Outline Icon */}
                <div className="homepage-filter-icon-box" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>

                {/* Text Block */}
                <div className="homepage-filter-text">
                  <span className="homepage-filter-label" id="filter-label-location">
                    {locationFilterLabel}
                  </span>
                  <span className="homepage-filter-value" id="filter-val-location">
                    {selectedLocationDisplay}
                  </span>
                </div>

                {/* Chevron */}
                <div className="homepage-filter-chevron-wrap" aria-hidden="true">
                  <svg
                    className={`homepage-filter-chevron ${
                      activeDropdown === "location" ? "is-open" : ""
                    }`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Location Listbox Panel */}
              {activeDropdown === "location" && (
                <div
                  ref={listboxRefs.location}
                  id="filter-listbox-location"
                  role="listbox"
                  aria-labelledby="filter-label-location"
                  className="homepage-filter-dropdown"
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, "location", availableLocations.length + 1)
                  }
                >
                  {/* Option: All Locations */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedLocation === "ALL"}
                    className={`homepage-filter-dropdown-item ${
                      selectedLocation === "ALL" ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedLocation("ALL");
                      setActiveIndex(0);
                      setActiveDropdown(null);
                      triggerRefs.location.current?.focus();
                    }}
                  >
                    <span>{ar ? "كافة المواقع" : "All Locations"}</span>
                    {selectedLocation === "ALL" && (
                      <svg
                        className="homepage-filter-check"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Dynamic Published Location Categories */}
                  {availableLocations.map((loc) => {
                    const isSelected = selectedLocation === loc.id;
                    const locLabel = ar ? loc.nameAr : loc.nameEn;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`homepage-filter-dropdown-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedLocation(loc.id);
                          setActiveIndex(0);
                          setActiveDropdown(null);
                          triggerRefs.location.current?.focus();
                        }}
                      >
                        <span>{locLabel}</span>
                        {isSelected && (
                          <svg
                            className="homepage-filter-check"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Project Type / نوع المشروع */}
            <div className="homepage-filter-segment">
              <button
                ref={triggerRefs.type}
                type="button"
                id="filter-trigger-type"
                aria-haspopup="listbox"
                aria-expanded={activeDropdown === "type"}
                aria-controls="filter-listbox-type"
                aria-label={`${typeFilterLabel}: ${selectedTypeDisplay}`}
                className={`homepage-filter-trigger ${
                  selectedType !== "ALL" ? "has-value" : ""
                } ${activeDropdown === "type" ? "is-active" : ""}`}
                onClick={() =>
                  setActiveDropdown((prev) => (prev === "type" ? null : "type"))
                }
              >
                {/* Outline Icon */}
                <div className="homepage-filter-icon-box" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22v-4h6v4" />
                    <path
                      d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"
                      strokeWidth="2.2"
                    />
                  </svg>
                </div>

                {/* Text Block */}
                <div className="homepage-filter-text">
                  <span className="homepage-filter-label" id="filter-label-type">
                    {typeFilterLabel}
                  </span>
                  <span className="homepage-filter-value" id="filter-val-type">
                    {selectedTypeDisplay}
                  </span>
                </div>

                {/* Chevron */}
                <div className="homepage-filter-chevron-wrap" aria-hidden="true">
                  <svg
                    className={`homepage-filter-chevron ${
                      activeDropdown === "type" ? "is-open" : ""
                    }`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Type Listbox Panel */}
              {activeDropdown === "type" && (
                <div
                  ref={listboxRefs.type}
                  id="filter-listbox-type"
                  role="listbox"
                  aria-labelledby="filter-label-type"
                  className="homepage-filter-dropdown"
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, "type", PROJECT_TYPES.length)
                  }
                >
                  {PROJECT_TYPES.map((t) => {
                    const isSelected = selectedType.toLowerCase() === t.id.toLowerCase();
                    const optLabel = ar ? t.labelAr : t.labelEn;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`homepage-filter-dropdown-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedType(t.id);
                          setActiveIndex(0);
                          setActiveDropdown(null);
                          triggerRefs.type.current?.focus();
                        }}
                      >
                        <span>{optLabel}</span>
                        {isSelected && (
                          <svg
                            className="homepage-filter-check"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Project Status / حالة المشروع */}
            <div className="homepage-filter-segment">
              <button
                ref={triggerRefs.status}
                type="button"
                id="filter-trigger-status"
                aria-haspopup="listbox"
                aria-expanded={activeDropdown === "status"}
                aria-controls="filter-listbox-status"
                aria-label={`${statusFilterLabel}: ${selectedStatusDisplay}`}
                className={`homepage-filter-trigger ${
                  selectedStatus !== "ALL" ? "has-value" : ""
                } ${activeDropdown === "status" ? "is-active" : ""}`}
                onClick={() =>
                  setActiveDropdown((prev) => (prev === "status" ? null : "status"))
                }
              >
                {/* Outline Icon */}
                <div className="homepage-filter-icon-box" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>

                {/* Text Block */}
                <div className="homepage-filter-text">
                  <span className="homepage-filter-label" id="filter-label-status">
                    {statusFilterLabel}
                  </span>
                  <span className="homepage-filter-value" id="filter-val-status">
                    {selectedStatusDisplay}
                  </span>
                </div>

                {/* Chevron */}
                <div className="homepage-filter-chevron-wrap" aria-hidden="true">
                  <svg
                    className={`homepage-filter-chevron ${
                      activeDropdown === "status" ? "is-open" : ""
                    }`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Status Listbox Panel */}
              {activeDropdown === "status" && (
                <div
                  ref={listboxRefs.status}
                  id="filter-listbox-status"
                  role="listbox"
                  aria-labelledby="filter-label-status"
                  className="homepage-filter-dropdown"
                  onKeyDown={(e) =>
                    handleListboxKeyDown(e, "status", PROJECT_STATUSES.length)
                  }
                >
                  {PROJECT_STATUSES.map((s) => {
                    const isSelected =
                      selectedStatus.toLowerCase() === s.id.toLowerCase();
                    const optLabel = ar ? s.labelAr : s.labelEn;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`homepage-filter-dropdown-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedStatus(s.id);
                          setActiveIndex(0);
                          setActiveDropdown(null);
                          triggerRefs.status.current?.focus();
                        }}
                      >
                        <span>{optLabel}</span>
                        {isSelected && (
                          <svg
                            className="homepage-filter-check"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Results Count & Reset Bar */}
          <div
            className="homepage-filter-results"
            aria-label={ar ? "نتائج التصفية" : "Filter results"}
          >
            <div className="homepage-filter-count" aria-live="polite">
              <span className="count-dot" aria-hidden="true" />
              <span>{formatProjectCount(filteredProjects.length, ar)}</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-homepage-filter-reset"
                aria-label={resetFilterLabel}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>{resetFilterLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Display: Showcase or Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="homepage-filter-empty" role="status">
            <div className="empty-icon-wrap" aria-hidden="true">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 className="empty-title">
              {ar ? "لا توجد مشاريع مطابقة" : "No Matching Projects"}
            </h3>
            <p className="empty-desc">
              {ar
                ? "لم نجد أي مشروع يطابق معايير التصفية المحددة. يمكنك تعديل الخيارات أو إعادة ضبط الفلاتر لاستعراض كافة مشاريع إيمدج."
                : "We couldn't find any projects matching your selected criteria. Try adjusting your options or resetting filters to browse all projects."}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-featured-secondary"
            >
              <span>{resetFilterLabel}</span>
            </button>
          </div>
        ) : (
          /* Active Project Showcase */
          <div
            id={`project-panel-${safeIndex}`}
            role="region"
            aria-label={`${ar ? "مشروع" : "Project"} ${activeProject.name}`}
            className={`featured-project-showcase ${
              imagePos === "end" ? "is-image-end" : "is-image-start"
            }`}
          >
            {/* Architectural Image with Touch Swipe */}
            <div
              className="featured-project-media"
              onTouchStart={(e) => {
                mediaTouchStart.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!mediaTouchStart.current || filteredProjects.length <= 1) return;
                const dx = e.changedTouches[0].clientX - mediaTouchStart.current.x;
                const dy = Math.abs(e.changedTouches[0].clientY - mediaTouchStart.current.y);
                if (Math.abs(dx) > 40 && dy < 50) {
                  if ((!ar && dx < 0) || (ar && dx > 0)) {
                    setActiveIndex((prev) => (prev + 1) % filteredProjects.length);
                  } else {
                    setActiveIndex(
                      (prev) => (prev - 1 + filteredProjects.length) % filteredProjects.length
                    );
                  }
                }
                mediaTouchStart.current = null;
              }}
            >
              <motion.div
                key={`image-${activeProject.name}-${safeIndex}`}
                initial={{ opacity: reduce ? 1 : 0.88, scale: reduce ? 1 : 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="featured-project-frame"
              >
                <Image
                  src={activeProject.image}
                  alt={
                    activeProject.alt ||
                    `${activeProject.name}, ${activeProject.location}`
                  }
                  fill
                  priority={safeIndex === 0}
                  sizes="(max-width: 900px) 100vw, 55vw"
                  className="featured-project-img"
                />
              </motion.div>
            </div>

            {/* Project Details */}
            <motion.div
              key={`content-${activeProject.name}-${safeIndex}`}
              initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduce ? 0 : 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="featured-project-info"
            >
              <div className="featured-project-meta">
                {projectLocationBadge && (
                  <div className="featured-project-location">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{projectLocationBadge}</span>
                  </div>
                )}
                {projectTypeBadge && (
                  <span className="featured-project-type">
                    {projectTypeBadge}
                  </span>
                )}
                {projectStatusBadge && (
                  <span className="featured-project-type featured-project-status">
                    {projectStatusBadge}
                  </span>
                )}
              </div>

              <h3 className="featured-project-name">{activeProject.name}</h3>

              {activeProject.promise && (
                <p className="featured-project-promise">{activeProject.promise}</p>
              )}

              {/* Actions Row */}
              <div className="featured-project-actions">
                <Link
                  href={primaryActionHref}
                  className="btn-featured-primary"
                  aria-label={`${exploreLabel}: ${activeProject.name}`}
                >
                  <span>{primaryActionLabel}</span>
                  <b aria-hidden="true">{ar ? "←" : "→"}</b>
                </Link>

                <button
                  type="button"
                  className="btn-featured-secondary"
                  onClick={() => handleEnquire(activeProject)}
                  data-enquiry-trigger
                  data-project-id={resolvedProjectId}
                  data-project-name={activeProject.name}
                  data-enquiry-type="project"
                  data-source-cta="home-featured-projects"
                  aria-label={`${enquireLabel}: ${activeProject.name}`}
                >
                  <span>{enquireLabel}</span>
                </button>

                {activeProject.brochureUrl && (
                  <a
                    href={activeProject.brochureUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-featured-brochure"
                    aria-label={`${
                      ar ? "تحميل كتيب" : "Download Brochure"
                    } ${activeProject.name}`}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{ar ? "الكتيب" : "Brochure"}</span>
                  </a>
                )}
              </div>

              {/* Navigation Stepper / Subtle Indicator Dots when multiple matches */}
              {filteredProjects.length > 1 && (
                <div
                  className="featured-project-nav"
                  aria-label={ar ? "التنقل بين المشاريع" : "Project Navigation"}
                >
                  <div className="featured-project-dots" aria-hidden="true">
                    {filteredProjects.map((p, idx) => (
                      <button
                        key={p.id || p.name || idx}
                        type="button"
                        className={`featured-project-dot ${
                          safeIndex === idx ? "is-active" : ""
                        }`}
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`${ar ? "المشروع" : "Project"} ${p.name}`}
                      />
                    ))}
                  </div>
                  <div className="featured-project-nav-arrows">
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx =
                          (safeIndex - 1 + filteredProjects.length) %
                          filteredProjects.length;
                        setActiveIndex(prevIdx);
                      }}
                      className="featured-nav-btn"
                      aria-label={ar ? "المشروع السابق" : "Previous project"}
                    >
                      {ar ? "→" : "←"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx =
                          (safeIndex + 1) % filteredProjects.length;
                        setActiveIndex(nextIdx);
                      }}
                      className="featured-nav-btn"
                      aria-label={ar ? "المشروع التالي" : "Next project"}
                    >
                      {ar ? "←" : "→"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
