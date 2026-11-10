import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ProjectShowcase,
  resolveProjectLocationId,
  PROJECT_TYPES,
  PROJECT_STATUSES,
  CANONICAL_LOCATIONS,
} from "./project-showcase";
import type { HomeContent } from "@/content/home";
import { EnquiryProvider } from "./enquiry-provider";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function getMockHomeContent(locale: "en" | "ar" = "en", overrides: Partial<HomeContent> = {}): HomeContent {
  const ar = locale === "ar";
  return {
    locale,
    dir: ar ? "rtl" : "ltr",
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
    hero: {
      eyebrow: "Hero",
      title: ["Image"],
      note: "Note",
      scroll: "Scroll",
    },
    about: {
      enabled: true,
      eyebrow: "About",
      title: "Title",
      intro: "Intro",
      milestones: [],
    },
    projects: [
      {
        id: "p1",
        slug: "aera",
        name: ar ? "إيرا" : "Aera",
        location: ar ? "القاهرة الجديدة" : "New Cairo",
        locationEn: "New Cairo",
        locationAr: "القاهرة الجديدة",
        promise: ar ? "تعبير أكثر هدوءاً عن حياة المدينة" : "A quieter expression of city life",
        image: "/images/aera.jpg",
        projectType: "Residential",
        progressStatus: "Ongoing",
        brochureUrl: "https://example.com/aera.pdf",
      },
      {
        id: "p2",
        slug: "solaya",
        name: ar ? "سولايا" : "Solaya",
        location: ar ? "زايد الجديدة" : "New Zayed",
        locationEn: "New Zayed",
        locationAr: "زايد الجديدة",
        promise: ar ? "بيوت يغمرها الضوء وتشكلها الطبيعة" : "Sunlit homes shaped by the landscape",
        image: "/images/solaya.jpg",
        projectType: "Commercial",
        progressStatus: "Ongoing",
      },
      {
        id: "p3",
        slug: "marea",
        name: ar ? "ماريا" : "Marea",
        location: ar ? "الساحل الشمالي" : "North Coast",
        locationEn: "North Coast",
        locationAr: "الساحل الشمالي",
        promise: ar ? "أفق صُنع لأيام أكثر هدوءاً" : "A horizon made for slower days",
        image: "/images/marea.jpg",
        projectType: "Residential",
        progressStatus: "Upcoming",
      },
      {
        id: "p4",
        slug: "siam-mall",
        name: ar ? "سيام مول" : "Siam Mall",
        location: ar ? "محور جمال عبد الناصر" : "Gamal abd elnasser axis - 6 october",
        locationEn: "Gamal abd elnasser axis - 6 october",
        locationAr: "محور جمال عبد الناصر",
        promise: ar ? "وجهة تجارية راقية" : "A premium commercial destination",
        image: "/images/siam.jpg",
        projectType: "Commercial",
        progressStatus: "Ongoing",
      },
    ],
    projectsSection: {
      heading: ar ? "المشاريع" : "Projects",
      description: ar
        ? "مجموعة مختارة من الوجهات السكنية والمختلطة"
        : "A curated collection of residential and mixed-use destinations",
      exploreLabel: ar ? "اكتشف المكان" : "Explore the place",
      enquireLabel: ar ? "استفسر الآن" : "Enquire",
      viewAllLabel: ar ? "جميع المشاريع" : "View All Projects",
      spacing: "standard",
      theme: "light",
      imagePosition: "start",
      filterEnabled: true,
      showResultCount: true,
      locationFilterLabel: ar ? "الموقع" : "Location",
      typeFilterLabel: ar ? "نوع المشروع" : "Project Type",
      statusFilterLabel: ar ? "حالة المشروع" : "Project Status",
      resetFilterLabel: ar ? "إعادة ضبط الفلاتر" : "Reset Filters",
      locationTagsEnabled: true,
      allLabel: ar ? "كافة المشاريع" : "All Projects",
      showTagCounts: false,
      locationOrder: "auto",
    },
    inquiryProjects: [
      { id: "p1", name: ar ? "إيرا" : "Aera" },
      { id: "p2", name: ar ? "سولايا" : "Solaya" },
      { id: "p3", name: ar ? "ماريا" : "Marea" },
      { id: "p4", name: ar ? "سيام مول" : "Siam Mall" },
    ],
    lifestyle: { eyebrow: "", title: "" },
    stats: [],
    journal: { eyebrow: "", title: "", stories: [] },
    closing: { eyebrow: "", title: "" },
    common: {
      projects: ar ? "المشاريع" : "Projects",
      explore: ar ? "اكتشف المكان" : "Explore the place",
      menu: "Menu",
      close: "Close",
      language: ar ? "English" : "العربية",
      contact: "Contact",
      rights: "Rights",
    },
    ...overrides,
  };
}

