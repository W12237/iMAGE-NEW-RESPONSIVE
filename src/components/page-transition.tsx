"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { HomeContent } from "@/content/home";
import { BrandMark } from "./brand-mark";
import { HERO_TIMING, HERO_EASING } from "@/lib/hero-motion";

/* -------------------------------------------------------------------------- */
/*                                Types & Context                             */
/* -------------------------------------------------------------------------- */

export type TransitionState =
  | "idle"
  | "intro-logo"
  | "intro-montage"
  | "intro-expanding"
  | "covering"
  | "waiting"
  | "revealing";

interface PageTransitionContextValue {
  state: TransitionState;
  introActive: boolean;
  introPhase: "idle" | "logo" | "montage" | "expanding" | "done";
  isInitialCinematic: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  state: "idle",
  introActive: false,
  introPhase: "idle",
  isInitialCinematic: false,
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

/* -------------------------------------------------------------------------- */
/*                       Global Document Load Tracker                         */
/* -------------------------------------------------------------------------- */
/**
 * Track in-memory whether a full document intro has already completed.
 * When the user refreshes (F5 / Cmd+R), JavaScript memory resets, so
 * hasCompletedInitialIntro becomes false again. Internal navigation keeps memory alive.
 */
let hasCompletedInitialIntro = false;
let isLanguageSwitching = false;

/* -------------------------------------------------------------------------- */
/*                     Image Selection for Intro Montage                      */
/* -------------------------------------------------------------------------- */
function getMontageAssets(copy: HomeContent, isProjects?: boolean) {
  if (isProjects) {
    const centerImage =
      copy.projectsHero?.imageUrl ||
      copy.projectsHero?.image ||
      copy.projects[0]?.image ||
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88";

    const pool = copy.projects
      .map((p) => p.image)
      .filter((src): src is string => Boolean(src && src !== centerImage));

    const unique = Array.from(new Set(pool));
    const p0 = unique[0] || copy.hero.image || centerImage;
    const p1 = unique[1] || unique[0] || centerImage;
    const p3 = unique[2] || unique[0] || centerImage;
    const p4 = unique[3] || unique[1] || centerImage;

    return {
      centerImage,
      panels: [p0, p1, centerImage, p3, p4],
    };
  }

  const centerImage =
    copy.openingProject?.image ||
    copy.hero.image ||
    copy.projects[0]?.image ||
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=88";

  // Gather unique available project and lifestyle photos
  const pool = [
    copy.projects[1]?.image,
    copy.projects[2]?.image,
    copy.lifestyle?.image,
    copy.about?.milestones?.[0]?.image,
    copy.about?.milestones?.[1]?.image,
    copy.settings?.menuImage,
    copy.projects[0]?.image,
  ].filter((src): src is string => Boolean(src && src !== centerImage));

  const unique = Array.from(new Set(pool));

  const p0 = unique[0] || centerImage;
  const p1 = unique[1] || unique[0] || centerImage;
  const p3 = unique[2] || unique[0] || centerImage;
  const p4 = unique[3] || unique[1] || centerImage;

  return {
    centerImage,
    // [0: outer left, 1: inner left, 2: center (hero), 3: inner right, 4: outer right]
    panels: [p0, p1, centerImage, p3, p4],
  };
}

/* -------------------------------------------------------------------------- */
/*                          Page Transition Provider                          */
/* -------------------------------------------------------------------------- */
export function PageTransitionProvider({
  copy,
  children,
}: {
  copy: HomeContent;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // State management
  const [state, setState] = useState<TransitionState>("idle");
  const [introPhase, setIntroPhase] = useState<
    "idle" | "logo" | "montage" | "expanding" | "done"
  >("idle");
  const [isInitialCinematic, setIsInitialCinematic] = useState(false);

  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: 1440,
    height: 900,
  });

  const inFlightTargetRef = useRef<string | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathnameRef = useRef<string>(pathname);
  const isPopstateRef = useRef(false);

  const isHomepage = pathname === "/en" || pathname === "/ar" || pathname === "/";
  const isProjectsPage =
    pathname === "/en/projects" ||
    pathname === "/ar/projects" ||
    pathname === "/projects";

