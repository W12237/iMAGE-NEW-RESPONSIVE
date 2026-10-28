"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HomeContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Reveal } from "./motion-reveal";
import { ProjectShowcase } from "./project-showcase";
import { BrandMark } from "./brand-mark";
import { GlobalContactForm } from "./contact-form";
import { PageBlocks, pageBlockLabel, pageBlocksFor } from "./page-blocks";
import { SmoothScroll } from "./smooth-scroll";
import { usePageTransition } from "./page-transition";
import { StatsStrip } from "./stats-strip";
import { HomeNewsJournal } from "./home-news-journal";

import { HERO_TIMING } from "@/lib/hero-motion";

function Media({ src, alt, priority = false }: { src?: string; alt?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="mm-media-fallback" style={{ position: "absolute", inset: 0, backgroundColor: "#152a20" }} />;
  }
  return <Image src={src} alt={alt ?? ""} fill priority={priority} sizes="100vw" onError={() => setFailed(true)} />;
}

function HeroMedia({ copy, playVideo }: { copy: HomeContent; playVideo: boolean }) {
  const [mobile, setMobile] = useState(false);
  const [failedSource, setFailedSource] = useState<string>();
  useEffect(() => { const query = window.matchMedia("(max-width: 700px)"); const sync = () => setMobile(query.matches); sync(); query.addEventListener("change", sync); return () => query.removeEventListener("change", sync) }, []);
  const video = mobile ? (copy.hero.mobileVideo || copy.hero.desktopVideo) : copy.hero.desktopVideo;
  const selectedProjectImage = copy.openingProject?.image;
  const image = selectedProjectImage || (mobile ? (copy.hero.mobileImage || copy.hero.image) : (copy.hero.image || copy.hero.mobileImage));
  if (playVideo && video && failedSource !== video) return <video key={video} src={video} autoPlay muted loop playsInline preload="auto" poster={copy.hero.poster || image} onError={() => setFailedSource(video)} />;
  return <Media src={image || copy.hero.poster} alt={copy.hero.alt} priority />;
}

