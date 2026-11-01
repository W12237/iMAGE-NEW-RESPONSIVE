"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { AboutPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { AboutTimeline, Footer } from "./homepage-experience";
import { PageBlocks, pageBlocksFor } from "./page-blocks";
import { GlobalContactForm } from "./contact-form";
import { Reveal } from "./motion-reveal";
import { SmoothScroll } from "./smooth-scroll";
import { usePageTransition } from "./page-transition";
import { useEnquiryModal } from "./enquiry-provider";

/* ==========================================================================
   A. ABOUT HERO
   High-contrast, architectural backdrop, concise story, and smooth CTA to timeline.
   ========================================================================== */
function AboutHero({ copy }: { copy: AboutPageContent }) {
  const ref = useRef<HTMLElement>(null);
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const reduce = useReducedMotion();
  const hero = copy.aboutPage.hero;
  const { isInitialCinematic, introPhase } = usePageTransition();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  const animateEntrance = isInitialCinematic && !reduce;
  const [revealed, setRevealed] = useState(() => !isInitialCinematic || Boolean(reduce));

  useEffect(() => {
    if (introPhase === "expanding" || introPhase === "done" || !isInitialCinematic || reduce) {
      setRevealed(true);
    }
  }, [introPhase, isInitialCinematic, reduce]);

  useEffect(() => {
    const safety = setTimeout(() => {
      setRevealed(true);
    }, 600);
    return () => clearTimeout(safety);
  }, []);

  const onScrollToTimeline = () => {
    const lenis = (window as unknown as { lenis?: { scrollTo: (target: string | HTMLElement, opts?: { offset?: number; duration?: number }) => void } }).lenis;
    if (lenis) {
      lenis.scrollTo("#about", { duration: 1.2 });
    } else {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!hero || hero.enabled === false) return null;

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const ctaLabel = hero.ctaLabel || (ar ? "اكتشف رحلتنا" : "Explore Our Journey");

  return (
    <header id="top" ref={ref} className="about-hero" role="banner" aria-label={hero.title}>
      {/* Background Architectural Imagery with Subtle Scale */}
      <motion.div className="about-hero-media" style={{ scale }}>
        <motion.div
          className="about-hero-bg-motion"
          initial={animateEntrance ? { scale: 1.06 } : false}
          animate={{ scale: 1.0 }}
          transition={{ duration: animateEntrance ? 1.6 : 0, delay: animateEntrance ? 0.1 : 0, ease }}
        >
          {hero.image && (
            <Image
              src={hero.image}
              alt={hero.alt || (ar ? "عن إيمدج للتطوير العقاري" : "About Image Developments")}
              fill
              priority
              sizes="100vw"
              quality={90}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Directional Architectural Darkening for Optimum Legibility */}
      <div className="about-hero-shade" aria-hidden="true" />

      {/* Main Hero Copy Container */}
      <motion.div className="about-hero-copy stage-pad" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="about-hero-inner">
          {/* Breadcrumb & Brand Folio */}
          <motion.div
            className="about-hero-pretitle"
            initial={animateEntrance ? { opacity: 0, y: 8 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: animateEntrance ? 0.5 : 0, delay: animateEntrance ? 0.18 : 0, ease }}
          >
            <nav className="about-hero-breadcrumb" aria-label={ar ? "مسار التنقل" : "Breadcrumb"}>
              <Link href={homeHref}>{ar ? "الرئيسية" : "Home"}</Link>
              <span aria-hidden="true" className="breadcrumb-sep">/</span>
              <span aria-current="page">{ar ? "من نحن" : "About Us"}</span>
            </nav>
            {hero.eyebrow && (
              <>
                <span className="pretitle-sep" aria-hidden="true">•</span>
                <span className="about-hero-brand-label">{hero.eyebrow}</span>
              </>
            )}
          </motion.div>

          {/* Main H1 - Architectural Headline */}
          <motion.h1
            className="about-hero-h1"
            initial={animateEntrance ? { opacity: 0, y: 14 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: animateEntrance ? 0.65 : 0, delay: animateEntrance ? 0.28 : 0, ease }}
          >
            {hero.title}
          </motion.h1>

          {/* Supporting Editorial Story Block */}
          {hero.body && (
            <motion.div
              className="about-hero-narrative"
              initial={animateEntrance ? { opacity: 0, y: 12 } : false}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: animateEntrance ? 0.6 : 0, delay: animateEntrance ? 0.38 : 0, ease }}
            >
              <span className="about-hero-index">01</span>
              <p className="about-hero-body">{hero.body}</p>
            </motion.div>
          )}

          {/* Prominent CTA to Timeline */}
          <motion.div
            className="about-hero-actions"
            initial={animateEntrance ? { opacity: 0, y: 12 } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: animateEntrance ? 0.6 : 0, delay: animateEntrance ? 0.48 : 0, ease }}
          >
            <button
              type="button"
              onClick={onScrollToTimeline}
              className="btn-about-hero-cta"
              aria-label={ctaLabel}
            >
              <span>{ctaLabel}</span>
              <span aria-hidden="true" className="hero-cta-arrow">
                {ar ? "←" : "→"}
              </span>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Signature Scroll Indicator */}
      <motion.button
        type="button"
        onClick={onScrollToTimeline}
        className="double-chevron about-hero-scroll-link"
        aria-label={ar ? "انتقل إلى مسيرتنا" : "Scroll to our journey"}
        initial={animateEntrance ? { opacity: 0 } : false}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: animateEntrance ? 0.55 : 0, delay: animateEntrance ? 0.75 : 0, ease }}
      >
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </motion.button>
    </header>
  );
}

