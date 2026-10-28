import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { HomeContent } from "@/content/home";
import { HomepageExperience } from "./homepage-experience";

vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    void fill;
    void priority;
    return <img alt={props.alt ?? ""} {...props} />;
  },
}));

vi.mock("./motion-reveal", () => ({
  Reveal: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({
    state: "idle",
    introActive: false,
    introPhase: "done",
    isInitialCinematic: false,
  }),
}));

const mockHomeContent = (locale: "en" | "ar"): HomeContent => ({
  locale,
  dir: locale === "ar" ? "rtl" : "ltr",
  nav: [],
  inquiryProjects: [
    { id: "p1", name: locale === "ar" ? "مشروع النرجس" : "Al Narges Project" },
  ],
  backgrounds: {
    opening: "10, 24, 16",
    hero: "10, 24, 16",
    about: "255, 255, 255",
    projects: "10, 24, 16",
    lifestyle: "10, 24, 16",
    stats: "245, 245, 245",
    journal: "255, 255, 255",
    closing: "10, 24, 16",
    footer: "10, 24, 16",
  },
  hero: {
    eyebrow: locale === "ar" ? "تطوير عقاري راقٍ" : "Refined Architecture",
    title: locale === "ar" ? ["نصنع مساحات", "تُلهم الحياة"] : ["Crafting Spaces", "That Inspire Life"],
    note: locale === "ar" ? "رؤية معمارية رائدة ترتقي بالمجتمعات." : "Pioneering architectural vision elevating communities.",
    scroll: locale === "ar" ? "مرّر للأسفل" : "Scroll to explore",
    image: "https://example.com/hero.jpg",
    alt: "Hero image",
  },
  closing: {
    eyebrow: "Contact Us",
    title: "Get in Touch",
    cta: "Send Message",
  },
  common: {
    projects: locale === "ar" ? "المشاريع" : "Projects",
    explore: locale === "ar" ? "استكشف" : "Explore",
    language: locale === "ar" ? "English" : "العربية",
    menu: locale === "ar" ? "القائمة" : "Menu",
    close: locale === "ar" ? "إغلاق" : "Close",
    contact: locale === "ar" ? "اتصل بنا" : "Contact",
    rights: "All rights reserved",
    statsHeading: "Results",
  },
  openingProject: {
    name: "Aera",
    location: "New Cairo",
    image: "https://example.com/opening.jpg",
  },
  about: {
    enabled: false,
    eyebrow: "",
    title: "",
    intro: "",
    milestones: [],
  },
  lifestyle: {
    enabled: false,
    eyebrow: "",
    title: "",
  },
  stats: [],
  journal: {
    enabled: false,
    eyebrow: "",
    title: "",
    stories: [],
  },
  projects: [],
  visibility: {
    projects: false,
    stats: false,
  },
});

describe("Hero Component Entrance Reveal & Bilingual Integrity", () => {
  it("renders English hero components correctly with proper layout, headings, and CTAs", () => {
    const copy = mockHomeContent("en");
    const html = renderToStaticMarkup(<HomepageExperience copy={copy} />);

    expect(html).toContain("Refined Architecture");
    expect(html).toContain("Crafting Spaces");
    expect(html).toContain("That Inspire Life");
    expect(html).toContain("Explore Our Projects");
    expect(html).toContain("Discover Our Story");
    expect(html).toContain("Pioneering architectural vision elevating communities.");
    expect(html).toContain('href="#projects"');
    expect(html).toContain('class="double-chevron"');
  });

  it("renders Arabic hero components preserving connected typography and RTL direction", () => {
    const copy = mockHomeContent("ar");
    const html = renderToStaticMarkup(<HomepageExperience copy={copy} />);

    expect(html).toContain("تطوير عقاري راقٍ");
    expect(html).toContain("نصنع مساحات");
    expect(html).toContain("تُلهم الحياة");
    expect(html).toContain("استكشف مشاريعنا");
    expect(html).toContain("اكتشف قصتنا");
    expect(html).toContain("رؤية معمارية رائدة ترتقي بالمجتمعات.");
    // In Arabic, arrow points left (←)
    expect(html).toContain("←");
  });
});