function Hero({ copy }: { copy: HomeContent }) {
  const ref = useRef<HTMLElement>(null);
  const [videoRequested, setVideoRequested] = useState(false);
  const [mobile, setMobile] = useState(false);
  const reduce = useReducedMotion();
  const { introActive, introPhase, isInitialCinematic } = usePageTransition();

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const video = mobile ? (copy.hero.mobileVideo || copy.hero.desktopVideo) : copy.hero.desktopVideo;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scrollScale = useTransform(scrollYProgress, [0, 1], [1.0, reduce ? 1.0 : 1.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 110]);
  const opacity = useTransform(scrollYProgress, [0, 0.78], [1, 0.15]);

  // Entrance trigger latch: once triggered by loader exit or non-cinematic mount, stay revealed
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
    }, 2500);
    return () => clearTimeout(safety);
  }, []);

  const animateEntrance = isInitialCinematic && !reduce;

  return (
    <section id="top" ref={ref} className="mm-hero" style={{ backgroundColor: `rgb(${copy.backgrounds.hero})` }}>
      {/* Hero Background Settlement (200–1500ms) with Parallax Scroll */}
      <motion.div
        className="mm-hero-media"
        style={{
          position: "absolute",
          inset: 0,
          scale: scrollScale,
          transformOrigin: "50% 50%",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
          }}
          initial={animateEntrance ? { scale: HERO_TIMING.background.initialScale } : false}
          animate={{ scale: HERO_TIMING.background.targetScale }}
          transition={{
            duration: animateEntrance ? HERO_TIMING.background.duration : 0,
            delay: animateEntrance ? HERO_TIMING.background.delay : 0,
            ease: HERO_TIMING.background.ease,
          }}
        >
          <HeroMedia copy={copy} playVideo={videoRequested} />
        </motion.div>
      </motion.div>

      <div className="mm-hero-wash" />

      {/* Hero Copy (Eyebrow, Main Heading, CTA Buttons) */}
      <motion.div className="mm-hero-copy" style={{ y: copyY, opacity }}>
        {/* Eyebrow / Supporting label: 650–1300ms */}
        <motion.p
          initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.eyebrow.yMobile : HERO_TIMING.eyebrow.yDesktop } : false}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.eyebrow.yMobile : HERO_TIMING.eyebrow.yDesktop }}
          transition={{
            duration: animateEntrance ? HERO_TIMING.eyebrow.duration : 0,
            delay: animateEntrance ? HERO_TIMING.eyebrow.delay : 0,
            ease: HERO_TIMING.eyebrow.ease,
          }}
        >
          {copy.hero.eyebrow}
        </motion.p>

        {/* Main Heading: 850–1600ms - Complete heading wrapper animated as a unit (preserves connected Arabic script) */}
        <motion.h1
          initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.heading.yMobile : HERO_TIMING.heading.yDesktop } : false}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.heading.yMobile : HERO_TIMING.heading.yDesktop }}
          transition={{
            duration: animateEntrance ? HERO_TIMING.heading.duration : 0,
            delay: animateEntrance ? HERO_TIMING.heading.delay : 0,
            ease: HERO_TIMING.heading.ease,
          }}
        >
          {copy.hero.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </motion.h1>

        {/* CTA Buttons: 1400–2050ms, staggered by 120ms */}
        <div className="mm-hero-actions">
          {video && (
            <motion.button
              type="button"
              className="round-play"
              aria-label={copy.locale === "ar" ? "تشغيل الفيديو" : "Play video"}
              onClick={() => setVideoRequested(true)}
              style={{ pointerEvents: revealed ? "auto" : "none" }}
              initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.ctaPrimary.yMobile : HERO_TIMING.ctaPrimary.yDesktop } : false}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.ctaPrimary.yMobile : HERO_TIMING.ctaPrimary.yDesktop }}
              transition={{
                duration: animateEntrance ? HERO_TIMING.ctaPrimary.duration : 0,
                delay: animateEntrance ? HERO_TIMING.ctaPrimary.delay : 0,
                ease: HERO_TIMING.ctaPrimary.ease,
              }}
            >
              ▶
            </motion.button>
          )}

          <motion.div
            style={{ pointerEvents: revealed ? "auto" : "none" }}
            initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.ctaPrimary.yMobile : HERO_TIMING.ctaPrimary.yDesktop } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.ctaPrimary.yMobile : HERO_TIMING.ctaPrimary.yDesktop }}
            transition={{
              duration: animateEntrance ? HERO_TIMING.ctaPrimary.duration : 0,
              delay: animateEntrance ? HERO_TIMING.ctaPrimary.delay : 0,
              ease: HERO_TIMING.ctaPrimary.ease,
            }}
          >
            <Link href={`/${copy.locale}/projects`} className="outline-cta">
              <span>{copy.locale === "ar" ? "استكشف مشاريعنا" : "Explore Our Projects"}</span>
              <b>{copy.locale === "ar" ? "←" : "→"}</b>
            </Link>
          </motion.div>

          <motion.div
            style={{ pointerEvents: revealed ? "auto" : "none" }}
            initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.ctaSecondary.yMobile : HERO_TIMING.ctaSecondary.yDesktop } : false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.ctaSecondary.yMobile : HERO_TIMING.ctaSecondary.yDesktop }}
            transition={{
              duration: animateEntrance ? HERO_TIMING.ctaSecondary.duration : 0,
              delay: animateEntrance ? HERO_TIMING.ctaSecondary.delay : 0,
              ease: HERO_TIMING.ctaSecondary.ease,
            }}
          >
            <Link href={`/${copy.locale}/about`} className="hero-enquire-cta">
              <span>{copy.locale === "ar" ? "اكتشف قصتنا" : "Discover Our Story"}</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Description / Supporting Note: 1100–1750ms */}
      <motion.p
        className="mm-hero-note"
        initial={animateEntrance ? { opacity: 0, y: mobile ? HERO_TIMING.description.yMobile : HERO_TIMING.description.yDesktop } : false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: mobile ? HERO_TIMING.description.yMobile : HERO_TIMING.description.yDesktop }}
        transition={{
          duration: animateEntrance ? HERO_TIMING.description.duration : 0,
          delay: animateEntrance ? HERO_TIMING.description.delay : 0,
          ease: HERO_TIMING.description.ease,
        }}
      >
        {copy.hero.note}
      </motion.p>

      {/* Scroll Indicator: 1700–2250ms (restrained fade, non-distracting) */}
      <motion.a
        className="double-chevron"
        href="#projects"
        aria-label={copy.hero.scroll}
        style={{ pointerEvents: revealed ? "auto" : "none" }}
        initial={animateEntrance ? { opacity: 0 } : false}
        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: animateEntrance ? HERO_TIMING.scrollIndicator.duration : 0,
          delay: animateEntrance ? HERO_TIMING.scrollIndicator.delay : 0,
          ease: HERO_TIMING.scrollIndicator.ease,
        }}
      >
        <i /><i />
      </motion.a>
    </section>
  );
}

