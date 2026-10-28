import { describe, it, expect } from "vitest";
import { HERO_TIMING, HERO_EASING, APERTURE_EASING } from "./hero-motion";

describe("Hero Motion Specification & Timeline Choreography", () => {
  it("defines easing curves conforming to restrained luxury motion design", () => {
    expect(HERO_EASING).toEqual([0.22, 1, 0.36, 1]);
    expect(APERTURE_EASING).toEqual([0.16, 1, 0.3, 1]);
  });

  it("coordinates the loader exit phase (0-800ms)", () => {
    expect(HERO_TIMING.loaderExit.delay).toBe(0);
    expect(HERO_TIMING.loaderExit.duration).toBe(0.8);
    expect(HERO_TIMING.loaderExit.ease).toEqual(APERTURE_EASING);
  });

  it("coordinates the background settlement (200-1500ms) with subtle scale (1.035 -> 1.0)", () => {
    expect(HERO_TIMING.background.delay).toBe(0.2);
    expect(HERO_TIMING.background.duration).toBe(1.3);
    expect(HERO_TIMING.background.initialScale).toBe(1.035);
    expect(HERO_TIMING.background.targetScale).toBe(1.0);
    const finishTime = HERO_TIMING.background.delay + HERO_TIMING.background.duration;
    expect(finishTime).toBeCloseTo(1.5, 2);
  });

  it("coordinates navbar visibility (450-1050ms)", () => {
    expect(HERO_TIMING.navbar.delay).toBe(0.45);
    expect(HERO_TIMING.navbar.duration).toBe(0.6);
    const finishTime = HERO_TIMING.navbar.delay + HERO_TIMING.navbar.duration;
    expect(finishTime).toBeCloseTo(1.05, 2);
  });

  it("coordinates eyebrow entrance (650-1300ms)", () => {
    expect(HERO_TIMING.eyebrow.delay).toBe(0.65);
    expect(HERO_TIMING.eyebrow.duration).toBe(0.65);
    expect(HERO_TIMING.eyebrow.yDesktop).toBeGreaterThanOrEqual(16);
    expect(HERO_TIMING.eyebrow.yDesktop).toBeLessThanOrEqual(24);
    expect(HERO_TIMING.eyebrow.yMobile).toBeLessThan(HERO_TIMING.eyebrow.yDesktop);
  });

  it("coordinates heading entrance (850-1600ms) preserving connected typography", () => {
    expect(HERO_TIMING.heading.delay).toBe(0.85);
    expect(HERO_TIMING.heading.duration).toBe(0.75);
    expect(HERO_TIMING.heading.yDesktop).toBeGreaterThanOrEqual(16);
    expect(HERO_TIMING.heading.yDesktop).toBeLessThanOrEqual(24);
    expect(HERO_TIMING.heading.yMobile).toBeLessThan(HERO_TIMING.heading.yDesktop);
  });

  it("coordinates description note entrance (1100-1750ms)", () => {
    expect(HERO_TIMING.description.delay).toBe(1.1);
    expect(HERO_TIMING.description.duration).toBe(0.65);
    expect(HERO_TIMING.description.yMobile).toBeLessThan(HERO_TIMING.description.yDesktop);
  });

  it("coordinates CTA buttons (1400-2050ms) with a 100-140ms stagger", () => {
    expect(HERO_TIMING.ctaPrimary.delay).toBe(1.4);
    expect(HERO_TIMING.ctaPrimary.duration).toBe(0.55);
    expect(HERO_TIMING.ctaSecondary.delay).toBe(1.52);
    expect(HERO_TIMING.ctaSecondary.duration).toBe(0.55);

    const stagger = HERO_TIMING.ctaSecondary.delay - HERO_TIMING.ctaPrimary.delay;
    expect(stagger).toBeCloseTo(0.12, 2); // 120ms stagger
    expect(stagger).toBeGreaterThanOrEqual(0.1);
    expect(stagger).toBeLessThanOrEqual(0.14);
  });

  it("coordinates scroll indicator entrance (1700-2250ms)", () => {
    expect(HERO_TIMING.scrollIndicator.delay).toBe(1.7);
    expect(HERO_TIMING.scrollIndicator.duration).toBe(0.55);
    const finishTime = HERO_TIMING.scrollIndicator.delay + HERO_TIMING.scrollIndicator.duration;
    expect(finishTime).toBeCloseTo(2.25, 2);
  });

  it("ensures total reveal completes between 2.0s and 2.4s without dead pauses", () => {
    const totalDuration = HERO_TIMING.scrollIndicator.delay + HERO_TIMING.scrollIndicator.duration;
    expect(totalDuration).toBeGreaterThanOrEqual(2.0);
    expect(totalDuration).toBeLessThanOrEqual(2.4);
  });

  it("ensures continuous overlapping phases throughout the sequence", () => {
    // Each phase begins before the preceding phase completes
    expect(HERO_TIMING.background.delay).toBeLessThan(HERO_TIMING.loaderExit.duration);
    expect(HERO_TIMING.navbar.delay).toBeLessThan(HERO_TIMING.loaderExit.duration);
    expect(HERO_TIMING.eyebrow.delay).toBeLessThan(HERO_TIMING.navbar.delay + HERO_TIMING.navbar.duration);
    expect(HERO_TIMING.heading.delay).toBeLessThan(HERO_TIMING.eyebrow.delay + HERO_TIMING.eyebrow.duration);
    expect(HERO_TIMING.description.delay).toBeLessThan(HERO_TIMING.heading.delay + HERO_TIMING.heading.duration);
    expect(HERO_TIMING.ctaPrimary.delay).toBeLessThan(HERO_TIMING.description.delay + HERO_TIMING.description.duration);
    expect(HERO_TIMING.scrollIndicator.delay).toBeLessThan(HERO_TIMING.ctaSecondary.delay + HERO_TIMING.ctaSecondary.duration);
  });
});
