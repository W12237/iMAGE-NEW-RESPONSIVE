"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HomeContent, NavItemContent } from "@/content/home";
import { BrandMark } from "./brand-mark";
import { usePageTransition } from "./page-transition";
import { useEnquiryModal } from "./enquiry-provider";

type MotionLinkType = React.ComponentType<
  React.ComponentProps<typeof Link> & {
    initial?: import("framer-motion").MotionProps["initial"];
    animate?: import("framer-motion").MotionProps["animate"];
    transition?: import("framer-motion").MotionProps["transition"];
  }
>;

const motionObj = motion as unknown as {
  create?: (c: typeof Link) => MotionLinkType;
  (c: typeof Link): MotionLinkType;
};

const MotionLink: MotionLinkType =
  typeof motionObj.create === "function"
    ? motionObj.create(Link)
    : typeof motionObj === "function"
      ? motionObj(Link)
      : (Link as unknown as MotionLinkType);

export type PublicPage =
  | "home"
  | "developments"
  | "projects"
  | "journal"
  | "about"
  | "history"
  | "team"
  | "partners"
  | "careers"
  | "contact"
  | "policy"
  | "terms";

export function SiteHeader({
  copy,
  page = "home",
  initialOpen = false,
}: {
  copy: HomeContent;
  page?: PublicPage;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const reduce = useReducedMotion();
  const { isInitialCinematic, introPhase } = usePageTransition();
  const { openEnquiry } = useEnquiryModal();
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const other = `/${copy.locale === "en" ? "ar" : "en"}${page === "home" ? "" : `/${page}`}`;
  const otherWithQuery = `${other}${searchQuery}`;
  const home = `/${copy.locale}`;
  const projectsHref = `/${copy.locale}/projects`;
  const projectsLabel = copy.locale === "ar" ? "المشاريع" : "Projects";

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      setSearchQuery(window.location.search);
    }
  }, []);

  const resolveHref = (href: string, external?: boolean) => {
    if (external || /^(?:https?:|mailto:|tel:)/i.test(href)) return href;
    if (href === "#top") return home;
    if (href === "#developments" || href === "/developments" || href === "/projects") return `/${copy.locale}/projects`;
    if (href === "#journal" || href === "/journal") return `/${copy.locale}/journal`;
    if (href === "#about" || href === "/about") return `/${copy.locale}/about`;
    if (href === "/history") return `/${copy.locale}/history`;
    if (href === "/team") return `/${copy.locale}/team`;
    if (href === "/partners") return `/${copy.locale}/partners`;
    if (href === "/careers") return `/${copy.locale}/careers`;
    if (href === "#contact" || href === "/contact") return `/${copy.locale}/contact`;
    if (href === "/policy") return `/${copy.locale}/policy`;
    if (href === "/terms") return `/${copy.locale}/terms`;
    if (href.startsWith("#")) return page === "home" ? href : `${home}${href}`;
    if (href === `/${copy.locale}` || href.startsWith(`/${copy.locale}/`)) return href;
    if (href === "/") return home;
    if (href.startsWith("/")) return `/${copy.locale}${href}`;
    return href;
  };

  const isItemActive = (href: string) => {
    if (page === "home") return href === "#top" || href === "/" || href === `/${copy.locale}`;
    if (page === "about") return href.includes("/about") || href === "#about";
    if (page === "projects" || page === "developments") return href.includes("/projects") || href.includes("/developments");
    if (page === "careers") return href.includes("/careers");
    if (page === "contact") return href.includes("/contact") || href === "#contact";
    if (page === "journal") return href.includes("/journal") || href === "#journal";
    if (page === "history") return href.includes("/history");
    if (page === "team") return href.includes("/team");
    if (page === "partners") return href.includes("/partners");
    return false;
  };

  const settings = copy.settings ?? {
    email: "hello@imagedevelopments.com",
    address: "Cairo · Egypt",
    menuImage: "/cms/about-detail.webp",
    menuImageAlt: "Warm architectural interior",
    menuImageFocalPoint: "center",
  };

  const defaultMenuImage = settings.menuImage || "/cms/about-detail.webp";
  const defaultMenuAlt = settings.menuImageAlt || "Image Developments";
  const defaultMenuFocalPoint = settings.menuImageFocalPoint || "center";

  // Identify current page preview image if available
  const currentActiveItem = copy.nav?.find(item => isItemActive(item.href) && item.previewImage);

  const initialPreview = {
    url: currentActiveItem?.previewImage || defaultMenuImage,
    focalPoint: currentActiveItem?.focalPoint || defaultMenuFocalPoint,
    alt: currentActiveItem?.label || defaultMenuAlt,
  };

  const [preview, setPreview] = useState(initialPreview);
  const [baseImage, setBaseImage] = useState(initialPreview.url);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const focusedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsMoreOpen(false);
      setPreview(initialPreview);
      setBaseImage(initialPreview.url);
      focusedRef.current = null;
      hoveredRef.current = null;
    } else {
      setPreview(initialPreview);
      setBaseImage(initialPreview.url);
    }
  }, [open, initialPreview.url, initialPreview.focalPoint]);

  useEffect(() => {
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    if (open) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
      // Delay focus slightly so Framer Motion initial render mounts
      const focusTimer = setTimeout(() => {
        closeRef.current?.focus();
      }, 50);
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          return;
        }

        // Trap focus inside modal overlay
        if (event.key === "Tab" && open && menuOverlayRef.current) {
          const focusables = menuOverlayRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", onKey);
      return () => {
        clearTimeout(focusTimer);
        document.body.style.overflow = "";
        lenis?.start();
        window.removeEventListener("keydown", onKey);
      };
    } else {
      document.body.style.overflow = "";
      lenis?.start();
      if (triggerRef.current && typeof triggerRef.current.focus === "function") {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLinkHover = (item: NavItemContent) => {
    const itemId = item.id || item.href;
    if (hoveredRef.current === itemId) return;
    hoveredRef.current = itemId;
    const targetUrl = item.previewImage || defaultMenuImage;
    const targetFocalPoint = item.focalPoint || defaultMenuFocalPoint;
    setPreview({
      url: targetUrl,
      focalPoint: targetFocalPoint,
      alt: item.label,
    });
  };

  const onLinkFocus = (item: NavItemContent) => {
    const itemId = item.id || item.href;
    focusedRef.current = itemId;
    const targetUrl = item.previewImage || defaultMenuImage;
    const targetFocalPoint = item.focalPoint || defaultMenuFocalPoint;
    setPreview({
      url: targetUrl,
      focalPoint: targetFocalPoint,
      alt: item.label,
    });
  };

  const onLinkBlur = () => {
    focusedRef.current = null;
    if (!hoveredRef.current) {
      setPreview(initialPreview);
    }
  };

  const onNavMouseLeave = () => {
    hoveredRef.current = null;
    if (!focusedRef.current) {
      setPreview(initialPreview);
    }
  };

  const navItems = copy.nav?.filter((item) => item.visible !== false) || [];
  const primaryNav = navItems.filter((item) => (item.group || "primary") === "primary");
  const secondaryNav = navItems.filter((item) => item.group === "secondary");

  const renderNavItem = (item: NavItemContent, i: number, isSecondary = false) => {
    const resolved = resolveHref(item.href, item.external);
    const isExternal = item.external || /^(?:https?:|mailto:|tel:)/i.test(item.href);
    const isActive = isItemActive(item.href);
    const linkKey = item.id || `${item.href}-${item.label}`;

    const commonProps = {
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") onLinkHover(item);
      },
      onFocus: () => onLinkFocus(item),
      onBlur: onLinkBlur,
      onClick: () => setOpen(false),
      className: `${isSecondary ? "menu-nav-secondary" : ""} ${isActive ? "is-current" : ""}`,
      "aria-current": isActive ? ("page" as const) : undefined,
    };

    const contentMarkup = (
      <>
        <span className="menu-nav-label">{item.label}</span>
        {isActive && <span className="menu-nav-current-dot" aria-hidden="true" />}
      </>
    );

    if (isExternal) {
      return (
        <motion.a
          key={linkKey}
          href={resolved}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.12 + i * 0.035 }}
          {...commonProps}
        >
          {contentMarkup}
        </motion.a>
      );
    }

    return (
      <MotionLink
        key={linkKey}
        href={resolved}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.12 + i * 0.035 }}
        {...commonProps}
      >
        {contentMarkup}
      </MotionLink>
    );
  };

  const showHeader = !isInitialCinematic || introPhase === "expanding" || introPhase === "done";
  const isHeroPage = page === "home" || page === "projects" || page === "about";
  const isInternal = !isHeroPage;
  const isLightLogo = !scrolled && isHeroPage;

  return (
    <>
      {/* Header keeping brand layout and buttons */}
      <motion.header
        className={`site-header ${scrolled ? "is-scrolled" : ""} ${isInternal ? "is-internal" : ""} ${isHeroPage ? "is-hero-header" : ""}`}
        initial={isInitialCinematic && !reduce ? { opacity: 0 } : undefined}
        animate={showHeader ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: isInitialCinematic && !reduce ? 0.45 : 0,
          delay: isInitialCinematic && !reduce ? 0.1 : 0,
        }}
      >
        <Link href={home} className="header-logo" aria-label="Image Developments home">
          <BrandMark light={isLightLogo} />
        </Link>
        <div className="header-actions">
          <Link href={other} className="language-link">
            {copy.common.language}
          </Link>
          <a
            href="tel:17087"
            className="header-hotline"
            aria-label={copy.locale === "ar" ? "اتصل بالخط الساخن 17087" : "Call hotline 17087"}
            title="17087"
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
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="header-hotline-num">17087</span>
          </a>
          <button
            type="button"
            className="header-enquire-btn"
            onClick={() => {
              if (open) setOpen(false);
              openEnquiry({ enquiryType: "callback", sourceCta: "navbar" });
            }}
            aria-label={copy.locale === "ar" ? "اطلب اتصالاً" : "Request a Call Back"}
          >
            <span className="header-enquire-full">{copy.locale === "ar" ? "اطلب اتصالاً" : "Request a Call Back"}</span>
            <span className="header-enquire-short">{copy.locale === "ar" ? "اتصال" : "Call Back"}</span>
          </button>
          {page !== "projects" && (
            <Link
              href={projectsHref}
              className="header-projects"
              aria-label={projectsLabel}
              title={projectsLabel}
            >
              <span aria-hidden="true">{copy.dir === "rtl" ? "←" : "→"}</span>
            </Link>
          )}
          <button
            className="menu-button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpen(true);
            }}
            aria-label={copy.common.menu}
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      {/* Full-screen Circular Reveal Overlay Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              ref={menuOverlayRef}
              className="menu-overlay"
              role="dialog"
              aria-modal="true"
              aria-label={copy.common.menu}
              dir={copy.dir}
              data-lenis-prevent="true"
              initial={{
                clipPath: copy.dir === "rtl" ? "circle(0% at 7% 5%)" : "circle(0% at 93% 5%)",
                scale: 0.97,
              }}
              animate={{
                clipPath: copy.dir === "rtl" ? "circle(150% at 7% 5%)" : "circle(150% at 93% 5%)",
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.6, ease: [0.76, 0, 0.24, 1] }}
            >
              <div className="menu-top">
                <div className="menu-controls-group" dir="ltr">
                  <button
                    ref={closeRef}
                    className="menu-close"
                    onClick={() => setOpen(false)}
                    aria-label={copy.common.close}
                  >
                    ×
                  </button>
                  <Link
                    href={otherWithQuery}
                    className="menu-language"
                    onClick={() => setOpen(false)}
                    aria-label={copy.locale === "ar" ? "Switch to English" : "التبديل إلى اللغة العربية"}
                  >
                    {copy.locale === "ar" ? "English" : "العربية"}
                  </Link>
                </div>
              </div>

              <div className="menu-grid">
                <nav
                  className="menu-nav"
                  aria-label="Main navigation"
                  onMouseLeave={onNavMouseLeave}
                >
                  <div className="menu-nav-list">
                    {primaryNav.map((item, i) => renderNavItem(item, i, false))}

                    {secondaryNav.length > 0 && (
                      <div className="menu-more-wrap">
                        <button
                          type="button"
                          className="menu-more-button"
                          aria-expanded={isMoreOpen}
                          aria-controls="menu-secondary-nav"
                          onClick={() => setIsMoreOpen((v) => !v)}
                        >
                          <span>{copy.locale === "ar" ? "المزيد من الصفحات" : "More Pages"}</span>
                          <svg
                            className={`menu-more-chevron ${isMoreOpen ? "is-expanded" : ""}`}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        <AnimatePresence initial={false}>
                          {isMoreOpen && (
                            <motion.div
                              id="menu-secondary-nav"
                              className="menu-secondary-list"
                              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              transition={{ duration: reduce ? 0 : 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                              {secondaryNav.map((item, idx) =>
                                renderNavItem(item, primaryNav.length + idx, true)
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </nav>

                {/* Arched Architectural Menu Image Preview Panel with Smooth Restrained Crossfade */}
                <motion.div
                  className="menu-image"
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reduce ? 0 : 0.2, duration: 0.7 }}
                >
                  {/* Base background layer ensures zero flashing to blank background on crossfades */}
                  <div
                    className="menu-image-bg"
                    style={{
                      backgroundImage: `url(${baseImage})`,
                      backgroundPosition: preview.focalPoint,
                    }}
                  />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={preview.url}
                      className="menu-image-active"
                      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduce ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.28, ease: "easeInOut" }}
                      onAnimationComplete={() => setBaseImage(preview.url)}
                    >
                      <Image
                        src={preview.url}
                        alt={preview.alt}
                        fill
                        sizes="38vw"
                        priority
                        style={{
                          objectFit: "cover",
                          objectPosition: preview.focalPoint,
                        }}
                        onError={() => {
                          setPreview({
                            url: defaultMenuImage,
                            focalPoint: defaultMenuFocalPoint,
                            alt: defaultMenuAlt,
                          });
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="menu-footer">
                <div className="menu-mobile-cta">
                  <button
                    type="button"
                    className="menu-callback-btn"
                    onClick={() => {
                      setOpen(false);
                      openEnquiry({ enquiryType: "callback", sourceCta: "mobile-menu" });
                    }}
                    aria-label={copy.locale === "ar" ? "اطلب اتصالاً" : "Request a Call Back"}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{copy.locale === "ar" ? "اطلب اتصالاً" : "Request a Call Back"}</span>
                  </button>
                </div>

                <div className="menu-footer-contact">
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  <a
                    href="tel:17087"
                    className="menu-hotline-link"
                    aria-label={copy.locale === "ar" ? "اتصل بالخط الساخن 17087" : "Call hotline 17087"}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{copy.locale === "ar" ? "الخط الساخن: 17087" : "Hotline: 17087"}</span>
                  </a>
                </div>

                <div className="menu-legal-links">
                  <Link href={`/${copy.locale}/policy`} onClick={() => setOpen(false)}>
                    {copy.locale === "ar" ? "السياسة" : "Policy"}
                  </Link>
                  <span aria-hidden="true" className="menu-legal-dot">·</span>
                  <Link href={`/${copy.locale}/terms`} onClick={() => setOpen(false)}>
                    {copy.locale === "ar" ? "الشروط" : "Terms"}
                  </Link>
                </div>

                <span className="menu-address">{settings.address}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
