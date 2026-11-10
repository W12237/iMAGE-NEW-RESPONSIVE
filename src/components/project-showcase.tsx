"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomeContent } from "@/content/home";
import { getFluidTypographyStyle } from "@/lib/typography";
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
 * avoiding reliance on translated text comparisons.
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

  // If not matching canonical, but has a valid location name (not a pure street address)
  const isStreetAddress = /(axis|street|st\.|road|محور|شارع)/i.test(text);
  if (!isStreetAddress && (p.locationEn || p.location)) {
    const raw = (p.locationEn || p.location || "").trim();
    if (raw.length > 2) {
      return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
  }

  return null;
}

// Project Types & Statuses (retained for badges and dedicated projects page)
export const PROJECT_TYPES = [
  { id: "ALL", labelEn: "All Types", labelAr: "كافة الأنواع" },
  { id: "Residential", labelEn: "Residential", labelAr: "سكني" },
  { id: "Commercial", labelEn: "Commercial", labelAr: "تجاري" },
  { id: "Medical", labelEn: "Medical", labelAr: "طبي" },
] as const;

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

export function ProjectShowcase({
  copy,
  label,
}: {
  copy: HomeContent;
  label?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [announcement, setAnnouncement] = useState<string>("");

  const reduce = useReducedMotion();
  const { openEnquiry } = useEnquiryModal();

  const total = copy.projects?.length ?? 0;
  const ar = copy.locale === "ar";
  const supportedLocale = ar ? "ar" : "en";
  const mediaTouchStart = useRef<{ x: number; y: number } | null>(null);

  // Configuration from CMS projectsSection
  const tagsEnabled = copy.projectsSection?.locationTagsEnabled ?? true;
  const showTagCounts = copy.projectsSection?.showTagCounts ?? false;
  const locationOrder = copy.projectsSection?.locationOrder ?? "auto";
  const visibleLocationsFilter = copy.projectsSection?.visibleLocations;

  const allProjectsLabel =
    copy.projectsSection?.allLabel ||
    (ar ? "كافة المشاريع" : "All Projects");

  // Derive distinct eligible locations and project counts from CMS records
  const { availableLocations, locationCounts } = useMemo(() => {
    const map = new Map<string, { id: string; nameEn: string; nameAr: string }>();
    const counts = new Map<string, number>();

    (copy.projects ?? []).forEach((p) => {
      const locId = resolveProjectLocationId(p);
      if (locId) {
        counts.set(locId, (counts.get(locId) || 0) + 1);
        if (!map.has(locId)) {
          const canonical = CANONICAL_LOCATIONS.find((c) => c.id === locId);
          if (canonical) {
            map.set(locId, { id: canonical.id, nameEn: canonical.nameEn, nameAr: canonical.nameAr });
          } else {
            map.set(locId, {
              id: locId,
              nameEn: p.locationEn || p.location || locId,
              nameAr: p.locationAr || p.location || locId,
            });
          }
        }
      }
    });

    let list = Array.from(map.values());

    // Apply manual or visible locations whitelist if configured in CMS
    if (visibleLocationsFilter && Array.isArray(visibleLocationsFilter) && visibleLocationsFilter.length > 0) {
      list = list.filter((loc) => visibleLocationsFilter.includes(loc.id));
      if (locationOrder === "manual") {
        list.sort((a, b) => {
          const idxA = visibleLocationsFilter.indexOf(a.id);
          const idxB = visibleLocationsFilter.indexOf(b.id);
          return idxA - idxB;
        });
      }
    } else if (locationOrder === "auto") {
      // Sort by canonical order or highest project count
      list.sort((a, b) => {
        const countA = counts.get(a.id) || 0;
        const countB = counts.get(b.id) || 0;
        return countB - countA;
      });
    }

    return { availableLocations: list, locationCounts: counts };
  }, [copy.projects, visibleLocationsFilter, locationOrder]);

  // Filtering: Selected location or all
  const filteredProjects = useMemo(() => {
    if (!tagsEnabled || selectedLocation === "ALL") {
      return copy.projects ?? [];
    }
    return (copy.projects ?? []).filter((p) => {
      const locId = resolveProjectLocationId(p);
      return locId === selectedLocation;
    });
  }, [copy.projects, selectedLocation, tagsEnabled]);

  // Screen-reader announcement on filter selection
  const handleSelectLocation = useCallback(
    (locId: string, locName: string) => {
      setSelectedLocation(locId);
      setActiveIndex(0);
      const isAll = locId === "ALL";
      const count = isAll ? total : (locationCounts.get(locId) || 0);
      const msg = ar
        ? `تم اختيار ${locName}. ${formatProjectCount(count, true)}`
        : `Selected ${locName}. ${formatProjectCount(count, false)}`;
      setAnnouncement(msg);
    },
    [ar, total, locationCounts]
  );

  const handleResetFilters = useCallback(() => {
    setSelectedLocation("ALL");
    setActiveIndex(0);
    setAnnouncement(
      ar
        ? "تمت إعادة ضبط الفلتر وعرض كافة المشاريع"
        : "Filter reset. Showing all projects."
    );
  }, [ar]);

  if (!total) return null;

  // Typography tokens resolved from CMS
  const typo = copy.typography?.home_projects || copy.typography?.global;
  const sectionTitleStyle = typo?.sectionHeading ? getFluidTypographyStyle(typo.sectionHeading, supportedLocale) : undefined;
  const kickerStyle = typo?.meta ? getFluidTypographyStyle(typo.meta, supportedLocale) : undefined;
  const descStyle = typo?.body ? getFluidTypographyStyle(typo.body, supportedLocale) : undefined;
  const tagStyle = typo?.tag ? getFluidTypographyStyle(typo.tag, supportedLocale) : undefined;
  const cardTitleStyle = typo?.cardTitle ? getFluidTypographyStyle(typo.cardTitle, supportedLocale) : undefined;
  const cardPromiseStyle = typo?.body ? getFluidTypographyStyle(typo.body, supportedLocale) : undefined;
  const badgeStyle = typo?.meta ? getFluidTypographyStyle(typo.meta, supportedLocale) : undefined;

  const sectionKicker = label || copy.projectsSection?.heading || copy.common.projects;
  const sectionTitle = copy.projectsSection?.heading || label || copy.common.projects;
  const sectionDesc = copy.projectsSection?.description;
  const exploreLabel = copy.projectsSection?.exploreLabel || copy.common.explore;
  const enquireLabel = copy.projectsSection?.enquireLabel || (ar ? "استفسر الآن" : "Enquire");
  const viewAllLabel = copy.projectsSection?.viewAllLabel || (ar ? "جميع المشاريع" : "View All Projects");

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
              <span style={kickerStyle}>{sectionKicker}</span>
            </div>
            <h2 id="featured-projects-title" className="featured-projects-title" style={sectionTitleStyle}>
              {sectionTitle}
            </h2>
            {sectionDesc && (
              <p className="featured-projects-desc" style={descStyle}>{sectionDesc}</p>
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

        {/* Compact Location Tags Bar */}
        {tagsEnabled && availableLocations.length > 0 && (
          <div className="homepage-location-tags-wrapper">
            <div
              className="homepage-location-tags"
              role="group"
              aria-label={ar ? "تصفية المشاريع حسب الموقع" : "Filter projects by location"}
            >
              {/* "All Projects" Tag - Always First */}
              <button
                type="button"
                role="button"
                aria-pressed={selectedLocation === "ALL"}
                className={`location-tag ${selectedLocation === "ALL" ? "is-active" : ""}`}
                style={tagStyle}
                onClick={() => handleSelectLocation("ALL", allProjectsLabel)}
              >
                <span className="location-tag-label">{allProjectsLabel}</span>
                {showTagCounts && (
                  <span className="location-tag-count" aria-hidden="true">
                    {total}
                  </span>
                )}
              </button>

              {/* Location Tags */}
              {availableLocations.map((loc) => {
                const isSelected = selectedLocation === loc.id;
                const locName = ar ? loc.nameAr : loc.nameEn;
                const count = locationCounts.get(loc.id) || 0;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    role="button"
                    aria-pressed={isSelected}
                    className={`location-tag ${isSelected ? "is-active" : ""}`}
                    style={tagStyle}
                    onClick={() => handleSelectLocation(loc.id, locName)}
                  >
                    <span className="location-tag-label">{locName}</span>
                    {showTagCounts && (
                      <span className="location-tag-count" aria-hidden="true">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
              {ar ? "لا توجد مشاريع في هذا الموقع" : "No Projects in This Location"}
            </h3>
            <p className="empty-desc">
              {ar
                ? "لا توجد مشاريع منشورة حالياً في الموقع المحدد. يمكنك اختيار موقع آخر أو استعراض كافة المشاريع."
                : "No projects are currently published for the selected location. Choose another location or view all projects."}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-featured-secondary"
            >
              <span>{allProjectsLabel}</span>
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
                  <div className="featured-project-location" style={badgeStyle}>
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
                  <span className="featured-project-type" style={badgeStyle}>
                    {projectTypeBadge}
                  </span>
                )}
                {projectStatusBadge && (
                  <span className="featured-project-type featured-project-status" style={badgeStyle}>
                    {projectStatusBadge}
                  </span>
                )}
              </div>

              <h3 className="featured-project-name" style={cardTitleStyle}>{activeProject.name}</h3>

              {activeProject.promise && (
                <p className="featured-project-promise" style={cardPromiseStyle}>{activeProject.promise}</p>
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
