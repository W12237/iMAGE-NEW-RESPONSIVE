"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { ProjectsPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { ProjectShowcaseCard } from "./project-showcase-card";
import { useEnquiryModal } from "./enquiry-provider";
import { SmoothScroll } from "./smooth-scroll";
import { PageBlocks, pageBlocksFor } from "./page-blocks";
import { usePageTransition } from "./page-transition";

function formatProjectCount(count: number, ar: boolean): string {
  if (ar) {
    if (count === 0) return "لا توجد مشاريع";
    if (count === 1) return "مشروع واحد متاح";
    if (count === 2) return "مشروعان متاحان";
    if (count >= 3 && count <= 10) return `${count} مشاريع متاحة`;
    return `${count} مشروعاً متاحاً`;
  }
  return count === 1 ? "1 Project Available" : `${count} Projects Available`;
}

function ProjectsArchitecturalHero({
  copy,
  locationsCount = 3,
  projectsCount = 3,
  onScrollToCollection,
  onOpenEnquiry,
}: {
  copy: ProjectsPageContent;
  locationsCount?: number;
  projectsCount?: number;
  onScrollToCollection: () => void;
  onOpenEnquiry: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const reduce = useReducedMotion();
  const hero = copy.projectsHero;
  const { isInitialCinematic, introPhase } = usePageTransition();

  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Parallax scroll matching homepage hero
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1.0, reduce ? 1.0 : 1.06]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.82], [1, 0.15]);

  const animateEntrance = isInitialCinematic && !reduce;
  const [revealed, setRevealed] = useState(() => !isInitialCinematic || Boolean(reduce));

  useEffect(() => {
    if (introPhase === "expanding" || introPhase === "done" || !isInitialCinematic || reduce) {
      setRevealed(true);
    }
  }, [introPhase, isInitialCinematic, reduce]);

  // Safety fallback: ensure hero content is never left hidden if a lifecycle callback stalls
  useEffect(() => {
    const safety = setTimeout(() => {
      setRevealed(true);
    }, 600);
    return () => clearTimeout(safety);
  }, []);

  if (!hero || hero.enabled === false) return null;

  // Use curated editorial portfolio hero imagery if not explicitly set in CMS (avoiding blindly taking first project)
  const defaultEditorialImage =
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88";
  const imageSrc =
    (mobile && hero.mobileImageUrl) ||
    hero.imageUrl ||
    defaultEditorialImage;

  const focalPoint = hero.focalPoint || "center";
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <header
      ref={ref}
      id="top"
      className="projects-architectural-hero mm-hero"
      role="banner"
      aria-label={hero.title || (ar ? "مشاريعنا" : "Our Projects")}
    >
      {/* Background Architectural Imagery with Parallax Scroll */}
      <motion.div
        className="mm-hero-media projects-hero-bg-wrap"
        style={{ scale: scrollScale }}
      >
        <motion.div
          className="projects-hero-bg-motion"
          initial={animateEntrance ? { scale: 1.05 } : false}
          animate={{ scale: 1.0 }}
          transition={{ duration: animateEntrance ? 1.6 : 0, delay: animateEntrance ? 0.1 : 0, ease }}
        >
          <Image
            src={imageSrc}
            alt={hero.imageAlt || (ar ? "مشاريع إيمدج للتطوير العقاري" : "Image Developments Projects")}
            fill
            priority
            sizes="100vw"
            quality={92}
            className="projects-hero-bg-img"
            style={{ objectPosition: focalPoint }}
          />
        </motion.div>
      </motion.div>

      {/* Directional Architectural Wash */}
      <div className="mm-hero-wash projects-hero-directional-overlay" aria-hidden="true" />

      {/* Main Hero Copy Container Aligned with Page Grid */}
      <motion.div
        className="projects-hero-container stage-pad"
        style={{ y: copyY, opacity }}
      >
        <div className="projects-hero-inner">
          {/* Harmonized Single-Line Pretitle: Breadcrumb & Brand Folio */}
          <motion.div
            className="projects-hero-pretitle"
            initial={animateEntrance ? { opacity: 0, y: 8 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: animateEntrance ? 0.5 : 0, delay: animateEntrance ? 0.18 : 0, ease }}
          >
            <nav className="projects-hero-breadcrumb" aria-label={ar ? "مسار التنقل" : "Breadcrumb"}>
              <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
              <span aria-hidden="true" className="breadcrumb-sep">/</span>
              <span aria-current="page">{ar ? "المشاريع" : "Projects"}</span>
            </nav>
            {hero.eyebrow && (
              <>
                <span className="pretitle-sep" aria-hidden="true">•</span>
                <span className="projects-hero-brand-label">{hero.eyebrow}</span>
              </>
            )}
          </motion.div>

          {/* Main H1 - Grand & Uncluttered Headline */}
          <motion.h1
            className="projects-hero-h1"
            initial={animateEntrance ? { opacity: 0, y: 14 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: animateEntrance ? 0.65 : 0, delay: animateEntrance ? 0.28 : 0, ease }}
          >
            {hero.title || (ar ? "مشاريعنا" : "Our Projects")}
          </motion.h1>

          {/* Concise Supporting Description */}
          {hero.description && (
            <motion.p
              className="projects-hero-description"
              initial={animateEntrance ? { opacity: 0, y: 12 } : false}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: animateEntrance ? 0.6 : 0, delay: animateEntrance ? 0.38 : 0, ease }}
            >
              {hero.description}
            </motion.p>
          )}

          {/* Clean, Obvious, User-Friendly CTAs */}
          <motion.div
            className="projects-hero-ctas"
            initial={animateEntrance ? { opacity: 0, y: 10 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: animateEntrance ? 0.55 : 0, delay: animateEntrance ? 0.48 : 0, ease }}
          >
            <button
              type="button"
              onClick={onScrollToCollection}
              className="btn-hero-primary"
              aria-controls="projects-collection"
              aria-label={ar ? "استكشف المشاريع" : "Explore Projects"}
            >
              <span>{hero.primaryCta || (ar ? "استكشف المشاريع" : "Explore Projects")}</span>
              <span className="cta-arrow" aria-hidden="true">↓</span>
            </button>

            <button
              type="button"
              onClick={onOpenEnquiry}
              className="btn-hero-secondary"
              data-enquiry-trigger
              data-enquiry-type="general"
              data-source-cta="projects-hero-secondary"
              aria-label={ar ? "سجّل اهتمامك بمشاريعنا" : "Register interest in our projects"}
            >
              <span>{hero.secondaryCta || (ar ? "سجّل اهتمامك" : "Register Interest")}</span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Signature Centered Double-Chevron Scroll Indicator (Matching Homepage Hero) */}
      <motion.button
        type="button"
        onClick={onScrollToCollection}
        className="double-chevron projects-hero-scroll-link"
        aria-label={ar ? "انتقل إلى المشاريع" : "Scroll to projects"}
        initial={animateEntrance ? { opacity: 0 } : false}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: animateEntrance ? 0.55 : 0, delay: animateEntrance ? 0.85 : 0, ease }}
      >
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </motion.button>
    </header>
  );
}

