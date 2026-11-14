"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import type { ProjectDetailPageContent, ProjectVisualTourItem } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { useEnquiryModal } from "./enquiry-provider";
import { SmoothScroll } from "./smooth-scroll";
import { ContactForm } from "./contact-form";

export function ProjectDetailExperience({ copy }: { copy: ProjectDetailPageContent }) {
  const { openEnquiry } = useEnquiryModal();
  const ar = copy.locale === "ar";
  const project = copy.project;
  const homeHref = `/${copy.locale}`;
  const projectsHref = `/${copy.locale}/projects`;

  // Master Plan Zoom modal state
  const [masterPlanOpen, setMasterPlanOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Gallery category and lightbox state
  const [galleryFilter, setGalleryFilter] = useState<string>("ALL");
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Touch swipe state for lightbox
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Visual tour state
  const visualTours = project.visualTours || [];
  const hasHtmlTours = visualTours.length > 0;
  const hasAnyTour = hasHtmlTours || Boolean(project.videoTourUrl);

  const [activeTourIndex, setActiveTourIndex] = useState(0);
  const [visualTourModalOpen, setVisualTourModalOpen] = useState(false);
  const [tourIframeLoading, setTourIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tourOverlayRef = useRef<HTMLDivElement>(null);
  const tourTriggerBtnRef = useRef<HTMLButtonElement>(null);

  // Keyboard accessibility for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (visualTourModalOpen) {
          closeVisualTour();
        } else {
          setMasterPlanOpen(false);
          setActiveLightboxIndex(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visualTourModalOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const openVisualTour = () => {
    setTourIframeLoading(true);
    setVisualTourModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeVisualTour = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }
    setVisualTourModalOpen(false);
    document.body.style.overflow = "";
    tourTriggerBtnRef.current?.focus();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      tourOverlayRef.current?.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  };

  const handleOpenProjectEnquiry = (unitName?: string) => {
    openEnquiry({
      projectId: project.id,
      projectName: unitName ? `${project.name} — ${unitName}` : project.name,
      enquiryType: "project",
      sourcePage: `/${copy.locale}/projects/${project.slug}`,
      sourceCta: unitName ? `unit-details-${unitName}` : "project-hero-register",
    });
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // Pause lightbox video when active item changes or closes
  useEffect(() => {
    if (lightboxVideoRef.current) {
      lightboxVideoRef.current.pause();
    }
  }, [activeLightboxIndex]);

  // Gallery items normalization
  const rawGalleryUrls = project.gallery?.length > 0 ? project.gallery : [project.coverImageUrl];
  const itemsList = (project.galleryItems && project.galleryItems.length > 0)
    ? project.galleryItems
    : rawGalleryUrls.map((url, i) => ({
        id: `legacy-${i}`,
        url,
        imageUrl: url,
        category: "RENDERS",
        caption: "",
        alt: `${project.name} gallery image ${i + 1}`,
        isVideo: false,
        sortOrder: i,
      }));

  const gallerySettings = project.gallerySettings || {
    enabled: true,
    title: ar ? "معرض المشروع" : "Project Gallery",
    intro: ar ? "تفاصيل معمارية وصور حصرية لوجهة استثنائية." : "Immersive architectural perspectives and curated project photography.",
    showFilters: true,
    showCaptions: true,
    layout: "grid" as const,
  };

  const presentCategories = Array.from(
    new Set(itemsList.map((item) => (item.category || "RENDERS").toUpperCase()))
  );

  const filteredGallery = itemsList.filter((item) => {
    if (galleryFilter === "ALL") return true;
    return (item.category || "RENDERS").toUpperCase() === galleryFilter;
  });

  const categoryLabels: Record<string, { en: string; ar: string }> = {
    ALL: { en: "All", ar: "الكل" },
    RENDERS: { en: "Renders", ar: "التصميمات المعمارية" },
    CONSTRUCTION: { en: "Construction", ar: "أعمال الموقع" },
    INTERIOR: { en: "Interiors", ar: "التصميم الداخلي" },
    MASTER_PLAN: { en: "Master Plan", ar: "المخطط العام" },
  };

  const activeTour: ProjectVisualTourItem | undefined = visualTours[activeTourIndex];

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="projects" />

      <main className="project-detail-page" dir={ar ? "rtl" : "ltr"}>
        {/* =========================================================
            1. Project Hero (Full Viewport - 100vh Take All The Page)
        ========================================================= */}
        <section className="project-hero" aria-label={project.name}>
          <div className="project-hero-media">
            <Image
              src={project.coverImageUrl}
              alt={project.coverImageAlt || project.name}
              fill
              priority
              sizes="100vw"
              quality={90}
              className="project-hero-bg-img"
            />
            <div className="project-hero-wash" />
          </div>

          <div className="project-hero-content stage-pad">
            {/* Top meta: Breadcrumbs & Badges */}
            <div className="project-hero-meta-row">
              <nav className="project-breadcrumb" aria-label="Breadcrumb">
                <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
                <Link href={projectsHref}>{ar ? "المشاريع" : "Projects"}</Link>
                <span className="breadcrumb-sep" aria-hidden="true">/</span>
                <strong>{project.name}</strong>
              </nav>

              <div className="project-hero-badges">
                {project.location && (
                  <span className="hero-pill hero-pill--location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{project.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Title & Brand Identity */}
            <div className="project-hero-main">
              <div className="project-hero-title-row">
                {project.logoUrl && (
                  <div className="project-hero-logo" aria-hidden="true">
                    <Image src={project.logoUrl} alt={project.name} fill style={{ objectFit: "contain" }} sizes="52px" />
                  </div>
                )}
                <h1 className="project-hero-title">{project.name}</h1>
              </div>

              {project.shortDescription && (
                <p className="project-hero-deck">{project.shortDescription}</p>
              )}
            </div>

            {/* CTAs & Bottom Scroll Indicator */}
            <div className="project-hero-footer">
              <div className="project-hero-ctas">
                <button
                  type="button"
                  className="btn-project-enquire-hero"
                  onClick={() => handleOpenProjectEnquiry()}
                >
                  <span>{ar ? "سجل اهتمامك" : "Register Interest"}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: ar ? "rotate(180deg)" : "none" }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>

                {hasAnyTour && (
                  <button
                    ref={tourTriggerBtnRef}
                    type="button"
                    className="btn-project-tour"
                    onClick={openVisualTour}
                    aria-label={ar ? "جولة افتراضية" : "Visual Tour"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                    </svg>
                    <span>{ar ? "جولة افتراضية" : "Visual Tour"}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-project-primary"
                  onClick={() => handleScrollTo("overview")}
                >
                  <span>{ar ? "اكتشف المشروع" : "Discover Project"}</span>
                  <b aria-hidden="true">↓</b>
                </button>
              </div>

              <button
                type="button"
                className="project-hero-scroll-cue"
                onClick={() => handleScrollTo("overview")}
                aria-label={ar ? "انتقل إلى نظرة عامة على المشروع" : "Scroll to project overview"}
              >
                <div className="scroll-cue-mouse" aria-hidden="true">
                  <span className="scroll-cue-wheel" />
                </div>
                <span className="scroll-cue-text">{ar ? "استكشف التفاصيل" : "Scroll to explore"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================
            Journal Foundation: Two-Column Layout Container
            Desktop: Physical LEFT = Other Projects Sidebar; Physical RIGHT = Project Content
            Mobile: Project Content first; Other Projects second
        ========================================================= */}
        <div className="stage-pad" style={{ marginTop: "clamp(36px, 5vw, 64px)", marginBottom: "clamp(48px, 6vw, 80px)" }}>
          <div className="article-two-column-layout has-sidebar">
            {/* PHYSICAL LEFT: Other Projects Sidebar */}
            <aside
              className="article-projects-sidebar"
              aria-label={ar ? "مشروعات أخرى" : "Other Projects"}
              dir={ar ? "rtl" : "ltr"}
            >
              <div className="article-sidebar-sticky-inner">
                <h3 className="article-sidebar-heading">
                  {ar ? "مشروعات أخرى" : "Other Projects"}
                </h3>

                <div className="article-sidebar-projects-list">
                  {copy.otherProjects && copy.otherProjects.length > 0 ? (
                    copy.otherProjects.slice(0, 4).map((proj) => (
                      <article key={proj.id} className="article-sidebar-project-card">
                        <Link
                          href={`/${copy.locale}/projects/${proj.slug}`}
                          className="sidebar-project-media-link"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <div className="sidebar-project-media-frame">
                            <Image
                              src={proj.image}
                              alt={proj.name}
                              fill
                              sizes="(max-width: 960px) 100vw, 320px"
                              className="sidebar-project-img"
                            />
                            {proj.projectType && (
                              <div className="sidebar-project-badges">
                                <span className="sidebar-badge type">{proj.projectType}</span>
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="sidebar-project-content">
                          <h4 className="sidebar-project-title">
                            <Link href={`/${copy.locale}/projects/${proj.slug}`}>{proj.name}</Link>
                          </h4>
                          {proj.location && (
                            <p className="sidebar-project-location">{proj.location}</p>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                      {ar ? "لا توجد مشروعات أخرى حالياً." : "No other projects available."}
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* PHYSICAL RIGHT: Main Project Details Body */}
            <div className="article-body-column project-details-body" dir={ar ? "rtl" : "ltr"}>
              {/* 2. Overview */}
              <section id="overview" className="project-overview-section" style={{ padding: 0 }}>
                <div className="section-header" style={{ marginBottom: "20px" }}>
                  <span className="section-eyebrow">{ar ? "نظرة عامة على المشروع" : "Project Overview"}</span>
                  <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)" }}>
                    {project.heroTitle || (ar ? `رؤية معمارية متفردة في قلب ${project.location}` : `A Considered Architectural Vision in ${project.location}`)}
                  </h2>
                </div>

                <div className="project-overview-text">
                  <p className="lead-paragraph" style={{ marginBottom: "24px" }}>
                    {project.fullDescription || project.shortDescription}
                  </p>
                </div>

                {project.keyFacts && project.keyFacts.length > 0 && (
                  <div className="project-key-facts" style={{ margin: "24px 0" }}>
                    <h3 className="key-facts-title" style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", margin: "0 0 12px 0", gridColumn: "1 / -1" }}>
                      {ar ? "حقائق رئيسية" : "Key Facts"}
                    </h3>
                    {project.keyFacts.map((fact, i) => (
                      <div key={i} className="fact-item">
                        <strong className="fact-value">
                          {fact.value}
                          {fact.unit ? <span style={{ fontSize: "14px", marginInlineStart: "4px" }}>{fact.unit}</span> : null}
                        </strong>
                        <span className="fact-label">{fact.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 3. Highlights */}
              {project.highlights && project.highlights.length > 0 && (
                <section id="highlights" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                  <div className="section-header" style={{ marginBottom: "20px" }}>
                    <span className="section-eyebrow">{ar ? "أبرز المميزات والمرافق" : "Project Highlights"}</span>
                    <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                      {ar ? "تصميم يعزز جودة الحياة والهدوء" : "Designed for Living with Perspective"}
                    </h2>
                  </div>

                  <div className="highlights-grid">
                    {project.highlights.map((h, i) => (
                      <div key={i} className="highlight-card">
                        <div className="highlight-icon-wrap" aria-hidden="true">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                          </svg>
                        </div>
                        <h3>{h.title}</h3>
                        <p>{h.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Master Plan */}
              {project.masterPlanUrl && (
                <section id="master-plan" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                  <div className="section-header" style={{ marginBottom: "20px" }}>
                    <span className="section-eyebrow">{ar ? "المخطط العام" : "Master Plan"}</span>
                    <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                      {ar ? "تكامل مدروس بين العمارة والمساحات المفتوحة" : "Harmonious Integration of Built Space and Landscape"}
                    </h2>
                  </div>

                  <div className="masterplan-card">
                    <div className="masterplan-preview-wrap">
                      <Image
                        src={project.masterPlanUrl}
                        alt={ar ? `المخطط العام لمشروع ${project.name}` : `${project.name} Master Plan`}
                        fill
                        sizes="(max-width: 900px) 100vw, 750px"
                        quality={92}
                        className="masterplan-img"
                      />
                      <div className="masterplan-overlay-cta">
                        <button
                          type="button"
                          className="btn-masterplan-zoom"
                          onClick={() => {
                            setZoomScale(1);
                            setMasterPlanOpen(true);
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                          </svg>
                          <span>{ar ? "عرض المخطط العام كاملاً" : "View Full Master Plan"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 5. Unit Types */}
              {project.unitTypes && project.unitTypes.length > 0 && (
                <section id="unit-types" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                  <div className="section-header" style={{ marginBottom: "20px" }}>
                    <span className="section-eyebrow">{ar ? "أنواع الوحدات" : "Unit Types"}</span>
                    <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                      {ar ? "مساحات صُممت لتلائم تطلعاتك" : "Curated Residences Built Around Your Lifestyle"}
                    </h2>
                  </div>

                  <div className="unit-types-grid">
                    {project.unitTypes.map((unit) => (
                      <article key={unit.id} className="unit-card">
                        <div className="unit-card-header">
                          <span className="unit-badge">{project.name}</span>
                          <h3 className="unit-title">{unit.name}</h3>
                        </div>

                        <div className="unit-card-specs">
                          <div className="unit-spec">
                            <span className="spec-label">{ar ? "المساحة" : "Area"}</span>
                            <strong className="spec-val">{unit.area}</strong>
                          </div>
                          <div className="unit-spec">
                            <span className="spec-label">{ar ? "التشطيب" : "Finishing"}</span>
                            <strong className="spec-val">{unit.finishing}</strong>
                          </div>
                          <div className="unit-spec">
                            <span className="spec-label">{ar ? "خطة السداد" : "Payment Plan"}</span>
                            <strong className="spec-val">{unit.payment}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-unit-enquire"
                          onClick={() => handleOpenProjectEnquiry(unit.name)}
                          aria-label={`${ar ? "طلب تفاصيل" : "Request details for"} ${unit.name}`}
                        >
                          <span>{ar ? "طلب تفاصيل الوحدة" : "Request Unit Details"}</span>
                          <b aria-hidden="true">{ar ? "←" : "→"}</b>
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Location & Connectivity */}
              <section id="location" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                <div className="section-header" style={{ marginBottom: "20px" }}>
                  <span className="section-eyebrow">{ar ? "الموقع وسهولة الوصول" : "Location & Connectivity"}</span>
                  <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                    {ar ? `موقع استراتيجي في ${project.location}` : `Strategically Positioned in ${project.location}`}
                  </h2>
                </div>

                <div className="location-grid">
                  <div className="location-map-wrap">
                    {project.latitude && project.longitude ? (
                      <iframe
                        title={`${project.name} Map`}
                        src={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=14&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, minHeight: 340, borderRadius: "var(--image-radius)" }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="map-placeholder">
                        <p>{project.location}</p>
                      </div>
                    )}
                  </div>

                  <div className="location-destinations">
                    <h3>{ar ? "الوجهات والطرق الرئيسية القريبة" : "Nearby Landmarks & Routes"}</h3>
                    {project.nearbyLocations && project.nearbyLocations.length > 0 ? (
                      <ul className="destinations-list">
                        {project.nearbyLocations.map((dest, i) => (
                          <li key={i} className="destination-item">
                            <span className="dest-name">{dest.name}</span>
                            <strong className="dest-distance">{dest.distance}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">{ar ? "يقع المشروع بالقرب من المحاور الحيوية." : "Close to major arterial roads and transit routes."}</p>
                    )}

                    {project.mapUrl && (
                      <a
                        href={project.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-directions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        <span>{ar ? "الاتجاهات على الخريطة" : "Get Directions"}</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>

              {/* 8. Construction Updates */}
              {project.constructionUpdates && project.constructionUpdates.length > 0 && (
                <section id="construction-updates" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                  <div className="section-header" style={{ marginBottom: "20px" }}>
                    <span className="section-eyebrow">{ar ? "تحديثات الإنشاء" : "Construction Updates"}</span>
                    <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                      {ar ? "نتابع معاً مراحل تشكيل المكان" : "Tracking Progress on the Ground"}
                    </h2>
                  </div>

                  <div className="updates-grid">
                    {project.constructionUpdates.map((update, i) => (
                      <article key={i} className="update-card">
                        {update.imageUrl && (
                          <div className="update-media">
                            <Image
                              src={update.imageUrl}
                              alt={update.title}
                              fill
                              sizes="(max-width: 900px) 100vw, 400px"
                              quality={85}
                            />
                          </div>
                        )}
                        <div className="update-info">
                          <span className="update-date">{update.date}</span>
                          <h3 className="update-title">{update.title}</h3>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* 9. Download Brochure */}
              {project.brochureUrl && (
                <section id="brochure" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                  <div className="brochure-card">
                    <div className="brochure-info">
                      <span className="section-eyebrow">{ar ? "كتيب المشروع الرسمي" : "Official Project Brochure"}</span>
                      <h2>{ar ? `حمّل كتيب مشروع ${project.name}` : `Download ${project.name} Brochure`}</h2>
                      <p>
                        {ar
                          ? "احصل على التفاصيل المعمارية الكاملة والمواصفات الفنية المعتمدة في ملف PDF شامل."
                          : "Access comprehensive architectural plans, spatial diagrams, and specifications in an official PDF."}
                      </p>
                      <a
                        href={project.brochureUrl}
                        download
                        className="btn-brochure-download"
                        aria-label={ar ? "تحميل الكتيب" : "Download Brochure"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{ar ? "تحميل الكتيب (PDF)" : "Download Brochure (PDF)"}</span>
                      </a>
                    </div>
                    <div className="brochure-visual">
                      <Image
                        src={project.coverImageUrl}
                        alt={project.name}
                        fill
                        sizes="320px"
                        quality={88}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* 10. Register Interest (Reuse Approved Compact Form) */}
              <section id="register-interest" style={{ marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--line)" }}>
                <div className="project-enquiry-box">
                  <span className="section-eyebrow">{ar ? "سجل اهتمامك" : "Register Your Interest"}</span>
                  <h2>{ar ? `ابدأ خطوتك القادمة في ${project.name}` : `Take Your Next Step at ${project.name}`}</h2>
                  <p>
                    {ar
                      ? "تحدث مباشرة مع مستشارينا لمعرفة أحدث الوحدات المتاحة وخطط السداد المصممة لتطلعاتك."
                      : "Connect directly with our property specialists for real-time unit availability and personalized consultations."}
                  </p>

                  <div style={{ marginTop: "24px" }}>
                    <ContactForm
                      copy={copy}
                      variant="contact"
                      projectId={project.id}
                      sourcePage={`/${copy.locale}/projects/${project.slug}`}
                      sourceCta="project_detail_bottom_register"
                    />
                  </div>

                  <div className="enquiry-hotline-wrap" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                    <span className="hotline-or">{ar ? "أو اتصل مباشرة عبر الخط الساخن" : "Or reach our advisory team directly on"}</span>
                    <a href="tel:17087" className="enquiry-hotline-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span>17087</span>
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* =========================================================
            7. Project Gallery (CMS Managed Grid & Carousel)
        ========================================================= */}
        {gallerySettings.enabled && filteredGallery.length > 0 && (
          <section id="gallery" className="project-gallery-section stage-pad" style={{ marginBottom: "64px" }}>
            <div className="gallery-header-row">
              <div className="section-header">
                <span className="section-eyebrow">{ar ? "معرض المشروع" : "Project Gallery"}</span>
                <h2>{gallerySettings.title || (ar ? "تفاصيل تلهم التجربة" : "Immersive Visual Experience")}</h2>
                {gallerySettings.intro && (
                  <p className="section-intro" style={{ marginTop: "6px", maxWidth: "680px", color: "var(--muted)", fontSize: "14px" }}>
                    {gallerySettings.intro}
                  </p>
                )}
              </div>

              {gallerySettings.showFilters && presentCategories.length > 1 && (
                <div className="gallery-filter-tabs" role="tablist" aria-label={ar ? "تصنيفات المعرض" : "Gallery Categories"}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={galleryFilter === "ALL"}
                    className={`gallery-tab ${galleryFilter === "ALL" ? "is-active" : ""}`}
                    onClick={() => setGalleryFilter("ALL")}
                  >
                    {ar ? "الكل" : "All"}
                  </button>
                  {presentCategories.map((cat) => {
                    const label = categoryLabels[cat]
                      ? ar
                        ? categoryLabels[cat].ar
                        : categoryLabels[cat].en
                      : cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={galleryFilter === cat}
                        className={`gallery-tab ${galleryFilter === cat ? "is-active" : ""}`}
                        onClick={() => setGalleryFilter(cat)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Layout Preset: Carousel vs Grid */}
            {gallerySettings.layout === "carousel" ? (
              <div className="gallery-carousel-wrapper" style={{ position: "relative" }}>
                <div
                  ref={carouselTrackRef}
                  className="gallery-carousel-track"
                  style={{
                    display: "flex",
                    gap: "18px",
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: "16px",
                  }}
                >
                  {filteredGallery.map((item, i) => (
                    <div
                      key={item.id || i}
                      className="gallery-thumb gallery-carousel-slide"
                      style={{
                        flex: "0 0 min(85vw, 420px)",
                        scrollSnapAlign: "start",
                      }}
                      onClick={() => setActiveLightboxIndex(i)}
                      tabIndex={0}
                      role="button"
                      aria-label={ar ? `عرض العنصر ${i + 1} بالحجم الكامل` : `View item ${i + 1} full-screen`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setActiveLightboxIndex(i);
                      }}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.alt || `${project.name} gallery item ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 85vw, 420px"
                        className="gallery-img"
                        quality={85}
                        style={{ objectPosition: (item as any).focalPoint || "center" }}
                      />
                      {item.isVideo && (
                        <div className="gallery-video-indicator" aria-label="Video item">
                          <span>▶</span>
                        </div>
                      )}
                      {gallerySettings.showCaptions && item.caption && (
                        <div className="gallery-thumb-caption">
                          <span>{item.caption}</span>
                        </div>
                      )}
                      <div className="gallery-thumb-hover">
                        <span>+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="gallery-grid">
                {filteredGallery.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="gallery-thumb"
                    onClick={() => setActiveLightboxIndex(i)}
                    tabIndex={0}
                    role="button"
                    aria-label={ar ? `عرض العنصر ${i + 1} بالحجم الكامل` : `View item ${i + 1} full-screen`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setActiveLightboxIndex(i);
                    }}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.alt || `${project.name} gallery image ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="gallery-img"
                      quality={85}
                      style={{ objectPosition: (item as any).focalPoint || "center" }}
                    />
                    {item.isVideo && (
                      <div className="gallery-video-indicator" aria-label="Video item">
                        <span>▶</span>
                      </div>
                    )}
                    {gallerySettings.showCaptions && item.caption && (
                      <div className="gallery-thumb-caption">
                        <span>{item.caption}</span>
                      </div>
                    )}
                    <div className="gallery-thumb-hover">
                      <span>+</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* =========================================================
          Master Plan Modal with Zoom Controls
      ========================================================= */}
      {masterPlanOpen && project.masterPlanUrl && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMasterPlanOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "المخطط العام التفاعلي" : "Interactive Master Plan"}
        >
          <div className="modal-masterplan-box">
            <div className="modal-toolbar">
              <h3>{ar ? `المخطط العام — ${project.name}` : `Master Plan — ${project.name}`}</h3>
              <div className="zoom-controls">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(prev + 0.25, 2.5))}
                  aria-label={ar ? "تكبير" : "Zoom in"}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(prev - 0.25, 0.75))}
                  aria-label={ar ? "تصغير" : "Zoom out"}
                >
                  –
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  aria-label={ar ? "إعادة الضبط" : "Reset zoom"}
                >
                  1:1
                </button>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setMasterPlanOpen(false)}
                  aria-label={ar ? "إغلاق" : "Close"}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="masterplan-zoom-viewport">
              <div
                className="masterplan-zoom-content"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-out",
                }}
              >
                <Image
                  src={project.masterPlanUrl}
                  alt={project.name}
                  width={1400}
                  height={900}
                  quality={95}
                  priority
                  style={{ width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          Gallery Lightbox
      ========================================================= */}
      {activeLightboxIndex !== null && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLightboxIndex(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "معرض الصور بالحجم الكامل" : "Full Screen Gallery"}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
            if (Math.abs(dx) > 50 && dy < 60) {
              // Horizontal swipe — navigate gallery
              setActiveLightboxIndex((prev) => {
                if (prev === null) return prev;
                // Swipe left → next (LTR) or prev (RTL)
                if ((!ar && dx < 0) || (ar && dx > 0)) {
                  return prev < filteredGallery.length - 1 ? prev + 1 : 0;
                } else {
                  return prev > 0 ? prev - 1 : filteredGallery.length - 1;
                }
              });
            }
            touchStartX.current = null;
            touchStartY.current = null;
          }}
        >
          <div className="lightbox-content">
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setActiveLightboxIndex(null)}
              aria-label={ar ? "إغلاق" : "Close"}
            >
              ×
            </button>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-prev"
              onClick={() =>
                setActiveLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1
                )
              }
              aria-label={ar ? "السابق" : "Previous"}
            >
              {ar ? "→" : "←"}
            </button>

            <div className="lightbox-img-wrap">
              {filteredGallery[activeLightboxIndex]?.isVideo ? (
                <video
                  src={(filteredGallery[activeLightboxIndex] as any)?.videoUrl || filteredGallery[activeLightboxIndex]?.imageUrl}
                  poster={filteredGallery[activeLightboxIndex]?.imageUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: "auto", height: "auto", maxWidth: "92vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }}
                />
              ) : (
                <Image
                  src={filteredGallery[activeLightboxIndex]?.imageUrl || ""}
                  alt={filteredGallery[activeLightboxIndex]?.alt || `${project.name} photo ${activeLightboxIndex + 1}`}
                  width={1600}
                  height={1000}
                  quality={92}
                  priority
                  style={{ width: "auto", height: "auto", maxWidth: "92vw", maxHeight: "85vh", objectFit: "contain" }}
                />
              )}
              {filteredGallery[activeLightboxIndex]?.caption && (
                <p className="lightbox-caption" style={{ marginTop: "12px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textAlign: "center" }}>
                  {filteredGallery[activeLightboxIndex].caption}
                </p>
              )}
              <span className="lightbox-counter">
                {activeLightboxIndex + 1} / {filteredGallery.length}
              </span>
            </div>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-next"
              onClick={() =>
                setActiveLightboxIndex((prev) =>
                  prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0
                )
              }
              aria-label={ar ? "التالي" : "Next"}
            >
              {ar ? "←" : "→"}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          Visual Tour Viewer Modal (Priority 3, 4, 5, 7)
          Secure, Isolated, Cookieless Sandboxed Iframe Overlay
      ========================================================= */}
      {visualTourModalOpen && (
        <div
          ref={tourOverlayRef}
          className="visual-tour-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "جولة افتراضية تفاعلية" : "Interactive Visual Tour"}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(10, 15, 12, 0.96)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Viewer Top Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px clamp(16px, 3vw, 32px)",
              background: "rgba(20, 30, 24, 0.85)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 8px #4ade80",
                }}
                aria-hidden="true"
              />
              <strong style={{ fontSize: "16px", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {project.name}
              </strong>
              {activeTour && (
                <span style={{ fontSize: "13px", opacity: 0.7, borderInlineStart: "1px solid rgba(255,255,255,0.2)", paddingInlineStart: "10px" }}>
                  {activeTour.title}
                </span>
              )}
            </div>

            {/* Tour selector tabs if multiple exist */}
            {visualTours.length > 1 && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginInline: "12px" }}>
                {visualTours.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTourIframeLoading(true);
                      setActiveTourIndex(idx);
                    }}
                    style={{
                      background: activeTourIndex === idx ? "var(--forest)" : "rgba(255,255,255,0.1)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: activeTourIndex === idx ? 600 : 400,
                    }}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {/* Actions: Fullscreen & Close */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? (ar ? "إنهاء وضع ملء الشاشة" : "Exit Fullscreen") : (ar ? "ملء الشاشة" : "Fullscreen")}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>{isFullscreen ? (ar ? "تصغير" : "Exit") : (ar ? "ملء الشاشة" : "Fullscreen")}</span>
              </button>

              <button
                type="button"
                onClick={closeVisualTour}
                aria-label={ar ? "إغلاق الجولة" : "Close Tour"}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {ar ? "إغلاق ✕" : "Close ✕"}
              </button>
            </div>
          </div>

          {/* Viewer Stage */}
          <div
            style={{
              flex: 1,
              position: "relative",
              width: "100%",
              height: "100%",
              background: "#050706",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Loading state indicator */}
            {tourIframeLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#ffffff",
                  background: "#080c09",
                  zIndex: 2,
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid rgba(255,255,255,0.2)",
                    borderTopColor: "var(--cream)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: "14px", opacity: 0.85 }}>
                  {ar ? "جارٍ تجهيز الجولة الافتراضية..." : "Initializing interactive visual tour..."}
                </span>
              </div>
            )}

            {/* If HTML tour exists: isolated sandboxed iframe */}
            {hasHtmlTours && activeTour ? (
              <iframe
                key={activeTour.id}
                src={`${activeTour.extractedPrefix}/${activeTour.entryFilePath}`}
                title={`${project.name} — ${activeTour.title}`}
                sandbox="allow-scripts allow-same-origin"
                allow="accelerometer; gyroscope; fullscreen"
                onLoad={() => setTourIframeLoading(false)}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            ) : project.videoTourUrl ? (
              /* Fallback: Video tour */
              <video
                src={project.videoTourUrl}
                controls
                autoPlay
                playsInline
                onLoadedData={() => setTourIframeLoading(false)}
                style={{ width: "100%", maxHeight: "90vh", borderRadius: "8px" }}
              />
            ) : null}
          </div>
        </div>
      )}

      <Footer copy={copy} page="projects" />
    </>
  );
}