  const isCinematicPage =
    (isHomepage && copy.opening?.enabled !== false) ||
    (isProjectsPage && copy.projectsOpening?.enabled !== false);

  const { centerImage, panels } = getMontageAssets(copy, isProjectsPage);

  // Sync viewport measurements for rock-solid clipPath calculations
  useEffect(() => {
    const update = () => {
      setViewportDims({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  // Popstate detection (browser back / forward)
  useEffect(() => {
    const handlePopstate = () => {
      isPopstateRef.current = true;
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  // Expose transition state on window for automated verification audits
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __transitionState?: TransitionState }).__transitionState = state;
    }
  }, [state]);

  /* ------------------------------------------------------------------------ */
  /*            Document Initial Load Sequence (Homepage or Inner)            */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    // If user prefers reduced motion, skip all intros immediately
    if (prefersReducedMotion) {
      hasCompletedInitialIntro = true;
      isLanguageSwitching = false;
      setState("idle");
      setIntroPhase("done");
      return;
    }

    // Check if this mount was triggered by a language switch
    const langSwitching = isLanguageSwitching || sessionStorage.getItem("img_lang_switching") === "1";
    if (langSwitching) {
      isLanguageSwitching = false;
      hasCompletedInitialIntro = true;
      sessionStorage.removeItem("img_lang_switching");
      // Start in revealing state (curtain already covering) and reveal cleanly
      setState("revealing");
      const revealTimer = setTimeout(() => {
        setState("idle");
      }, 350);
      return () => clearTimeout(revealTimer);
    }

    // Fresh document load (direct visit or browser refresh)
    if (!hasCompletedInitialIntro) {
      if (isCinematicPage) {
        // Full Cinematic Introduction (Homepage or Projects Page)
        setIsInitialCinematic(true);
        setState("intro-logo");
        setIntroPhase("logo");

        // Lock scroll safely
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
        lenis?.stop();

        // PHASE A: Logo entrance (0 - 450ms)
        const tLogoFadeOut = setTimeout(() => {
          // PHASE B: Montage entrance (450ms - 1100ms)
          setState("intro-montage");
          setIntroPhase("montage");
        }, 450);

        // PHASE C: Central image expansion into hero (1100ms - 1950ms)
        const tExpansion = setTimeout(() => {
          setState("intro-expanding");
          setIntroPhase("expanding");
        }, 1100);

        // PHASE D & CLEANUP: Hero interface is fully revealed, overlay deactivated (1950ms)
        const tDone = setTimeout(() => {
          hasCompletedInitialIntro = true;
          setState("idle");
          setIntroPhase("done");
          document.body.style.overflow = prevOverflow;
          const currentLenis = (window as unknown as { lenis?: { start: () => void } }).lenis;
          currentLenis?.start();
        }, 1950);

        return () => {
          clearTimeout(tLogoFadeOut);
          clearTimeout(tExpansion);
          clearTimeout(tDone);
          document.body.style.overflow = prevOverflow;
        };
      } else {
        // Direct entry to inner page: Brief dignified brand reveal without 5-panel montage (~380ms)
        setState("revealing");
        const tInnerDone = setTimeout(() => {
          hasCompletedInitialIntro = true;
          setState("idle");
        }, 380);
        return () => clearTimeout(tInnerDone);
      }
    }
  }, [isCinematicPage, prefersReducedMotion]);

  /* ------------------------------------------------------------------------ */
  /*             Route Changes (Pathname Update on Client Navigation)         */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;

      // If navigation happened via browser back/forward, do not show blocking cover
      if (isPopstateRef.current) {
        isPopstateRef.current = false;
        inFlightTargetRef.current = null;
        setState("idle");
        return;
      }

      // If we were covering or waiting, reveal the new destination
      if (state === "covering" || state === "waiting") {
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        // Scroll to top cleanly while covered
        window.scrollTo(0, 0);

        setState("revealing");
        const revealTimer = setTimeout(() => {
          setState("idle");
          inFlightTargetRef.current = null;
        }, 340);

        return () => clearTimeout(revealTimer);
      }
    }
  }, [pathname, state]);

  /* ------------------------------------------------------------------------ */
  /*                     Global Link Click Interception                       */
  /* ------------------------------------------------------------------------ */
  const handleLinkClick = useCallback(
    (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore special clicks
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return;
      }

      // Ignore non-http links (mailto, tel, javascript)
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

      // Ignore same-page hash anchors (e.g. #developments, #about, #top)
      if (href.startsWith("#")) return;

      try {
        const targetUrl = new URL(href, window.location.href);

        // Only handle internal links to the same origin
        if (targetUrl.origin !== window.location.origin) return;

        // Ignore same page anchor navigation like /en#developments when on /en
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          targetUrl.hash
        ) {
          return;
        }

        // If target is literally the exact same URL, prevent reload and do nothing
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          !targetUrl.hash
        ) {
          e.preventDefault();
          return;
        }

        // Eligible internal navigation!
        e.preventDefault();

        // Check if this is a language switch navigation (e.g. /en -> /ar or /ar -> /en)
        const isLangSwitch =
          (pathname.startsWith("/en") && targetUrl.pathname.startsWith("/ar")) ||
          (pathname.startsWith("/ar") && targetUrl.pathname.startsWith("/en"));

        if (isLangSwitch) {
          isLanguageSwitching = true;
          try {
            sessionStorage.setItem("img_lang_switching", "1");
          } catch {
            /* ignore quota */
          }
        }

        // Latest destination wins
        inFlightTargetRef.current = targetUrl.pathname + targetUrl.search + targetUrl.hash;

        // Trigger short branded cover curtain (~220ms)
        setState("covering");

        // Clear existing safety timeout
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        // Once covered, perform router push
        const navTimer = setTimeout(() => {
          setState("waiting");
          router.push(targetUrl.pathname + targetUrl.search + targetUrl.hash);

          // Safety timeout in case destination hangs or errors (5s recovery)
          safetyTimeoutRef.current = setTimeout(() => {
            setState("idle");
            inFlightTargetRef.current = null;
          }, 5000);
        }, 220);

        return () => clearTimeout(navTimer);
      } catch {
        // Fallback to native navigation if URL parsing fails
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [handleLinkClick]);

  /* ------------------------------------------------------------------------ */
  /*               Panel Geometry Calculations (Phase B & C)                  */
  /* ------------------------------------------------------------------------ */
  const vw = viewportDims.width;
  const vh = viewportDims.height;
  const isMobile = vw < 768;

  const panelH = Math.min(vh * (isMobile ? 0.62 : 0.7), isMobile ? 480 : 640);
  const centerPanelW = Math.min(vw * (isMobile ? 0.84 : 0.23), isMobile ? 380 : 330);
  const sidePanelW = Math.min(vw * 0.16, 210);
  const gap = isMobile ? 0 : Math.max(12, Math.min(vw * 0.014, 20));

  // The center panel's bounding box relative to viewport
  const centerInsetY = Math.max(0, Math.round((vh - panelH) / 2));
  const centerInsetX = Math.max(0, Math.round((vw - centerPanelW) / 2));

  const centerInitialClip = `inset(${centerInsetY}px ${centerInsetX}px ${centerInsetY}px ${centerInsetX}px round 8px)`;
  const centerExpandedClip = "inset(0px 0px 0px 0px round 0px)";

  const introActive = state === "intro-logo" || state === "intro-montage" || state === "intro-expanding";

  return (
    <PageTransitionContext.Provider
      value={{
        state,
        introActive,
        introPhase,
        isInitialCinematic,
      }}
    >
      {/* Target Content */}
      <div className={`page-transition-content-shell ${introActive ? "is-intro-active" : ""}`}>
        {children}
      </div>

      {/* ================================================================== */}
      {/*               HOMEPAGE CINEMATIC INTRODUCTION OVERLAY              */}
      {/* ================================================================== */}
      {introActive && (
        <div
          className="intro-viewport-stage"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            overflow: "hidden",
            pointerEvents: state === "intro-expanding" ? "none" : "auto",
          }}
        >
          {/* Phase A: Brand Introduction Logo */}
          <AnimatePresence>
            {state === "intro-logo" && (
              <motion.div
                key="intro-brand-logo"
                className="intro-logo-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#152a20",
                  zIndex: 30,
                }}
              >
                <div
                  className="intro-logo-frame"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                    textAlign: "center",
                  }}
                >
                  <BrandMark light={true} />
                  {isProjectsPage && copy.projectsOpening?.headline && (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 0.85, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.3 }}
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "13px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(255, 255, 255, 0.78)",
                        fontWeight: 400,
                      }}
                    >
                      {copy.projectsOpening.headline}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background backdrop during montage */}
          <motion.div
            className="intro-montage-backdrop"
            initial={{ opacity: 1 }}
            animate={{
              opacity: state === "intro-expanding" ? 0 : 1,
            }}
            transition={{
              duration: HERO_TIMING.loaderExit.duration,
              ease: HERO_TIMING.loaderExit.ease,
            }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#152a20",
              zIndex: 10,
            }}
          />

          {/* Phase B: Image Composition Montage */}
          <div
            className="intro-montage-row"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: `${gap}px`,
              padding: "0 20px",
              zIndex: 15,
              pointerEvents: "none",
            }}
          >
            {/* Desktop Side Panels (Left) */}
            {!isMobile && (
              <>
                {/* Panel 0: Outer Left */}
                <motion.div
                  className="intro-side-panel intro-side-panel--outer"
                  initial={{ opacity: 0, y: 35, x: 0 }}
                  animate={{
                    opacity:
                      state === "intro-logo" ? 0 : state === "intro-expanding" ? 0 : 0.65,
                    y: state === "intro-logo" ? 35 : state === "intro-expanding" ? 20 : 0,
                    x: state === "intro-expanding" ? -35 : 0,
                  }}
                  transition={{
                    duration: state === "intro-expanding" ? 0.45 : 0.45,
                    delay: state === "intro-expanding" ? 0 : 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    width: `${sidePanelW}px`,
                    height: `${panelH * 0.88}px`,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "6px",
                  }}
                >
                  <Image src={panels[0]} alt="" fill sizes="20vw" priority className="object-cover" />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(10, 24, 16, 0.45)",
                    }}
                  />
                </motion.div>

                {/* Panel 1: Inner Left */}
                <motion.div
                  className="intro-side-panel intro-side-panel--inner"
                  initial={{ opacity: 0, y: 35, x: 0 }}
                  animate={{
                    opacity:
                      state === "intro-logo" ? 0 : state === "intro-expanding" ? 0 : 0.78,
                    y: state === "intro-logo" ? 35 : state === "intro-expanding" ? 15 : 0,
                    x: state === "intro-expanding" ? -20 : 0,
                  }}
                  transition={{
                    duration: state === "intro-expanding" ? 0.45 : 0.45,
                    delay: state === "intro-expanding" ? 0 : 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    width: `${sidePanelW}px`,
                    height: `${panelH * 0.94}px`,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "6px",
                  }}
                >
                  <Image src={panels[1]} alt="" fill sizes="20vw" priority className="object-cover" />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(10, 24, 16, 0.35)",
                    }}
                  />
                </motion.div>
              </>
            )}

            {/* Spacer placeholder for the central panel in the flex row layout */}
            <div
              style={{
                width: `${centerPanelW}px`,
                height: `${panelH}px`,
                visibility: "hidden",
                flexShrink: 0,
              }}
            />

            {/* Desktop Side Panels (Right) */}
            {!isMobile && (
              <>
                {/* Panel 3: Inner Right */}
                <motion.div
                  className="intro-side-panel intro-side-panel--inner"
                  initial={{ opacity: 0, y: 35, x: 0 }}
                  animate={{
                    opacity:
                      state === "intro-logo" ? 0 : state === "intro-expanding" ? 0 : 0.78,
                    y: state === "intro-logo" ? 35 : state === "intro-expanding" ? 15 : 0,
                    x: state === "intro-expanding" ? 20 : 0,
                  }}
                  transition={{
                    duration: state === "intro-expanding" ? 0.45 : 0.45,
                    delay: state === "intro-expanding" ? 0 : 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    width: `${sidePanelW}px`,
                    height: `${panelH * 0.94}px`,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "6px",
                  }}
                >
                  <Image src={panels[3]} alt="" fill sizes="20vw" priority className="object-cover" />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(10, 24, 16, 0.35)",
                    }}
                  />
                </motion.div>

                {/* Panel 4: Outer Right */}
                <motion.div
                  className="intro-side-panel intro-side-panel--outer"
                  initial={{ opacity: 0, y: 35, x: 0 }}
                  animate={{
                    opacity:
                      state === "intro-logo" ? 0 : state === "intro-expanding" ? 0 : 0.65,
                    y: state === "intro-logo" ? 35 : state === "intro-expanding" ? 20 : 0,
                    x: state === "intro-expanding" ? 35 : 0,
                  }}
                  transition={{
                    duration: state === "intro-expanding" ? 0.45 : 0.45,
                    delay: state === "intro-expanding" ? 0 : 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    width: `${sidePanelW}px`,
                    height: `${panelH * 0.88}px`,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "6px",
                  }}
                >
                  <Image src={panels[4]} alt="" fill sizes="20vw" priority className="object-cover" />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(10, 24, 16, 0.45)",
                    }}
                  />
                </motion.div>
              </>
            )}
          </div>

          {/* Phase C: Central Panel Expanding into Hero */}
          {/* 
            The central aperture container covers 100vw x 100vh with the EXACT hero image.
            During Phase B: it is clipped to the center panel rectangle.
            During Phase C: it smoothly expands its clipPath to 100% full screen.
            Because the image inside is fixed full-screen cover, the focal point
            never jumps, never shifts, and seamlessly aligns with the hero underneath!
          */}
          <motion.div
            className="intro-central-expansion-panel"
            initial={{
              clipPath: centerInitialClip,
              opacity: 0,
              y: 35,
            }}
            animate={{
              clipPath:
                state === "intro-expanding" ? centerExpandedClip : centerInitialClip,
              opacity: state === "intro-logo" ? 0 : 1,
              y: 0,
            }}
            transition={{
              clipPath: {
                duration: HERO_TIMING.loaderExit.duration,
                ease: HERO_TIMING.loaderExit.ease,
              },
              opacity: {
                duration: 0.38,
                ease: HERO_EASING,
              },
              y: {
                duration: 0.45,
                ease: HERO_EASING,
              },
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 20,
              overflow: "hidden",
              boxShadow:
                state === "intro-expanding"
                  ? "none"
                  : "0 25px 60px rgba(0, 0, 0, 0.45)",
            }}
          >
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "50% 50%",
              }}
              initial={{ scale: HERO_TIMING.background.initialScale }}
              animate={{
                scale:
                  state === "intro-expanding"
                    ? HERO_TIMING.background.targetScale
                    : HERO_TIMING.background.initialScale,
              }}
              transition={{
                duration: HERO_TIMING.background.duration,
                delay: HERO_TIMING.background.delay,
                ease: HERO_TIMING.background.ease,
              }}
            >
              <Image
                src={centerImage}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </motion.div>
            {/* Subtle wash that matches hero wash during expansion */}
            <div
              className="mm-hero-wash"
              style={{
                position: "absolute",
                inset: 0,
                opacity: state === "intro-expanding" ? 1 : 0.15,
                transition: "opacity 0.6s ease",
              }}
            />
          </motion.div>
        </div>
      )}

      {/* ================================================================== */}
      {/*         SHORT INTERNAL ROUTE & LANGUAGE TRANSITION CURTAIN         */}
      {/* ================================================================== */}
      {(state === "covering" || state === "waiting" || state === "revealing") && (
        <motion.div
          className="route-transition-curtain"
          role="status"
          aria-live="polite"
          aria-label={copy.locale === "ar" ? "جارِ التحميل…" : "Loading…"}
          initial={{
            clipPath: state === "revealing" ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
          }}
          animate={{
            clipPath:
              state === "covering" || state === "waiting"
                ? "inset(0% 0% 0% 0%)"
                : "inset(100% 0% 0% 0%)",
          }}
          transition={{
            duration: state === "covering" ? 0.22 : 0.34,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            backgroundColor: "#152a20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="route-transition-logo"
          >
            <BrandMark light={true} />
          </motion.div>
        </motion.div>
      )}
    </PageTransitionContext.Provider>
  );
}
