"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import type { ProjectDetailPageContent, UnitTypeItem } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { useEnquiryModal } from "./enquiry-provider";
import { SmoothScroll } from "./smooth-scroll";

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
  const [galleryFilter, setGalleryFilter] = useState<"ALL" | "RENDERS" | "CONSTRUCTION">("ALL");
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Video tour modal state
  const [videoTourOpen, setVideoTourOpen] = useState(false);

  // Keyboard accessibility for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMasterPlanOpen(false);
        setActiveLightboxIndex(null);
        setVideoTourOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Gallery items classification
  const galleryItems = project.gallery.length > 0 ? project.gallery : [project.coverImageUrl];
  const filteredGallery = galleryItems.filter((_, idx) => {
    if (galleryFilter === "ALL") return true;
    if (galleryFilter === "RENDERS") return idx % 2 === 0;
    if (galleryFilter === "CONSTRUCTION") return idx % 2 === 1;
    return true;
  });

  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="projects" />

      <main className="project-detail-page" dir={ar ? "rtl" : "ltr"}>
        {/* =========================================================
            A. Project Hero
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
            <nav className="project-breadcrumb" aria-label="Breadcrumb">
              <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
              <span aria-hidden="true">/</span>
              <Link href={projectsHref}>{ar ? "المشاريع" : "Projects"}</Link>
              <span aria-hidden="true">/</span>
              <strong>{project.name}</strong>
            </nav>

            <div className="project-hero-badges">
              <span className="hero-pill hero-pill--location">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{project.location}</span>
              </span>
              <span className="hero-pill hero-pill--type">
                {project.projectType}
              </span>
              <span className="hero-pill hero-pill--status">
                {project.progressStatus}
              </span>
            </div>

            <h1 className="project-hero-title">{project.name}</h1>
            <p className="project-hero-deck">{project.shortDescription}</p>

            <div className="project-hero-ctas">
              <button
                type="button"
                className="btn-project-primary"
                onClick={() => handleScrollTo("overview")}
              >
                <span>{ar ? "اكتشف المشروع" : "Discover Project"}</span>
                <b aria-hidden="true">↓</b>
              </button>

              <button
                type="button"
                className="btn-project-enquire-hero"
                onClick={() => handleOpenProjectEnquiry()}
              >
                <span>{ar ? "سجل اهتمامك" : "Register Interest"}</span>
              </button>

              {project.videoTourUrl && (
                <button
                  type="button"
                  className="btn-project-tour"
                  onClick={() => setVideoTourOpen(true)}
                  aria-label={ar ? "جولة مرئية" : "Visual Tour"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span>{ar ? "جولة مرئية" : "Visual Tour"}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            B. Project Overview
        ========================================================= */}
        <section id="overview" className="project-overview-section stage-pad">
          <div className="section-header">
            <span className="section-eyebrow">{ar ? "نظرة عامة على المشروع" : "Project Overview"}</span>
            <h2>{ar ? `رؤية متفردة في قلب ${project.location}` : `A Considered Vision in ${project.location}`}</h2>
          </div>

          <div className="project-overview-grid">
            <div className="project-overview-text">
              <p className="lead-paragraph">{project.fullDescription || project.shortDescription}</p>
              <button
                type="button"
                className="btn-link-scroll"
                onClick={() => handleScrollTo("highlights")}
              >
                <span>{ar ? "استكشف مميزات المشروع" : "Explore Project Highlights"}</span>
                <b aria-hidden="true">{ar ? "←" : "→"}</b>
              </button>
            </div>

            {project.keyFacts && project.keyFacts.length > 0 && (
              <div className="project-key-facts">
                <h3 className="key-facts-title" style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", margin: "0 0 12px 0", gridColumn: "1 / -1" }}>
                  {ar ? "حقائق رئيسية" : "Key Facts"}
                </h3>
                {project.keyFacts.map((fact, i) => (
                  <div key={i} className="fact-item">
                    <strong className="fact-value">{fact.value}</strong>
                    <span className="fact-label">{fact.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            C. Project Highlights
        ========================================================= */}
        {project.highlights && project.highlights.length > 0 && (
          <section id="highlights" className="project-highlights-section stage-pad">
            <div className="section-header">
              <span className="section-eyebrow">{ar ? "أبرز المميزات والمرافق" : "Project Highlights"}</span>
              <h2>{ar ? "تصميم يعزز جودة الحياة والهدوء" : "Designed for Living with Perspective"}</h2>
            </div>

            <div className="highlights-grid">
              {project.highlights.map((h, i) => (
                <div key={i} className="highlight-card">
                  <div className="highlight-icon-wrap" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </div>
                  <h3>{h.title}</h3>
                  <p>{h.description}</p>
                </div>
              ))}
            </div>

            <div className="highlights-footer-action">
              <button
                type="button"
                className="btn-project-primary"
                onClick={() => handleScrollTo("unit-types")}
              >
                <span>{ar ? "استكشف الوحدات المتاحة" : "Explore Available Units"}</span>
                <b aria-hidden="true">↓</b>
              </button>
            </div>
          </section>
        )}

        {/* =========================================================
            D. Master Plan
        ========================================================= */}
        {project.masterPlanUrl && (
          <section id="master-plan" className="project-masterplan-section stage-pad">
            <div className="section-header">
              <span className="section-eyebrow">{ar ? "المخطط العام" : "Master Plan"}</span>
              <h2>{ar ? "تكامل مدروس بين العمارة والمساحات المفتوحة" : "Harmonious Integration of Built Space and Landscape"}</h2>
            </div>

            <div className="masterplan-card">
              <div className="masterplan-preview-wrap">
                <Image
                  src={project.masterPlanUrl}
                  alt={ar ? `المخطط العام لمشروع ${project.name}` : `${project.name} Master Plan`}
                  fill
                  sizes="(max-width: 900px) 100vw, 85vw"
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

        {/* =========================================================
            E. Unit Types
        ========================================================= */}
        {project.unitTypes && project.unitTypes.length > 0 && (
          <section id="unit-types" className="project-units-section stage-pad">
            <div className="section-header">
              <span className="section-eyebrow">{ar ? "أنواع الوحدات" : "Unit Types"}</span>
              <h2>{ar ? "مساحات صُممت لتلائم تطلعاتك" : "Curated Residences Built Around Your Lifestyle"}</h2>
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

        {/* =========================================================
            F. Location & Connectivity
        ========================================================= */}
        <section id="location" className="project-location-section stage-pad">
          <div className="section-header">
            <span className="section-eyebrow">{ar ? "الموقع وسهولة الوصول" : "Location & Connectivity"}</span>
            <h2>{ar ? `موقع استراتيجي في ${project.location}` : `Strategically Positioned in ${project.location}`}</h2>
          </div>

          <div className="location-grid">
            <div className="location-map-wrap">
              {project.latitude && project.longitude ? (
                <iframe
                  title={`${project.name} Map`}
                  src={`https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=14&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 380, borderRadius: "var(--image-radius)" }}
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

        {/* =========================================================
            G. Project Gallery
        ========================================================= */}
        <section id="gallery" className="project-gallery-section stage-pad">
          <div className="gallery-header-row">
            <div className="section-header">
              <span className="section-eyebrow">{ar ? "معرض المشروع" : "Project Gallery"}</span>
              <h2>{ar ? "تفاصيل تلهم التجربة" : "Immersive Visual Experience"}</h2>
            </div>

            <div className="gallery-filter-tabs">
              <button
                type="button"
                className={`gallery-tab ${galleryFilter === "ALL" ? "is-active" : ""}`}
                onClick={() => setGalleryFilter("ALL")}
              >
                {ar ? "الكل" : "All"}
              </button>
              <button
                type="button"
                className={`gallery-tab ${galleryFilter === "RENDERS" ? "is-active" : ""}`}
                onClick={() => setGalleryFilter("RENDERS")}
              >
                {ar ? "التصميمات المعمارية" : "Renders"}
              </button>
              <button
                type="button"
                className={`gallery-tab ${galleryFilter === "CONSTRUCTION" ? "is-active" : ""}`}
                onClick={() => setGalleryFilter("CONSTRUCTION")}
              >
                {ar ? "صور الموقع" : "Construction Photos"}
              </button>
            </div>
          </div>

          <div className="gallery-grid">
            {filteredGallery.map((imgUrl, i) => (
              <div
                key={i}
                className="gallery-thumb"
                onClick={() => setActiveLightboxIndex(i)}
                tabIndex={0}
                role="button"
                aria-label={ar ? `عرض الصورة ${i + 1} بالحجم الكامل` : `View image ${i + 1} full-screen`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveLightboxIndex(i);
                }}
              >
                <Image
                  src={imgUrl}
                  alt={`${project.name} gallery image ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="gallery-img"
                  quality={85}
                />
                <div className="gallery-thumb-hover">
                  <span>+</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            H. Construction Updates
        ========================================================= */}
        {project.constructionUpdates && project.constructionUpdates.length > 0 && (
          <section id="construction-updates" className="project-updates-section stage-pad">
            <div className="section-header">
              <span className="section-eyebrow">{ar ? "تحديثات الإنشاء" : "Construction Updates"}</span>
              <h2>{ar ? "نتابع معاً مراحل تشكيل المكان" : "Tracking Progress on the Ground"}</h2>
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
                        sizes="(max-width: 900px) 100vw, 50vw"
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

        {/* =========================================================
            I. Download Brochure
        ========================================================= */}
        {project.brochureUrl && (
          <section id="brochure" className="project-brochure-section stage-pad">
            <div className="brochure-card">
              <div className="brochure-info">
                <span className="section-eyebrow">{ar ? "كتيب المشروع الرسمي" : "Official Project Brochure"}</span>
                <h2>{ar ? `حمّل كتيب مشروع ${project.name}` : `Download ${project.name} Brochure`}</h2>
                <p>
                  {ar
                    ? "احصل على التفاصيل المعمارية الكاملة، المخططات الفراغية، والمواصفات الفنية المعتمدة في ملف PDF شامل."
                    : "Access comprehensive architectural master plans, spatial diagrams, unit layouts, and technical specifications."}
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
                  sizes="40vw"
                  quality={88}
                />
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            J. Register Your Interest (Enquiry Section)
        ========================================================= */}
        <section id="register-interest" className="project-enquiry-section stage-pad">
          <div className="project-enquiry-box">
            <span className="section-eyebrow">{ar ? "سجل اهتمامك" : "Register Your Interest"}</span>
            <h2>{ar ? `ابدأ خطوتك القادمة في ${project.name}` : `Take Your Next Step at ${project.name}`}</h2>
            <p>
              {ar
                ? "تحدث مباشرة مع مستشارينا لمعرفة أحدث الوحدات المتاحة وخطط السداد المصممة خصيصاً لتطلعاتك."
                : "Connect with our property specialists for real-time availability, personalized presentations, and flexible payment terms."}
            </p>

            <div className="enquiry-box-actions">
              <button
                type="button"
                className="btn-enquiry-open-cta"
                onClick={() => handleOpenProjectEnquiry()}
              >
                <span>{ar ? "تقديم طلب استفسار" : "Submit Inquiry"}</span>
                <b aria-hidden="true">{ar ? "←" : "→"}</b>
              </button>

              <div className="enquiry-hotline-wrap">
                <span className="hotline-or">{ar ? "أو اتصل مباشرة عبر" : "Or call directly on"}</span>
                <a href="tel:17087" className="enquiry-hotline-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>17087</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Other Projects Recommendation */}
        {copy.otherProjects && copy.otherProjects.length > 0 && (
          <aside className="other-projects-section stage-pad">
            <h3>{ar ? "استكشف وجهات أخرى من إيمدج" : "Explore Other Image Destinations"}</h3>
            <div className="other-projects-grid">
              {copy.otherProjects.map((op) => (
                <Link
                  key={op.id}
                  href={`/${copy.locale}/projects/${op.slug}`}
                  className="other-project-card"
                >
                  <div className="other-project-thumb">
                    <Image src={op.image} alt={op.name} fill sizes="33vw" quality={85} />
                  </div>
                  <div className="other-project-meta">
                    <h4>{op.name}</h4>
                    <span>{op.location} · {op.projectType}</span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
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
              <Image
                src={filteredGallery[activeLightboxIndex]}
                alt={`${project.name} photo ${activeLightboxIndex + 1}`}
                width={1600}
                height={1000}
                quality={92}
                priority
                style={{ width: "auto", height: "auto", maxWidth: "92vw", maxHeight: "85vh", objectFit: "contain" }}
              />
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
          Video Tour Modal
      ========================================================= */}
      {videoTourOpen && project.videoTourUrl && (
        <div
          className="modal-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVideoTourOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "جولة مرئية" : "Visual Tour"}
        >
          <div className="video-modal-content">
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setVideoTourOpen(false)}
              aria-label={ar ? "إغلاق" : "Close"}
            >
              ×
            </button>
            <video
              src={project.videoTourUrl}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", maxHeight: "80vh", borderRadius: "12px" }}
            />
          </div>
        </div>
      )}

      <Footer copy={copy} page="projects" />
    </>
  );
}