export function AboutTimeline({ copy, sectionNumber = "03", isAboutPage = false }: { copy: HomeContent; sectionNumber?: string; isAboutPage?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const isRtl = copy.dir === "rtl";
  const x = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : (isRtl ? distance : -distance)]);

  useEffect(() => {
    const measure = () => setDistance(Math.max(0, (trackRef.current?.scrollWidth ?? 0) - window.innerWidth));
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [copy.about.milestones.length]);

  if (!copy.about.enabled || !copy.about.milestones.length) return null;
  const channels = (copy.backgrounds?.about ?? "255, 255, 255").split(",").map(value => Number(value.trim()));
  const isLight = channels.length === 3 && channels.every(Number.isFinite) && (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 > 160;

  const achievementsHref = isAboutPage ? "#about-details" : `/${copy.locale}/about#about-details`;

  return <section id="about" ref={sectionRef} className={`about-timeline ${isLight ? "about-timeline--light" : ""}`} style={{ height: reduce ? undefined : `${100 + copy.about.milestones.length * 75}vh`, backgroundColor: `rgb(${copy.backgrounds.about})` }}>
    <div className="about-sticky">
      <div className="about-heading stage-pad">
        <span>{sectionNumber}</span>
        <p>{copy.about.eyebrow}</p>
        <h2>{copy.about.title}</h2>
        <div className="about-intro-wrap">
          <p className="about-intro">{copy.about.intro}</p>
          <Link
            href={achievementsHref}
            className="about-achievements-btn"
            aria-label={copy.locale === "ar" ? "اكتشف إنجازاتنا" : "Discover Our Achievements"}
          >
            <span>{copy.locale === "ar" ? "اكتشف إنجازاتنا" : "Discover Our Achievements"}</span>
            <span aria-hidden="true" className="about-btn-arrow">{copy.locale === "ar" ? "←" : "→"}</span>
          </Link>
        </div>
      </div>
      <motion.div ref={trackRef} className="about-track" style={{ x }}>
        {copy.about.milestones.map((item, index) => <article className="about-page" key={item.id}>
          <div className="about-page-copy"><strong>{item.year}</strong><div><p>{copy.about.eyebrow}</p><h3>{item.title}</h3><p>{item.body}</p></div></div>
          <div className="about-page-image"><Media src={item.image} alt={item.alt} /><span>{String(index + 1).padStart(2, "0")} / {String(copy.about.milestones.length).padStart(2, "0")}</span></div>
        </article>)}
      </motion.div>
      <div className="about-scroll-hint">{copy.locale === "ar" ? "مرّر لاستكشاف رحلتنا" : "Scroll through our story"}<span>{copy.locale === "ar" ? "←" : "→"}</span></div>
    </div>
  </section>;
}

function LivingStory({ copy, isAboutPage = false }: { copy: HomeContent; isAboutPage?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const a = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const b = useTransform(scrollYProgress, [0, 1], [-40, 100]);
  if (copy.lifestyle.enabled === false) return null;
  const images = [copy.lifestyle.image, copy.about.milestones[0]?.image, copy.projects[0]?.image, copy.projects[1]?.image].filter(Boolean) as string[];

  const ar = copy.locale === "ar";
  const defaultLabel = ar ? "اكتشف قصتنا" : "Discover Our Story";
  const ctaLabel = copy.lifestyle.ctaLabel || defaultLabel;
  const ctaHref = isAboutPage ? "#about" : (copy.lifestyle.ctaUrl || `/${copy.locale}/about`);

  return (
    <section ref={ref} className="living-story" style={{ backgroundColor: `rgb(${copy.backgrounds.lifestyle})` }}>
      <div className="living-sticky">
        {images.map((src, index) => (
          <motion.div key={`${src}-${index}`} className={`living-image living-image-${index + 1}`} style={{ y: index % 2 ? b : a }}>
            <Media src={src} />
          </motion.div>
        ))}
        <div className="living-centre">
          <BrandMark />
          <p className="kicker">{copy.lifestyle.eyebrow}</p>
          <h2>{copy.lifestyle.title}</h2>
          <div className="living-cta-wrap">
            <Link href={ctaHref} className="living-cta-btn" aria-label={ctaLabel}>
              <span>{ctaLabel}</span>
              <span className="living-cta-arrow" aria-hidden="true">{ar ? "←" : "→"}</span>
            </Link>
          </div>
          <div className="living-mini-stats">
            {copy.stats.slice(0, 3).map((s) => (
              <span key={s.label}>
                <b>{s.value}</b>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Journal({ copy }: { copy: HomeContent }) {
  const [activeStory, setActiveStory] = useState(0);
  if (copy.journal.enabled === false || !copy.journal.stories.length) return null;
  const ar = copy.locale === "ar";
  const current = copy.journal.stories[activeStory] || copy.journal.stories[0];
  const storyHref = current?.slug ? `/${copy.locale}/journal/${current.slug}` : `/${copy.locale}/journal`;

  return (
    <section id="journal" className="editorial stage-pad" style={{ backgroundColor: `rgb(${copy.backgrounds.journal})` }} aria-label={copy.journal.title}>
      <div className="editorial-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "40px" }}>
        <div>
          <p className="kicker" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--peach, #b66f52)", margin: "0 0 8px 0" }}>
            {copy.journal.eyebrow}
          </p>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 54px)", fontWeight: 300, margin: 0, letterSpacing: "-0.03em" }}>
            {copy.journal.title}
          </h2>
        </div>
        <Link href={`/${copy.locale}/journal`} className="editorial-view-all-link">
          <span>{ar ? "عرض كافة التحديثات" : "View All Updates"}</span>
          <b aria-hidden="true">{ar ? "←" : "→"}</b>
        </Link>
      </div>
      <div className="editorial-grid">
        <Reveal className="editorial-feature">
          <div className="editorial-image" aria-live="polite">
            {copy.journal.stories.map((story, i) => (
              <div className={`editorial-image-frame${i === activeStory ? " is-active" : ""}`} aria-hidden={i !== activeStory} key={`${story.image}-${i}`}>
                <Media src={story.image} alt={i === activeStory ? story.alt : ""} />
              </div>
            ))}
          </div>
          <div className="editorial-feature-cta" style={{ marginTop: "18px" }}>
            <Link href={storyHref} className="editorial-read-more-btn">
              <span>{ar ? "اقرأ المقال" : "Read More"}</span>
              <span aria-hidden="true">{ar ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>
        <div className="editorial-list">
          {copy.journal.stories.map((story, i) => {
            const rowHref = story.slug ? `/${copy.locale}/journal/${story.slug}` : `/${copy.locale}/journal`;
            return (
              <Reveal className="editorial-row-wrap" key={`${story.title}-${story.date}`} delay={0.08 * i}>
                <Link
                  href={rowHref}
                  className={`editorial-row${i === activeStory ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveStory(i)}
                  onFocus={() => setActiveStory(i)}
                >
                  <span>{story.date}</span>
                  <h3>{story.title}</h3>
                  <b aria-hidden="true">{copy.locale === "ar" ? "←" : "→"}</b>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ label, svgIcon }: { label: string; svgIcon?: string }) {
  if (svgIcon) { const image = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}")`; return <i className="social-icon-custom" style={{ maskImage: image, WebkitMaskImage: image }} aria-hidden="true" /> }
  const name = label.toLowerCase();
  if (name.includes("instagram")) return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="social-icon-dot" /></svg>;
  if (name.includes("linkedin")) return <svg className="social-icon-fill" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="4" height="11" /><circle cx="6" cy="5.5" r="2" /><path d="M12 20V9h4v1.7c1-1.3 2.2-2 3.8-2 2.8 0 4.2 1.8 4.2 5.3v6h-4v-5.3c0-1.7-.6-2.5-1.9-2.5-1.4 0-2.1 1-2.1 3V20z" /></svg>;
  if (name.includes("facebook")) return <svg className="social-icon-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a23 23 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2V10H8.2v3H11v8z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 13.8a4.5 4.5 0 0 0 6.4.1l2.3-2.3a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3M13.8 10.2a4.5 4.5 0 0 0-6.4-.1l-2.3 2.3a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" /></svg>;
}

export function Footer(props: { copy: HomeContent; page?: "home" | "projects" | "developments" | "journal" | "about" | "history" | "team" | "partners" | "careers" | "contact" | "policy" | "terms" }) { return <FooterInner {...props} />; }

function FooterInner(props: { copy: HomeContent; page?: "home" | "projects" | "developments" | "journal" | "about" | "history" | "team" | "partners" | "careers" | "contact" | "policy" | "terms" }) {
  const { copy } = props;
  const settings = copy.settings;
  const channels = copy.backgrounds.footer.split(",").map(value => Number(value.trim()));
  const lightBackground = channels.length === 3 && channels.every(Number.isFinite) && (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000 > 160;
  const ar = copy.locale === "ar";
  const root = `/${copy.locale}`;

  // Column A: Brand
  const brandDescription =
    settings?.description ||
    (ar
      ? "مجتمعات مدروسة تتكامل فيها العمارة والطبيعة وتفاصيل الحياة اليومية لصنع قيمة مستدامة."
      : "Considered communities where architecture, landscape, and everyday living belong together.");

  const socialLinks = settings?.socials?.filter(s => Boolean(s.url?.trim())) ?? [];

  // Column B: Explore
  const exploreHeading = settings?.footerExploreHeading || (ar ? "استكشف" : "Explore");
  const exploreLinks = [
    { label: ar ? "الرئيسية" : "Home", href: root },
    { label: ar ? "من نحن" : "About Us", href: `${root}/about` },
    { label: ar ? "المشاريع" : "Projects", href: `${root}/projects` },
    { label: ar ? "اليوميات" : "Journal", href: `${root}/journal` },
    { label: ar ? "الوظائف" : "Careers", href: `${root}/careers` },
    { label: ar ? "تواصل معنا" : "Contact Us", href: `${root}/contact` },
  ];

  // Column C: Our Projects (selected published projects from CMS, limited to 4)
  const projectsHeading = settings?.footerProjectsHeading || (ar ? "مشاريعنا" : "Our Projects");
  const footerProjects = (copy.projects ?? []).slice(0, 4);

  // Column D: Contact
  const contactHeading = settings?.footerContactHeading || (ar ? "تواصل معنا" : "Contact");
  const hotline = settings?.hotline || "17087";
  const email = settings?.email;
  const address = settings?.address;
  const mapUrl = settings?.mapUrl || (address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : undefined);
  const callbackEnabled = settings?.callbackEnabled !== false;
  const callbackLabel = settings?.callbackLabel || (ar ? "طلب معاودة الاتصال ←" : "Request a Call Back →");

  // Legal Row
  const year = new Date().getFullYear();
  const copyrightText = copy.common?.rights || (ar ? `© ${year} إيمدج للتطوير العقاري. جميع الحقوق محفوظة.` : `© ${year} Image Developments. All rights reserved.`);

  return (
    <footer
      className={`site-footer mm-footer stage-pad ${lightBackground ? "site-footer--light mm-footer--light" : ""}`}
      style={{ backgroundColor: `rgb(${copy.backgrounds.footer})` }}
      role="contentinfo"
      aria-label={ar ? "تذييل الموقع" : "Site footer"}
    >
      <div className="site-footer-inner">
        <div className="footer-grid">
          {/* Column A: Brand */}
          <div className="footer-col footer-col--brand">
            <div className="footer-brand-logo">
              <Link href={root} aria-label="Image Developments">
                <BrandMark light={!lightBackground} />
              </Link>
            </div>
            <p className="footer-brand-desc">{brandDescription}</p>
            {socialLinks.length > 0 && (
              <div className="footer-brand-socials" aria-label={ar ? "وسائل التواصل الاجتماعي" : "Social media profiles"}>
                {socialLinks.map(s => (
                  <a
                    key={`${s.label}-${s.url}`}
                    href={s.url}
                    className="social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                  >
                    <SocialIcon label={s.label} svgIcon={s.svgIcon} />
                    <span className="social-label">{s.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column B: Explore */}
          <div className="footer-col footer-col--explore">
            <h2 className="footer-col-heading">{exploreHeading}</h2>
            <nav className="footer-links-nav" aria-label={exploreHeading}>
              {exploreLinks.map(link => (
                <Link key={link.href} href={link.href} className="footer-nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column C: Our Projects */}
          <div className="footer-col footer-col--projects">
            <h2 className="footer-col-heading">{projectsHeading}</h2>
            <nav className="footer-links-nav" aria-label={projectsHeading}>
              {footerProjects.map(p => (
                <Link
                  key={p.id ?? p.slug ?? p.name}
                  href={p.ctaUrl || `${root}/projects/${p.slug}`}
                  className="footer-project-link"
                >
                  {p.name}
                </Link>
              ))}
              <Link href={`${root}/projects`} className="footer-view-all-link">
                <span>{ar ? "عرض جميع المشاريع" : "View All Projects"}</span>
                <span className="footer-link-arrow" aria-hidden="true">{ar ? "←" : "→"}</span>
              </Link>
            </nav>
          </div>

          {/* Column D: Contact */}
          <div className="footer-col footer-col--contact">
            <h2 className="footer-col-heading">{contactHeading}</h2>
            <div className="footer-contact-details">
              <a
                href={`tel:${hotline}`}
                className="footer-contact-item footer-hotline-item"
                aria-label={`${ar ? "الخط الساخن" : "Hotline"} ${hotline}`}
              >
                <span className="footer-contact-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span className="footer-contact-text footer-ltr-text">
                  <strong className="footer-hotline-number">{hotline}</strong>
                  <span className="footer-hotline-badge">{ar ? "الخط الساخن" : "Hotline"}</span>
                </span>
              </a>

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="footer-contact-item footer-email-item"
                  aria-label={`Email ${email}`}
                >
                  <span className="footer-contact-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <span className="footer-contact-text footer-ltr-text">{email}</span>
                </a>
              )}

              {address && (
                <div className="footer-contact-item footer-address-item">
                  <span className="footer-contact-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className="footer-contact-text">{address}</span>
                </div>
              )}

              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-directions-link"
                >
                  <span>{ar ? "الاتجاهات على الخريطة" : "Get Directions"}</span>
                  <span className="footer-link-arrow" aria-hidden="true">↗</span>
                </a>
              )}

              {callbackEnabled && (
                <button
                  type="button"
                  className="footer-callback-btn"
                  data-enquiry-trigger
                  data-enquiry-type="callback"
                  data-source-cta="footer-callback"
                >
                  <span>{callbackLabel}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Legal Row */}
        <div className="footer-legal-row">
          <div className="footer-copyright">
            <span>{copyrightText}</span>
          </div>
          <div className="footer-legal-links">
            <Link href={`${root}/policy`} className="footer-legal-link">
              {ar ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <span className="footer-legal-sep" aria-hidden="true">•</span>
            <Link href={`${root}/terms`} className="footer-legal-link">
              {ar ? "الشروط والأحكام" : "Terms & Conditions"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function HomepageExperience({ copy }: { copy: HomeContent }) { return <><SmoothScroll /><SiteHeader copy={copy} /><main><PageBlocks blocks={pageBlocksFor(copy, "home")} builtins={{ HOME_HERO: <Hero copy={copy} />, HOME_PROJECTS: copy.visibility?.projects !== false && <ProjectShowcase copy={copy} label={pageBlockLabel(pageBlocksFor(copy, "home"), "HOME_PROJECTS", copy.locale)} />, HOME_LIVING: <LivingStory copy={copy} />, HOME_STATS: copy.newsJournalSection ? <HomeNewsJournal copy={copy} /> : <StatsStrip copy={copy} />, HOME_JOURNAL: <Journal copy={copy} />, CONTACT_FORM: <GlobalContactForm copy={copy} /> }} /></main><Footer copy={copy} /></>; }
