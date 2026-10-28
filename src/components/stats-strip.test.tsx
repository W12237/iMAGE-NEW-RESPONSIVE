import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StatsStrip } from "./stats-strip";
import type { HomeContent } from "@/content/home";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...props }: any) => {
    void fill;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} data-testid="stat-image" {...props} />
    );
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, role, initial, whileInView, viewport, transition, ...props }: any) => {
      void initial; void whileInView; void viewport; void transition;
      return (
        <div className={className} role={role} {...props}>
          {children}
        </div>
      );
    },
  },
  useReducedMotion: () => false,
}));

const mockContentEn: HomeContent = {
  locale: "en",
  dir: "ltr",
  backgrounds: {
    opening: "255, 255, 255",
    hero: "255, 255, 255",
    about: "255, 255, 255",
    projects: "255, 255, 255",
    lifestyle: "255, 255, 255",
    stats: "255, 255, 255",
    journal: "255, 255, 255",
    closing: "255, 255, 255",
    footer: "255, 255, 255",
  },
  nav: [],
  hero: { eyebrow: "", title: [""], note: "", scroll: "" },
  about: { enabled: true, eyebrow: "", title: "", intro: "", milestones: [] },
  projects: [],
  inquiryProjects: [],
  lifestyle: { eyebrow: "", title: "" },
  stats: [
    { value: "18+", label: "Years shaping distinctive places" },
    { value: "4.2M", label: "Square metres in development" },
    { value: "9,500", label: "Homes thoughtfully envisioned" },
  ],
  statsSection: {
    enabled: true,
    label: "About Image",
    heading: "Shaping places with enduring perspective.",
    description: "For nearly two decades, Image Developments has crafted thoughtful residential environments.",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    imageAlt: "Architectural craft at Image Developments",
    focalPoint: "center",
    ctaLabel: "Discover Our Story",
    ctaUrl: "/about",
    stats: [
      { value: "18+", label: "Years shaping distinctive places" },
      { value: "4.2M", label: "Square metres in development" },
      { value: "9,500", label: "Homes thoughtfully envisioned" },
    ],
  },
  journal: { eyebrow: "", title: "", stories: [] },
  closing: { eyebrow: "", title: "", cta: "" },
  common: {
    projects: "Projects",
    explore: "Explore",
    menu: "Menu",
    close: "Close",
    language: "العربية",
    contact: "Contact",
    rights: "Rights",
  },
  visibility: { projects: true, stats: true },
};

const mockContentAr: HomeContent = {
  ...mockContentEn,
  locale: "ar",
  dir: "rtl",
  stats: [
    { value: "+18", label: "عاماً من الريادة في صناعة المكان" },
    { value: "4.2M", label: "متر مربع قيد التطوير والإنجاز" },
    { value: "9,500", label: "منزل صُمم بعناية للحياة" },
  ],
  statsSection: {
    enabled: true,
    label: "عن إيمدج",
    heading: "نصنع مجتمعات مدروسة ذات قيمة تدوم.",
    description: "على مدار ما يقارب عقدين من الزمان، تبتكر إيمدج للتطوير العقاري بيئات سكنية متكاملة.",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    imageAlt: "التميز المعماري في إيمدج",
    focalPoint: "center",
    ctaLabel: "اكتشف قصتنا",
    ctaUrl: "/about",
    stats: [
      { value: "+18", label: "عاماً من الريادة في صناعة المكان" },
      { value: "4.2M", label: "متر مربع قيد التطوير والإنجاز" },
      { value: "9,500", label: "منزل صُمم بعناية للحياة" },
    ],
  },
};

