"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import type { HomeContent } from "@/content/home";
import { useEnquiryModal } from "./enquiry-provider";

export function ProjectShowcase({
  copy,
  label,
}: {
  copy: HomeContent;
  label?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const reduce = useReducedMotion();
  const { openEnquiry } = useEnquiryModal();

  const total = copy.projects?.length ?? 0;
  const ar = copy.locale === "ar";

  type FilterItem =
    | { id: "ALL"; isAll: true; label: string; count: number }
    | { id: string; isAll: false; index: number; location: string; name: string };

  // Unified filter items: All Projects + (Location · Project Name)
  const filterItems = useMemo<FilterItem[]>(() => {
    return [
      { id: "ALL", isAll: true, label: ar ? "كافة المشاريع" : "All Projects", count: total },
      ...(copy.projects ?? []).map((p, idx) => ({
        id: p.id || p.name,
        isAll: false as const,
        index: idx,
        location: p.location,
        name: p.name,
      })),
    ];
  }, [copy.projects, ar, total]);

  if (!total) return null;

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
  const safeIndex = activeIndex >= total ? 0 : activeIndex;
  const activeProject = copy.projects[safeIndex] || copy.projects[0];

  const matchingInquiry = copy.inquiryProjects?.find(
    (ip) => ip.name.toLowerCase() === activeProject.name.toLowerCase()
  );
  const resolvedProjectId =
    matchingInquiry?.id ||
    activeProject.id ||
    activeProject.name.toLowerCase().replace(/\s+/g, "-");

  const primaryActionHref =
    activeProject.ctaUrl && !activeProject.ctaUrl.startsWith("#")
      ? activeProject.ctaUrl
      : `/${copy.locale}/projects/${activeProject.slug || activeProject.id || resolvedProjectId}`;

  const primaryActionLabel = activeProject.ctaLabel || exploreLabel;

  const handleEnquire = (p: typeof activeProject) => {
    openEnquiry({
      projectId: resolvedProjectId,
      projectName: p.name,
      enquiryType: "project",
      sourceCta: "home-featured-projects",
    });
  };

  const handleKeyDownPill = (e: React.KeyboardEvent, index: number) => {
    const len = filterItems.length;
    let target = -1;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      target = ar ? (index - 1 + len) % len : (index + 1) % len;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      target = ar ? (index + 1) % len : (index - 1 + len) % len;
    } else if (e.key === "Home") {
      e.preventDefault();
      target = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      target = len - 1;
    }

    if (target !== -1) {
      const item = filterItems[target];
      if (item.isAll) {
        setActiveFilter("ALL");
      } else {
        setActiveFilter(item.id);
        setActiveIndex(item.index);
      }
      document.getElementById(`featured-filter-${item.id}`)?.focus();
    }
  };

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

        {/* Single Unified Filter Bar */}
        <div
          className="featured-filter-bar"
          role="tablist"
          aria-label={ar ? "تصفية المشاريع واستعراضها" : "Filter and browse portfolio"}
        >
          {filterItems.map((item, itemIdx) => {
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                id={`featured-filter-${item.id}`}
                tabIndex={isSelected ? 0 : -1}
                className={`featured-filter-pill ${isSelected ? "is-active" : ""}`}
                onClick={() => {
                  if (item.isAll) {
                    setActiveFilter("ALL");
                  } else {
                    setActiveFilter(item.id);
                    setActiveIndex(item.index);
                  }
                }}
                onKeyDown={(e) => handleKeyDownPill(e, itemIdx)}
              >
                {isSelected && (
                  <motion.span
                    layoutId="activeFeaturedFilterPill"
                    className="featured-filter-pill-bg"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <span className="pill-content">
                  {item.isAll ? (
                    <>
                      <span className="pill-primary">{item.label}</span>
                      <span className="pill-count">{item.count}</span>
                    </>
                  ) : (
                    <>
                      {item.location && <span className="pill-location">{item.location}</span>}
                      {item.location && <span className="pill-dot" aria-hidden="true">·</span>}
                      <span className="pill-name">{item.name}</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Project Showcase */}
        <div
          id={`project-panel-${safeIndex}`}
          role="tabpanel"
          aria-labelledby={`project-tab-${safeIndex}`}
          className={`featured-project-showcase ${imagePos === "end" ? "is-image-end" : "is-image-start"}`}
        >
          {/* Architectural Image */}
          <div className="featured-project-media">
            <motion.div
              key={`image-${activeProject.name}-${safeIndex}`}
              initial={{ opacity: reduce ? 1 : 0.88, scale: reduce ? 1 : 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="featured-project-frame"
            >
              <Image
                src={activeProject.image}
                alt={activeProject.alt || `${activeProject.name}, ${activeProject.location}`}
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
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="featured-project-info"
          >
            <div className="featured-project-meta">
              {activeProject.location && (
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
                  <span>{activeProject.location}</span>
                </div>
              )}
              {activeProject.projectType && (
                <span className="featured-project-type">
                  {activeProject.projectType}
                </span>
              )}
            </div>

            <h3 className="featured-project-name">
              {activeProject.name}
            </h3>

            {activeProject.promise && (
              <p className="featured-project-promise">
                {activeProject.promise}
              </p>
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
                  aria-label={`${ar ? "تحميل كتيب" : "Download Brochure"} ${activeProject.name}`}
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

            {/* Navigation Stepper / Subtle Indicator Dots */}
            {total > 1 && (
              <div
                className="featured-project-nav"
                aria-label={ar ? "التنقل بين المشاريع" : "Project Navigation"}
              >
                <div className="featured-project-dots" aria-hidden="true">
                  {copy.projects.map((p, idx) => (
                    <button
                      key={p.id || p.name || idx}
                      type="button"
                      className={`featured-project-dot ${safeIndex === idx ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveIndex(idx);
                        setActiveFilter(p.id || p.name);
                      }}
                      aria-label={`${ar ? "المشروع" : "Project"} ${p.name}`}
                    />
                  ))}
                </div>
                <div className="featured-project-nav-arrows">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (safeIndex - 1 + total) % total;
                      setActiveIndex(prevIdx);
                      const targetP = copy.projects[prevIdx];
                      if (targetP) setActiveFilter(targetP.id || targetP.name);
                    }}
                    className="featured-nav-btn"
                    aria-label={ar ? "المشروع السابق" : "Previous project"}
                  >
                    {ar ? "→" : "←"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (safeIndex + 1) % total;
                      setActiveIndex(nextIdx);
                      const targetP = copy.projects[nextIdx];
                      if (targetP) setActiveFilter(targetP.id || targetP.name);
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
      </div>
    </section>
  );
}
