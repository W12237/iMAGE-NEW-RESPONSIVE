"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CompanyStatItem, HomeContent } from "@/content/home";

function StatImage({
  src,
  alt,
  focalPoint = "center",
}: {
  src?: string;
  alt?: string;
  focalPoint?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="company-intro-image-fallback"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#152a20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "13px",
            letterSpacing: "0.12em",
            fontWeight: 500,
          }}
        >
          IMAGE DEVELOPMENTS
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Image Developments architecture"}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 760px"
      style={{
        objectFit: "cover",
        objectPosition: focalPoint,
      }}
      onError={() => setFailed(true)}
    />
  );
}

export function StatsStrip({
  copy,
  isAboutPage = false,
  sectionNumber,
}: {
  copy: HomeContent;
  isAboutPage?: boolean;
  sectionNumber?: string;
}) {
  const reduce = useReducedMotion();
  const ar = copy.locale === "ar";
  const [isOnAboutPage, setIsOnAboutPage] = useState(isAboutPage);

  useEffect(() => {
    if (isAboutPage) {
      setIsOnAboutPage(true);
    } else if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/about")) {
        setIsOnAboutPage(true);
      }
    }
  }, [isAboutPage]);

  const statsSection = copy.statsSection;
  const isSectionVisible =
    copy.visibility?.stats !== false && statsSection?.enabled !== false;

  // Use stats from statsSection if available, fallback to copy.stats
  const rawStats: CompanyStatItem[] = statsSection?.stats?.length
    ? statsSection.stats
    : copy.stats;
  const displayedStats = (rawStats || []).filter((s) => s.visible !== false);

  if (!isSectionVisible || (!displayedStats.length && !statsSection?.heading)) {
    return null;
  }

  // Content Hierarchy:
  // 1. Optional small section label ("About Image" / "عن إيمدج")
  const sectionLabel = statsSection?.label;

  // 2. Clear H2 heading with natural wrapping
  const rawHeading =
    statsSection?.heading ||
    (ar
      ? "نصنع مجتمعات مدروسة ذات قيمة تدوم."
      : "Shaping places with enduring perspective.");
  const sectionHeading = rawHeading.replace(/\r?\n+/g, " ").trim();

  // 3 & 4. Concise introduction and optional supporting paragraph
  const rawDesc =
    statsSection?.description ||
    (ar
      ? "على مدار ما يقارب عقدين من الزمان، تبتكر إيمدج للتطوير العقاري بيئات سكنية ومختلطة متكاملة تجمع بين الحرفية المعمارية وتناغم الطبيعة لتمنح الحياة معنى أعمق."
      : "For nearly two decades, Image Developments has crafted thoughtful residential and mixed-use environments that balance architectural craft with the natural landscape.");

  let leadIntro = "";
  let supportingParagraph: string | undefined = statsSection?.supportingText;

  if (rawDesc) {
    const paragraphs = rawDesc
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length > 0) {
      leadIntro = paragraphs[0];
      if (!supportingParagraph && paragraphs.length > 1) {
        supportingParagraph = paragraphs[1];
      }
    }
  }

  // 5. Clear CTA:
  // - On homepage: "Discover Our Story" / "اكتشف قصتنا" -> /${locale}/about
  // - On About page: "Explore Our Journey" / "استكشف مسيرتنا" -> #about with smooth scroll
  const effectiveIsAbout = isAboutPage || isOnAboutPage;

  let ctaLabel: string;
  let rawCtaUrl: string;

  if (effectiveIsAbout) {
    ctaLabel = ar ? "استكشف مسيرتنا" : "Explore Our Journey";
    rawCtaUrl = "#about";
  } else {
    ctaLabel =
      statsSection?.ctaLabel || (ar ? "اكتشف قصتنا" : "Discover Our Story");
    rawCtaUrl = statsSection?.ctaUrl || "/about";
  }

  const isAnchor = rawCtaUrl.startsWith("#");
  const ctaHref =
    rawCtaUrl.startsWith("http") || isAnchor
      ? rawCtaUrl
      : rawCtaUrl.startsWith(`/${copy.locale}`)
        ? rawCtaUrl
        : `/${copy.locale}${rawCtaUrl.startsWith("/") ? rawCtaUrl : `/${rawCtaUrl}`}`;

  const onCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAnchor) {
      const targetId = rawCtaUrl.replace("#", "");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        const lenis = (
          window as unknown as {
            lenis?: {
              scrollTo: (
                target: string | HTMLElement,
                opts?: { offset?: number; duration?: number }
              ) => void;
            };
          }
        ).lenis;
        if (lenis) {
          lenis.scrollTo(targetEl, { offset: -90, duration: 1.2 });
        } else {
          targetEl.scrollIntoView({ behavior: "smooth" });
        }
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", `#${targetId}`);
        }
      }
    }
  };

  const brochureUrl = copy.settings?.companyBrochureUrl;

  const imageSrc =
    statsSection?.imageUrl ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88";

  const revealMotion = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: {
      duration: 0.65,
      delay: reduce ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      id="stats"
      className="company-intro-stats stage-pad"
      style={{ backgroundColor: `rgb(${copy.backgrounds.stats})` }}
      aria-label={sectionHeading}
    >
      <div className="company-intro-container">
        {/* Main Composition: ~45% text, 55% imagery with comfortable 40-64px column gap */}
        <div className="company-intro-main">
          <motion.div
            className="company-intro-text-block"
            {...revealMotion(0)}
          >
            {/* Small optional section label */}
            {sectionLabel && (
              <span className="company-intro-label">{sectionLabel}</span>
            )}

            {/* Clear H2 heading with brand serif and natural line wrapping */}
            <h2 className="company-intro-heading">{sectionHeading}</h2>

            {/* Concise introduction */}
            {leadIntro && (
              <p className="company-intro-lead">{leadIntro}</p>
            )}

            {/* Optional supporting paragraph */}
            {supportingParagraph && (
              <p className="company-intro-supporting">
                {supportingParagraph}
              </p>
            )}

            {/* Primary Action and Optional Brochure */}
            <div className="company-intro-actions">
              {ctaLabel && (
                <div className="company-intro-cta-wrap">
                  <Link
                    href={ctaHref}
                    onClick={onCtaClick}
                    className="company-intro-cta"
                    aria-label={ctaLabel}
                  >
                    <span className="company-intro-cta-text">{ctaLabel}</span>
                    <span
                      className="company-intro-cta-arrow"
                      aria-hidden="true"
                    >
                      {ar ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              )}

              {brochureUrl && (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-intro-brochure-link"
                  aria-label={ar ? "تحميل كتيب الشركة" : "Download Company Brochure"}
                >
                  <span>{ar ? "كتيب الشركة" : "Company Brochure"}</span>
                  <span aria-hidden="true" className="company-intro-brochure-icon">
                    ↓
                  </span>
                </a>
              )}
            </div>
          </motion.div>

          {/* Architectural Image Frame: deliberate crop & reserved aspect ratio to prevent CLS */}
          <motion.div
            className="company-intro-image-frame"
            {...revealMotion(0.12)}
          >
            <StatImage
              src={imageSrc}
              alt={
                statsSection?.imageAlt ||
                (ar
                  ? "التميز المعماري في إيمدج للتطوير العقاري"
                  : "Architectural craft at Image Developments")
              }
              focalPoint={statsSection?.focalPoint || "center"}
            />
          </motion.div>
        </div>

        {/* Company Statistics: clean, aligned row with restrained dividers */}
        {displayedStats.length > 0 && (
          <motion.div
            className="company-stats-row"
            role="list"
            {...revealMotion(0.2)}
          >
            {displayedStats.map((s, i) => (
              <div
                key={s.id || `${s.label}-${i}`}
                className="company-stat-item"
                role="listitem"
              >
                <strong className="company-stat-number">
                  <bdi className="company-stat-bdi">
                    {s.value}
                    {s.unit ? ` ${s.unit}` : ""}
                  </bdi>
                </strong>
                <span className="company-stat-label">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