/* ==========================================================================
   B. WHO WE ARE
   Company introduction, business activities, background & approach with real project imagery.
   CTAs: "Explore Our Projects", "Download Brochure" (only if configured).
   ========================================================================== */
function AboutWhoWeAre({ copy }: { copy: AboutPageContent }) {
  const ar = copy.locale === "ar";
  const data = copy.aboutPage.whoWeAre;
  if (!data || data.enabled === false) return null;

  const brochureUrl = copy.settings?.companyBrochureUrl;
  const primaryHref = data.primaryCtaUrl || `/${copy.locale}/projects`;
  const primaryLabel = data.primaryCtaLabel || (ar ? "استكشف مشاريعنا" : "Explore Our Projects");
  const brochureLabel = data.brochureCtaLabel || (ar ? "تحميل البروشور" : "Download Brochure");

  return (
    <section id="who-we-are" className="about-section about-who-we-are stage-pad" aria-labelledby="who-we-are-title">
      <div className="about-editorial-grid">
        {/* Left Column: Story & Activities */}
        <Reveal className="about-editorial-copy">
          <div className="about-section-meta">
            <span className="about-section-index">02</span>
            {data.eyebrow && <span className="about-section-eyebrow">{data.eyebrow}</span>}
          </div>

          <h2 id="who-we-are-title" className="about-section-title">
            {data.title}
          </h2>

          <div className="about-section-paragraphs">
            {data.body && (
              <p className="about-lead-paragraph">{data.body}</p>
            )}
            {data.approach && (
              <p className="about-secondary-paragraph">{data.approach}</p>
            )}
          </div>

          {/* Action Row */}
          <div className="about-actions-row">
            <Link
              href={primaryHref}
              className="about-btn-primary"
              aria-label={primaryLabel}
            >
              <span>{primaryLabel}</span>
              <b aria-hidden="true">{ar ? "←" : "→"}</b>
            </Link>

            {brochureUrl && (
              <a
                href={brochureUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="about-btn-secondary"
                aria-label={brochureLabel}
              >
                <svg
                  width="16"
                  height="16"
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
                <span>{brochureLabel}</span>
              </a>
            )}
          </div>
        </Reveal>

        {/* Right Column: Architectural Photography Frame */}
        {data.image && (
          <Reveal className="about-editorial-media" delay={0.15}>
            <div className="about-media-card">
              <Image
                src={data.image}
                alt={data.alt || (ar ? "مجتمع إيمدج للتطوير العقاري" : "Image Developments community")}
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
                className="about-media-img"
              />
              <div className="about-media-caption">
                <span>{ar ? "مجتمعات مدروسة · إيمدج للتطوير العقاري" : "Considered Communities · Image Developments"}</span>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   D. VISION & MISSION
   Clear typography, distinct statements, supporting architectural imagery.
   CTA: "Explore Our Projects".
   ========================================================================== */
function AboutVisionMission({ copy }: { copy: AboutPageContent }) {
  const ar = copy.locale === "ar";
  const data = copy.aboutPage.visionMission;
  if (!data || data.enabled === false) return null;

  const ctaHref = data.ctaUrl || `/${copy.locale}/projects`;
  const ctaLabel = data.ctaLabel || (ar ? "استكشف مشاريعنا" : "Explore Our Projects");

  return (
    <section id="vision-mission" className="about-section about-vision-mission stage-pad" aria-labelledby="vision-mission-heading">
      <div className="about-vm-header">
        <div className="about-section-meta">
          <span className="about-section-index">04</span>
          <span className="about-section-eyebrow">{ar ? "الرؤية والرسالة" : "Vision & Mission"}</span>
        </div>
        <h2 id="vision-mission-heading" className="about-section-title">
          {ar ? "مبادئ ترسم معالم المستقبل" : "Principles Guiding Our Tomorrow"}
        </h2>
      </div>

      <div className="about-vm-grid">
        {/* Vision Card */}
        <Reveal className="about-vm-card about-vm-card--vision">
          <div className="about-vm-pill">
            <span>{data.visionEyebrow}</span>
          </div>
          <h3 className="about-vm-title">{data.visionTitle}</h3>
          <p className="about-vm-statement">{data.visionBody}</p>
        </Reveal>

        {/* Mission Card */}
        <Reveal className="about-vm-card about-vm-card--mission" delay={0.12}>
          <div className="about-vm-pill">
            <span>{data.missionEyebrow}</span>
          </div>
          <h3 className="about-vm-title">{data.missionTitle}</h3>
          <p className="about-vm-statement">{data.missionBody}</p>
        </Reveal>
      </div>

      {/* Supporting Media & Section CTA */}
      <div className="about-vm-footer">
        {data.image && (
          <Reveal className="about-vm-media-wrap">
            <div className="about-vm-media-frame">
              <Image
                src={data.image}
                alt={data.alt || (ar ? "رؤية إيمدج للتطوير العقاري" : "Image Developments Vision")}
                fill
                sizes="(max-width: 900px) 100vw, 85vw"
                className="about-vm-media-img"
              />
            </div>
          </Reveal>
        )}

        <div className="about-vm-action">
          <Link href={ctaHref} className="about-btn-primary" aria-label={ctaLabel}>
            <span>{ctaLabel}</span>
            <b aria-hidden="true">{ar ? "←" : "→"}</b>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   E. OUR ACHIEVEMENTS
   Real metrics from copy.stats, clear explanatory labels, delivered project track record.
   CTA: "View Our Track Record" -> /projects.
   Anchors: #achievements and #about-details.
   ========================================================================== */
function AboutAchievements({ copy }: { copy: AboutPageContent }) {
  const ar = copy.locale === "ar";
  const data = copy.aboutPage.achievements;
  if (!data || data.enabled === false) return null;

  const ctaHref = data.ctaUrl || `/${copy.locale}/projects`;
  const ctaLabel = data.ctaLabel || (ar ? "استعرض سجل إنجازاتنا" : "View Our Track Record");
  const stats = copy.statsSection?.stats?.length ? copy.statsSection.stats : copy.stats;

  return (
    <section
      id="achievements"
      className="about-section about-achievements stage-pad"
      aria-labelledby="achievements-title"
    >
      {/* Anchor alias so Timeline's #about-details lands smoothly here */}
      <div id="about-details" style={{ position: "relative", top: "-100px" }} aria-hidden="true" />

      <div className="about-section-head">
        <div className="about-section-meta">
          <span className="about-section-index">05</span>
          {data.eyebrow && <span className="about-section-eyebrow">{data.eyebrow}</span>}
        </div>
        <h2 id="achievements-title" className="about-section-title">
          {data.title}
        </h2>
        {data.description && (
          <p className="about-section-desc">{data.description}</p>
        )}
      </div>

      {/* Verified Achievement Figures Grid */}
      <div className="about-stats-grid">
        {stats.map((stat, idx) => (
          <Reveal key={stat.label || idx} className="about-stat-item" delay={idx * 0.08}>
            <div className="about-stat-value-wrap">
              <strong className="about-stat-value">{stat.value}</strong>
              {stat.unit && <span className="about-stat-unit">{stat.unit}</span>}
            </div>
            <p className="about-stat-label">{stat.label}</p>
          </Reveal>
        ))}
      </div>

      {/* Completed Portfolio Previews (References) */}
      {copy.projects?.length > 0 && (
        <div className="about-projects-preview-strip">
          <p className="about-preview-kicker">
            {ar ? "وجهات ومجتمعات في مختلف أنحاء مصر" : "Destinations shaping life across Egypt"}
          </p>
          <div className="about-projects-preview-row">
            {copy.projects.slice(0, 3).map((p, idx) => (
              <Link
                key={p.slug || idx}
                href={`/${copy.locale}/projects/${p.slug}`}
                className="about-project-thumb-card"
                aria-label={`${p.name}, ${p.location}`}
              >
                <div className="thumb-media">
                  <Image
                    src={p.image}
                    alt={p.alt || p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="thumb-img"
                  />
                </div>
                <div className="thumb-info">
                  <strong>{p.name}</strong>
                  <span>{p.location}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Track Record Action */}
      <div className="about-achievements-action">
        <Link href={ctaHref} className="about-btn-primary" aria-label={ctaLabel}>
          <span>{ctaLabel}</span>
          <b aria-hidden="true">{ar ? "←" : "→"}</b>
        </Link>
      </div>
    </section>
  );
}

/* ==========================================================================
   F. LEADERSHIP
   Portrait, Name, Position, Short biography. Responsive grid.
   CTA: "Contact Our Team" -> /contact.
   ========================================================================== */
function AboutLeadership({ copy }: { copy: AboutPageContent }) {
  const ar = copy.locale === "ar";
  const data = copy.aboutPage.leadership;
  const { openEnquiry } = useEnquiryModal();

  // If no data or disabled or zero members, hide gracefully
  if (!data || data.enabled === false || !data.members?.length) {
    return null;
  }

  const ctaHref = data.ctaUrl || `/${copy.locale}/contact`;
  const ctaLabel = data.ctaLabel || (ar ? "تواصل مع فريقنا" : "Contact Our Team");

  const handleEnquireLeadership = () => {
    openEnquiry({
      enquiryType: "general",
      sourceCta: "about-leadership",
    });
  };

  return (
    <section id="leadership" className="about-section about-leadership stage-pad" aria-labelledby="leadership-title">
      <div className="about-section-head">
        <div className="about-section-meta">
          <span className="about-section-index">06</span>
          {data.eyebrow && <span className="about-section-eyebrow">{data.eyebrow}</span>}
        </div>
        <h2 id="leadership-title" className="about-section-title">
          {data.title}
        </h2>
        {data.description && (
          <p className="about-section-desc">{data.description}</p>
        )}
      </div>

      {/* Leadership Grid */}
      <div className="about-leadership-grid">
        {data.members.map((member, idx) => (
          <Reveal key={member.id || idx} className="about-leader-card" delay={idx * 0.08}>
            <div className="about-leader-portrait">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.alt || member.name}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="leader-img"
                />
              ) : (
                <div className="leader-placeholder">
                  <span>{member.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="about-leader-info">
              <h3 className="leader-name">{member.name}</h3>
              <p className="leader-role">{member.role}</p>
              {member.bio && (
                <p className="leader-bio">{member.bio}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {/* Leadership CTA */}
      <div className="about-leadership-action">
        <button
          type="button"
          onClick={handleEnquireLeadership}
          className="about-btn-primary"
          aria-label={ctaLabel}
        >
          <span>{ctaLabel}</span>
          <b aria-hidden="true">{ar ? "←" : "→"}</b>
        </button>
      </div>
    </section>
  );
}

/* ==========================================================================
   Flexible Content Blocks (Preserved for Custom CMS Sections)
   ========================================================================== */
function ContentBlocks({ copy }: { copy: AboutPageContent }) {
  const blocks = copy.aboutPage.blocks.filter((block) => block.enabled);
  if (!blocks.length) return null;

  return (
    <div className="about-content-blocks" id="about-extra-blocks">
      {blocks.map((block, index) => (
        <section
          className={`about-content-block stage-pad ${index % 2 ? "about-content-block--reverse" : ""}`}
          key={block.id}
        >
          <Reveal className="about-content-copy">
            <div className="about-content-meta">
              <span className="about-content-index">{String(index + 7).padStart(2, "0")}</span>
              {block.eyebrow && <span className="about-content-eyebrow">{block.eyebrow}</span>}
            </div>
            <h2 className="about-content-title">{block.title}</h2>
            <div className="about-rich-copy">
              {block.body.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          {block.image && (
            <Reveal className="about-content-image" delay={0.1}>
              <div className="about-image-card">
                <Image
                  src={block.image}
                  alt={block.alt ?? ""}
                  fill
                  sizes="(max-width: 800px) 100vw, 50vw"
                  className="about-image-media"
                />
              </div>
            </Reveal>
          )}
        </section>
      ))}
    </div>
  );
}

/* ==========================================================================
   Main About Page Experience Component
   ========================================================================== */
export function AboutPageExperience({ copy }: { copy: AboutPageContent }) {
  return (
    <>
      <SmoothScroll />
      <SiteHeader copy={copy} page="about" />
      <main>
        <PageBlocks
          blocks={pageBlocksFor(copy, "about")}
          builtins={{
            ABOUT_HERO: <AboutHero copy={copy} />,
            ABOUT_WHO_WE_ARE: <AboutWhoWeAre copy={copy} />,
            ABOUT_TIMELINE: <AboutTimeline copy={copy} sectionNumber="03" isAboutPage={true} />,
            ABOUT_VISION_MISSION: <AboutVisionMission copy={copy} />,
            ABOUT_ACHIEVEMENTS: <AboutAchievements copy={copy} />,
            ABOUT_LEADERSHIP: <AboutLeadership copy={copy} />,
            ABOUT_BLOCKS: <ContentBlocks copy={copy} />,
            CONTACT_FORM: <GlobalContactForm copy={copy} />,
          }}
        />
      </main>
      <Footer copy={copy} page="about" />
    </>
  );
}
