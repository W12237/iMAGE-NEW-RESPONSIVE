/**
 * Shared Motion Design Specification for Loader-to-Hero Reveal
 *
 * Coordinates the seamless transition from the document loader exit into the hero section.
 * All timeline values are relative to the start of the loader's exit (t = 0),
 * when introPhase transitions to "expanding".
 *
 * Specification target: ~2.0 - 2.4s total reveal sequence with overlapping stages.
 */

export const HERO_EASING = [0.22, 1, 0.36, 1] as const;
export const APERTURE_EASING = [0.16, 1, 0.3, 1] as const;

export const HERO_TIMING = {
  // 1. Loader aperture expansion (0–800ms)
  loaderExit: {
    delay: 0,
    duration: 0.8,
    ease: APERTURE_EASING,
  },
  // 2. Hero background settlement (200–1500ms)
  background: {
    delay: 0.2,
    duration: 1.3,
    initialScale: 1.035,
    targetScale: 1.0,
    ease: HERO_EASING,
  },
  // 3. Navbar visibility (450–1050ms)
  navbar: {
    delay: 0.45,
    duration: 0.6,
    ease: HERO_EASING,
  },
  // 4. Eyebrow / supporting label (650–1300ms)
  eyebrow: {
    delay: 0.65,
    duration: 0.65,
    yDesktop: 20,
    yMobile: 14,
    ease: HERO_EASING,
  },
  // 5. Main heading (850–1600ms)
  heading: {
    delay: 0.85,
    duration: 0.75,
    yDesktop: 24,
    yMobile: 16,
    ease: HERO_EASING,
  },
  // 6. Description / Note (1100–1750ms)
  description: {
    delay: 1.1,
    duration: 0.65,
    yDesktop: 18,
    yMobile: 12,
    ease: HERO_EASING,
  },
  // 7. Primary CTA Button (1400–1950ms)
  ctaPrimary: {
    delay: 1.4,
    duration: 0.55,
    yDesktop: 12,
    yMobile: 8,
    ease: HERO_EASING,
  },
  // 8. Secondary CTA Button (1520–2070ms, 120ms stagger)
  ctaSecondary: {
    delay: 1.52,
    duration: 0.55,
    yDesktop: 12,
    yMobile: 8,
    ease: HERO_EASING,
  },
  // 9. Scroll indicator (1700–2250ms)
  scrollIndicator: {
    delay: 1.7,
    duration: 0.55,
    ease: HERO_EASING,
  },
} as const;
