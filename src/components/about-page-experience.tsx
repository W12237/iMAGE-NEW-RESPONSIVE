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

function AboutHero({ copy }: { copy: AboutPageContent }) {
  const ref = useRef<HTMLElement>(null);
  const ar = copy.locale === "ar";
  const homeHref = `/${copy.locale}`;
  const reduce = useReducedMotion();
  const hero = copy.aboutPage.hero;
  const { isInitialCinematic, introPhase } = usePageTransition();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0.2]);

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

  return (
    <header id="top" ref={ref} className="about-hero" role="banner" aria-label={hero.title}>
      {/* Background Architectural Imagery with Parallax Scroll */}
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

      {/* Directional Architectural Shade */}
      <div className="about-hero-shade" aria-hidden="true" />

      {/* Main Hero Copy Container */}
      <motion.div className="about-hero-copy stage-pad" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="about-hero-inner">
          {/* Harmonized Single-Line Pretitle: Breadcrumb & Brand Folio */}
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

          {/* Main H1 - Grand Architectural Headline */}
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
        </div>
      </motion.div>

      {/* Signature Centered Double-Chevron Scroll Indicator */}
      <motion.button
        type="button"
        onClick={onScrollToTimeline}
        className="double-chevron about-hero-scroll-link"
        aria-label={ar ? "انتقل إلى مسيرتنا" : "Scroll to our journey"}
        initial={animateEntrance ? { opacity: 0 } : false}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: animateEntrance ? 0.55 : 0, delay: animateEntrance ? 0.8 : 0, ease }}
      >
        <i aria-hidden="true" />
        <i aria-hidden="true" />
      </motion.button>
    </header>
  );
}

function ContentBlocks({ copy }: { copy: AboutPageContent }) {
  const blocks = copy.aboutPage.blocks.filter((block) => block.enabled);
  if (!blocks.length) return null;

  return (
    <div className="about-content-blocks" id="about-details">
      {blocks.map((block, index) => (
        <section
          className={`about-content-block stage-pad ${index % 2 ? "about-content-block--reverse" : ""}`}
          key={block.id}
        >
          <Reveal className="about-content-copy">
            <div className="about-content-meta">
              <span className="about-content-index">{String(index + 3).padStart(2, "0")}</span>
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
            ABOUT_TIMELINE: <AboutTimeline copy={copy} sectionNumber="02" isAboutPage={true} />,
            ABOUT_BLOCKS: <ContentBlocks copy={copy} />,
            CONTACT_FORM: <GlobalContactForm copy={copy} />,
          }}
        />
      </main>
      <Footer copy={copy} page="about" />
    </>
  );
}