export function ProjectsPageExperience({ copy }: { copy: ProjectsPageContent }) {
  const { openEnquiry } = useEnquiryModal();
  const ar = copy.locale === "ar";
  const reduce = useReducedMotion();

  // Unique locations from data
  const locations = useMemo(() => {
    const set = new Set<string>();
    copy.allProjects.forEach((p) => {
      if (p.location) set.add(p.location.trim());
    });
    return Array.from(set);
  }, [copy.allProjects]);

  // Filter state
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Read initial query params from window on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const loc = params.get("location");
      const typ = params.get("type");
      const stat = params.get("status");
      const timer = setTimeout(() => {
        if (loc) setSelectedLocation(loc);
        if (typ) setSelectedType(typ.toUpperCase());
        if (stat) setSelectedStatus(stat.toUpperCase());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update URL params
  const updateUrlParams = (loc: string, typ: string, stat: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (loc && loc !== "ALL") params.set("location", loc);
    if (typ && typ !== "ALL") params.set("type", typ.toLowerCase());
    if (stat && stat !== "ALL") params.set("status", stat.toLowerCase());
    const query = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${query}`);
  };

  const handleResetFilters = () => {
    setSelectedLocation("ALL");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    updateUrlParams("ALL", "ALL", "ALL");
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return copy.allProjects.filter((project) => {
      if (selectedLocation !== "ALL" && project.location !== selectedLocation) {
        return false;
      }
      if (selectedType !== "ALL" && (project.projectType || "RESIDENTIAL").toUpperCase() !== selectedType) {
        return false;
      }
      if (selectedStatus !== "ALL" && (project.progressStatus || "ONGOING").toUpperCase() !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [copy.allProjects, selectedLocation, selectedType, selectedStatus]);

  const hasActiveFilters =
    selectedLocation !== "ALL" || selectedType !== "ALL" || selectedStatus !== "ALL";

  const handleOpenProjectEnquiry = (projectId: string, projectName: string) => {
    openEnquiry({
      projectId,
      projectName,
      enquiryType: "project",
      sourcePage: `/${copy.locale}/projects`,
      sourceCta: "project-card",
    });
  };

  const handleOpenGeneralEnquiry = () => {
    openEnquiry({
      enquiryType: "general",
      sourcePage: `/${copy.locale}/projects`,
      sourceCta: "projects-hero-secondary",
    });
  };

  const handleScrollToCollection = () => {
    const el = document.getElementById("projects-collection");
    if (!el) return;
    const headerOffset = 88;
    const lenis = (window as unknown as { lenis?: { scrollTo: (target: HTMLElement | string | number, options?: Record<string, unknown>) => void } }).lenis;
    if (lenis) {
      lenis.scrollTo(el, { offset: -headerOffset });
    } else {
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="projects" />

      <main className="projects-page" dir={ar ? "rtl" : "ltr"}>
        {/* SECTION 1: Dark Mode Architectural Hero (100svh Monograph) */}
        <ProjectsArchitecturalHero
          copy={copy}
          locationsCount={locations.length}
          projectsCount={copy.allProjects.length}
          onScrollToCollection={handleScrollToCollection}
          onOpenEnquiry={handleOpenGeneralEnquiry}
        />

        {/* SECTION 2: THEME SWAP -> Warm Light Canvas (Portfolio Collection & Filters) */}
        {copy.visibility?.projects !== false && (
          <>
            <section
              id="projects-collection"
              className="projects-filter-section stage-pad"
              aria-label={copy.projectsSection?.heading || (ar ? "المشاريع" : "Projects")}
            >
              <div className="projects-collection-header">
                <div className="projects-header-text">
                  <div className="projects-header-eyebrow-row">
                    <span className="projects-section-eyebrow">
                      {ar ? "تصفح المحفظة" : "Explore Portfolio"}
                    </span>
                    <span className="projects-count-badge" aria-live="polite">
                      <span className="count-dot" aria-hidden="true" />
                      {formatProjectCount(filteredProjects.length, ar)}
                    </span>
                  </div>
                  <h2 className="projects-section-heading">
                    {copy.projectsSection?.heading && copy.projectsSection.heading !== (ar ? "المشاريع" : "Projects")
                      ? copy.projectsSection.heading
                      : (ar ? "استكشف مشاريعنا" : "Explore Our Projects")}
                  </h2>
                  {copy.projectsSection?.description && (
                    <p className="projects-section-intro">
                      {copy.projectsSection.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Ultra-Refined Architectural Filter Console */}
              <div
                className="projects-filter-toolbar"
                role="search"
                aria-label={ar ? "تصفية المشاريع" : "Filter projects"}
              >
                {/* 1. Location Segment */}
                <div className={`filter-segment ${selectedLocation !== "ALL" ? "is-active" : ""}`}>
                  <div className="filter-segment-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="filter-segment-content">
                    <span className="filter-segment-label">{ar ? "الموقع" : "Location"}</span>
                    <span className="filter-segment-value">
                      {selectedLocation === "ALL" ? (ar ? "كافة المواقع" : "All Locations") : selectedLocation}
                    </span>
                  </div>
                  <div className="filter-segment-chevron-wrap" aria-hidden="true">
                    <svg className="filter-segment-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <select
                    id="filter-location"
                    value={selectedLocation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedLocation(val);
                      updateUrlParams(val, selectedType, selectedStatus);
                    }}
                    aria-label={ar ? "تصفية حسب الموقع" : "Filter by location"}
                    className="filter-native-select"
                  >
                    <option value="ALL">{ar ? "كافة المواقع" : "All Locations"}</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Project Type Segment */}
                <div className={`filter-segment ${selectedType !== "ALL" ? "is-active" : ""}`}>
                  <div className="filter-segment-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <div className="filter-segment-content">
                    <span className="filter-segment-label">{ar ? "نوع المشروع" : "Project Type"}</span>
                    <span className="filter-segment-value">
                      {selectedType === "ALL"
                        ? (ar ? "كافة الأنواع" : "All Types")
                        : selectedType === "RESIDENTIAL"
                          ? (ar ? "سكني" : "Residential")
                          : selectedType === "COMMERCIAL"
                            ? (ar ? "تجاري" : "Commercial")
                            : (ar ? "طبي" : "Medical")}
                    </span>
                  </div>
                  <div className="filter-segment-chevron-wrap" aria-hidden="true">
                    <svg className="filter-segment-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <select
                    id="filter-type"
                    value={selectedType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedType(val);
                      updateUrlParams(selectedLocation, val, selectedStatus);
                    }}
                    aria-label={ar ? "تصفية حسب نوع المشروع" : "Filter by project type"}
                    className="filter-native-select"
                  >
                    <option value="ALL">{ar ? "كافة الأنواع" : "All Types"}</option>
                    <option value="RESIDENTIAL">{ar ? "سكني" : "Residential"}</option>
                    <option value="COMMERCIAL">{ar ? "تجاري" : "Commercial"}</option>
                    <option value="MEDICAL">{ar ? "طبي" : "Medical"}</option>
                  </select>
                </div>

                {/* 3. Project Status Segment */}
                <div className={`filter-segment ${selectedStatus !== "ALL" ? "is-active" : ""}`}>
                  <div className="filter-segment-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="filter-segment-content">
                    <span className="filter-segment-label">{ar ? "حالة المشروع" : "Project Status"}</span>
                    <span className="filter-segment-value">
                      {selectedStatus === "ALL"
                        ? (ar ? "كافة الحالات" : "All Statuses")
                        : selectedStatus === "ONGOING"
                          ? (ar ? "قيد التنفيذ" : "Ongoing")
                          : selectedStatus === "DELIVERED"
                            ? (ar ? "تم التسليم" : "Delivered")
                            : (ar ? "قريباً" : "Upcoming")}
                    </span>
                  </div>
                  <div className="filter-segment-chevron-wrap" aria-hidden="true">
                    <svg className="filter-segment-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <select
                    id="filter-status"
                    value={selectedStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedStatus(val);
                      updateUrlParams(selectedLocation, selectedType, val);
                    }}
                    aria-label={ar ? "تصفية حسب حالة المشروع" : "Filter by project status"}
                    className="filter-native-select"
                  >
                    <option value="ALL">{ar ? "كافة الحالات" : "All Statuses"}</option>
                    <option value="ONGOING">{ar ? "قيد التنفيذ" : "Ongoing"}</option>
                    <option value="DELIVERED">{ar ? "تم التسليم" : "Delivered"}</option>
                    <option value="UPCOMING">{ar ? "قريباً" : "Upcoming"}</option>
                  </select>
                </div>

                {/* 4. Reset Action */}
                {hasActiveFilters && (
                  <div className="filter-actions">
                    <button
                      type="button"
                      className="btn-filter-reset"
                      onClick={handleResetFilters}
                      aria-label={ar ? "إعادة ضبط الفلاتر" : "Clear filters"}
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
                      <span>{ar ? "إعادة الضبط" : "Clear Filters"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="projects-active-filter-chips" aria-label={ar ? "الفلاتر النشطة" : "Active filters"}>
                  <span className="chips-label">{ar ? "الفلاتر المختارة:" : "Active Filters:"}</span>
                  {selectedLocation !== "ALL" && (
                    <button
                      type="button"
                      className="filter-chip"
                      onClick={() => {
                        setSelectedLocation("ALL");
                        updateUrlParams("ALL", selectedType, selectedStatus);
                      }}
                      aria-label={`${ar ? "إزالة تصفية" : "Remove filter"}: ${selectedLocation}`}
                    >
                      <span>{selectedLocation}</span>
                      <span className="chip-remove" aria-hidden="true">×</span>
                    </button>
                  )}
                  {selectedType !== "ALL" && (
                    <button
                      type="button"
                      className="filter-chip"
                      onClick={() => {
                        setSelectedType("ALL");
                        updateUrlParams(selectedLocation, "ALL", selectedStatus);
                      }}
                      aria-label={`${ar ? "إزالة تصفية النوع" : "Remove type filter"}`}
                    >
                      <span>
                        {selectedType === "RESIDENTIAL" ? (ar ? "سكني" : "Residential") : selectedType === "COMMERCIAL" ? (ar ? "تجاري" : "Commercial") : (ar ? "طبي" : "Medical")}
                      </span>
                      <span className="chip-remove" aria-hidden="true">×</span>
                    </button>
                  )}
                  {selectedStatus !== "ALL" && (
                    <button
                      type="button"
                      className="filter-chip"
                      onClick={() => {
                        setSelectedStatus("ALL");
                        updateUrlParams(selectedLocation, selectedType, "ALL");
                      }}
                      aria-label={`${ar ? "إزالة تصفية الحالة" : "Remove status filter"}`}
                    >
                      <span>
                        {selectedStatus === "ONGOING" ? (ar ? "قيد التنفيذ" : "Ongoing") : selectedStatus === "DELIVERED" ? (ar ? "تم التسليم" : "Delivered") : (ar ? "قريباً" : "Upcoming")}
                      </span>
                      <span className="chip-remove" aria-hidden="true">×</span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* SECTION 3: Alternating 45% Text / 55% Photo Project Rows */}
            <section
              className="projects-collection-list stage-pad"
              aria-label={ar ? "مجموعة المشاريع" : "Projects collection"}
            >
              {filteredProjects.length > 0 ? (
                <div className="projects-cards-container">
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      layout="position"
                      initial={!reduce ? { opacity: 0, y: 16 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ProjectShowcaseCard
                        project={project}
                        index={index}
                        locale={copy.locale}
                        defaultCtaLabel={copy.projectsSection?.exploreLabel}
                        onEnquire={handleOpenProjectEnquiry}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="projects-empty-state">
                  <h2>{ar ? "لا توجد نتائج تطابق خيارات البحث" : "No Projects Match Your Filter"}</h2>
                  <p>
                    {ar
                      ? "جرب تعديل خيارات التصفية أو مسح الفلاتر لعرض جميع مشاريعنا المتاحة."
                      : "Try adjusting your filter criteria or clear filters to explore all published destinations."}
                  </p>
                  <button
                    type="button"
                    className="btn-project-primary"
                    onClick={handleResetFilters}
                  >
                    <span>{ar ? "عرض جميع المشاريع" : "View All Projects"}</span>
                    <b aria-hidden="true">{ar ? "←" : "→"}</b>
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* SECTION 4: THEME SWAP -> Deep Forest Green Architectural Closing CTA (Opens Shared Modal) */}
        <section
          className="projects-closing-cta stage-pad"
          aria-label={ar ? "طلب استشارة عقارية" : "Real estate advisory"}
        >
          <div className="projects-closing-panel">
            <div className="projects-closing-glow" aria-hidden="true" />
            <div className="projects-closing-content">
              <span className="projects-closing-eyebrow">
                {ar ? "استشارة عقارية مخصصة" : "Tailored Real Estate Advisory"}
              </span>
              <h2 className="projects-closing-heading">
                {ar ? "اعثر على الوجهة المناسبة لك" : "Find the Right Project for You"}
              </h2>
              <p className="projects-closing-desc">
                {ar
                  ? "فريق مستشارينا في إيمدج للتطوير العقاري مستعد لمساعدتك في استكشاف الوجهات السكنية والمساحات التجارية والفرص الاستثمارية التي تلبي تطلعاتك."
                  : "Our property advisors are ready to guide you across our residential and commercial destinations to find the ideal match for your living and investment aspirations."}
              </p>
              <div className="projects-closing-action">
                <button
                  type="button"
                  onClick={handleOpenGeneralEnquiry}
                  className="btn-closing-enquiry"
                  data-enquiry-trigger
                  data-enquiry-type="general"
                  data-source-cta="projects-closing-cta"
                  aria-label={ar ? "سجّل اهتمامك بمشاريعنا" : "Register your interest"}
                >
                  <span>{ar ? "سجّل اهتمامك الآن" : "Register Your Interest"}</span>
                  <b aria-hidden="true">{ar ? "←" : "→"}</b>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CMS Custom Content Blocks (if defined in admin, with inline contact form excluded) */}
        {(() => {
          const projectBlocks = pageBlocksFor(copy, "projects");
          const legacyBlocks = pageBlocksFor(copy, "developments");
          const activeBlocks = projectBlocks && projectBlocks.length > 0 ? projectBlocks : legacyBlocks;
          const customOnly = activeBlocks?.filter((b) => b.kind !== "CONTACT_FORM");
          if (!customOnly || customOnly.length === 0) return null;
          return <PageBlocks blocks={customOnly} builtins={{}} />;
        })()}
      </main>

      {/* SECTION 5: THEME SWAP -> Warm Light Footer */}
      <Footer copy={copy} page="projects" />
    </>
  );
}