describe("resolveProjectLocationId", () => {
  it("resolves canonical locations accurately into stable IDs", () => {
    expect(resolveProjectLocationId({ locationEn: "New Cairo", locationAr: "القاهرة الجديدة" })).toBe("new-cairo");
    expect(resolveProjectLocationId({ locationEn: "New Zayed", locationAr: "زايد الجديدة" })).toBe("new-zayed");
    expect(resolveProjectLocationId({ locationEn: "North Coast", locationAr: "الساحل الشمالي" })).toBe("north-coast");
    expect(resolveProjectLocationId({ locationEn: "6th of October" })).toBe("october");
  });

  it("resolves Gamal abd elnasser axis - 6 october to october", () => {
    expect(resolveProjectLocationId({ locationEn: "Gamal abd elnasser axis - 6 october" })).toBe("october");
  });

  it("avoids creating categories for street addresses without city reference", () => {
    expect(resolveProjectLocationId({ locationEn: "Main Street, Road 90" })).toBeNull();
  });
});

describe("ProjectShowcase Component - Location Tags Bar & Card Layout", () => {
  it("renders the location tags bar in English with 'All Projects' first and active", () => {
    const copy = getMockHomeContent("en");
    const html = renderToStaticMarkup(
      <EnquiryProvider copy={copy}>
        <ProjectShowcase copy={copy} />
      </EnquiryProvider>
    );

    // 1. Structure: Location tags container with group role
    expect(html).toContain('class="homepage-location-tags"');
    expect(html).toContain('role="group"');

    // 2. "All Projects" tag is first and initially active (aria-pressed="true")
    expect(html).toContain("All Projects");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("location-tag is-active");

    // 3. Distinct location tags present
    expect(html).toContain("New Cairo");
    expect(html).toContain("New Zayed");
    expect(html).toContain("North Coast");
    expect(html).toContain("6th of October");

    // 4. Active Project Details Display
    expect(html).toContain("Aera");
    expect(html).toContain("A quieter expression of city life");
    expect(html).toContain("Explore the place");
    expect(html).toContain("Enquire");
    expect(html).toContain("Brochure");

    // 5. Enquiry Attributes on Project context
    expect(html).toContain('data-enquiry-trigger="true"');
    expect(html).toContain('data-project-id="p1"');
    expect(html).toContain('data-project-name="Aera"');
  });

  it("renders the location tags bar in Arabic with complete localization and no English leakage", () => {
    const copy = getMockHomeContent("ar");
    const html = renderToStaticMarkup(
      <EnquiryProvider copy={copy}>
        <ProjectShowcase copy={copy} />
      </EnquiryProvider>
    );

    // Arabic All Projects tag
    expect(html).toContain("كافة المشاريع");
    expect(html).toContain('aria-pressed="true"');

    // Arabic Location tags
    expect(html).toContain("القاهرة الجديدة");
    expect(html).toContain("زايد الجديدة");
    expect(html).toContain("الساحل الشمالي");
    expect(html).toContain("السادس من أكتوبر");

    // Localized project details
    expect(html).toContain("إيرا");
    expect(html).toContain("سكني"); // Residential localized
    expect(html).toContain("قيد التنفيذ"); // Ongoing localized
    expect(html).toContain("استفسر الآن");
    expect(html).toContain("الكتيب");

    // Should NOT show raw English "Commercial" or "Residential" or "Ongoing" in Arabic view
    expect(html).not.toContain('>Residential<');
    expect(html).not.toContain('>Commercial<');
    expect(html).not.toContain('>Ongoing<');
  });

  it("renders tag counts when showTagCounts is enabled in CMS", () => {
    const baseContent = getMockHomeContent("en");
    const copy = getMockHomeContent("en", {
      projectsSection: {
        ...baseContent.projectsSection!,
        showTagCounts: true,
      },
    });

    const html = renderToStaticMarkup(
      <EnquiryProvider copy={copy}>
        <ProjectShowcase copy={copy} />
      </EnquiryProvider>
    );

    expect(html).toContain('class="location-tag-count"');
    // Total 4 projects count on All Projects tag
    expect(html).toContain('<span class="location-tag-count" aria-hidden="true">4</span>');
  });

  it("renders empty state correctly when no projects exist", () => {
    const copy = getMockHomeContent("en", {
      projects: [],
    });
    // With total = 0, returns null as per existing guard
    const html = renderToStaticMarkup(
      <EnquiryProvider copy={copy}>
        <ProjectShowcase copy={copy} />
      </EnquiryProvider>
    );
    expect(html).toBe("");
  });

  it("preserves section heading, view all link, and enquiry triggers", () => {
    const copy = getMockHomeContent("en");
    const html = renderToStaticMarkup(
      <EnquiryProvider copy={copy}>
        <ProjectShowcase copy={copy} />
      </EnquiryProvider>
    );

    expect(html).toContain('href="/en/projects"');
    expect(html).toContain("View All Projects");
    expect(html).toContain('id="featured-projects-title"');
    expect(html).toContain("Projects");
  });

  it("handles missing optional project metadata safely without errors", () => {
    const minimalCopy = getMockHomeContent("en", {
      projects: [
        {
          name: "Minimal Project",
          location: "Cairo",
          promise: "",
          image: "/images/test.jpg",
          // no brochure, no projectType, no progressStatus, no slug
        },
      ],
    });

    const html = renderToStaticMarkup(
      <EnquiryProvider copy={minimalCopy}>
        <ProjectShowcase copy={minimalCopy} />
      </EnquiryProvider>
    );

    expect(html).toContain("Minimal Project");
    expect(html).not.toContain("btn-featured-brochure");
  });
});