describe("StatsStrip Component", () => {
  it("renders English composition with heading, label, description, CTA, image, and stats", () => {
    const html = renderToStaticMarkup(<StatsStrip copy={mockContentEn} />);

    expect(html).toContain("About Image");
    expect(html).toContain("Shaping places with enduring perspective.");
    expect(html).toContain("For nearly two decades, Image Developments has crafted thoughtful residential environments.");

    expect(html).toContain('href="/en/about"');
    expect(html).toContain("Discover Our Story");
    expect(html).toContain("→");

    expect(html).toContain("photo-1600585154340-be6161a56a0c");

    expect(html).toContain("18+");
    expect(html).toContain("Years shaping distinctive places");
    expect(html).toContain("4.2M");
    expect(html).toContain("9,500");
  });

  it("renders Arabic composition with RTL content and mirrored CTA arrow", () => {
    const html = renderToStaticMarkup(<StatsStrip copy={mockContentAr} />);

    expect(html).toContain("عن إيمدج");
    expect(html).toContain("نصنع مجتمعات مدروسة ذات قيمة تدوم.");
    expect(html).toContain("على مدار ما يقارب عقدين من الزمان، تبتكر إيمدج للتطوير العقاري بيئات سكنية متكاملة.");

    expect(html).toContain('href="/ar/about"');
    expect(html).toContain("اكتشف قصتنا");
    expect(html).toContain("←");

    expect(html).toContain("+18");
    expect(html).toContain("عاماً من الريادة في صناعة المكان");
  });

  it("renders lead introduction and optional supporting paragraph when two paragraphs exist", () => {
    const multiParaCopy: HomeContent = {
      ...mockContentEn,
      statsSection: {
        ...mockContentEn.statsSection!,
        description: "First paragraph concise intro.\n\nSecond supporting paragraph elaborating on architectural ethos.",
      },
    };
    const html = renderToStaticMarkup(<StatsStrip copy={multiParaCopy} />);

    expect(html).toContain("First paragraph concise intro.");
    expect(html).toContain("Second supporting paragraph elaborating on architectural ethos.");
    expect(html).toContain("company-intro-lead");
    expect(html).toContain("company-intro-supporting");
  });

  it("renders Explore Our Journey CTA pointing to #about when on About page", () => {
    const html = renderToStaticMarkup(<StatsStrip copy={mockContentEn} isAboutPage={true} />);

    expect(html).toContain("Explore Our Journey");
    expect(html).toContain('href="#about"');
  });

  it("renders localized Explore Our Journey in Arabic on About page", () => {
    const html = renderToStaticMarkup(<StatsStrip copy={mockContentAr} isAboutPage={true} />);

    expect(html).toContain("استكشف مسيرتنا");
    expect(html).toContain('href="#about"');
  });

  it("renders company brochure link when available in settings", () => {
    const brochureCopy: HomeContent = {
      ...mockContentEn,
      settings: {
        email: "info@example.com",
        phone: "+2010000000",
        address: "Cairo, Egypt",
        menuImage: "/img.jpg",
        menuImageAlt: "Alt",
        socials: [],
        seoTitle: "Title",
        seoDescription: "Desc",
        companyBrochureUrl: "https://example.com/brochure.pdf",
      },
    };
    const html = renderToStaticMarkup(<StatsStrip copy={brochureCopy} />);

    expect(html).toContain('href="https://example.com/brochure.pdf"');
    expect(html).toContain("Company Brochure");
  });

  it("respects visibility toggle", () => {
    const hiddenCopy: HomeContent = {
      ...mockContentEn,
      visibility: { projects: true, stats: false },
    };
    const html = renderToStaticMarkup(<StatsStrip copy={hiddenCopy} />);
    expect(html).toBe("");
  });

  it("handles missing optional label and description gracefully without layout gaps", () => {
    const sparseCopy: HomeContent = {
      ...mockContentEn,
      statsSection: {
        enabled: true,
        heading: "Standalone Impact",
        stats: [{ value: "100%", label: "Satisfaction" }],
      },
    };
    const html = renderToStaticMarkup(<StatsStrip copy={sparseCopy} />);
    expect(html).toContain("Standalone Impact");
    expect(html).not.toContain("About Image");
    expect(html).toContain("100%");
  });
});
