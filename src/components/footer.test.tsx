import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Footer } from "./homepage-experience";
import type { HomeContent } from "@/content/home";

const mockCopyEn: HomeContent = {
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
    footer: "21, 42, 32",
  },
  hero: {
    eyebrow: "A new perspective",
    title: ["Spaces", "Imagined", "Differently."],
    note: "Considered communities where architecture, landscape, and everyday living belong together.",
    scroll: "Discover",
  },
  about: {
    enabled: true,
    eyebrow: "Our journey",
    title: "A timeline of places",
    intro: "From our first idea to today",
    milestones: [],
  },
  projects: [
    {
      id: "proj-1",
      slug: "aera",
      name: "Aera",
      location: "New Cairo",
      promise: "A quiet expression of city life.",
      image: "/media/projects/aera.jpg",
    },
    {
      id: "proj-2",
      slug: "solaya",
      name: "Solaya",
      location: "New Zayed",
      promise: "Sunlit residences shaped by nature.",
      image: "/media/projects/solaya.jpg",
    },
    {
      id: "proj-3",
      slug: "marea",
      name: "Marea",
      location: "North Coast",
      promise: "A coastal horizon made for slower days.",
      image: "/media/projects/marea.jpg",
    },
  ],
  inquiryProjects: [{ id: "proj-1", name: "Aera" }],
  lifestyle: { eyebrow: "Beyond buildings", title: "Spaces made for life" },
  stats: [],
  journal: { eyebrow: "Studio", title: "Ideas shaping tomorrow", stories: [] },
  closing: {
    eyebrow: "Connect",
    title: "Find your place",
    description: "Tell us what you seek.",
    cta: "Call 17087",
    url: "tel:17087",
  },
  settings: {
    email: "hello@imagedevelopments.com",
    phone: "+20 2 0000 0000",
    hotline: "17087",
    address: "Cairo · Egypt",
    mapUrl: "https://maps.google.com/?q=Image+Developments",
    description: "Considered communities where architecture, landscape, and everyday living belong together.",
    footerExploreHeading: "Explore",
    footerProjectsHeading: "Our Projects",
    footerContactHeading: "Contact",
    callbackEnabled: true,
    callbackLabel: "Request a Call Back",
    menuImage: "/media/menu.jpg",
    menuImageAlt: "Interior",
    socials: [
      { label: "Instagram", url: "https://instagram.com/imagedev" },
      { label: "LinkedIn", url: "https://linkedin.com/company/imagedev" },
      { label: "Facebook", url: "https://facebook.com/imagedev" },
    ],
    seoTitle: "Image Developments",
    seoDescription: "Places with perspective.",
  },
  common: {
    projects: "Projects",
    explore: "Explore the place",
    menu: "Open menu",
    close: "Close menu",
    language: "العربية",
    contact: "Get in touch",
    rights: "© 2026 Image Developments. All rights reserved.",
  },
  nav: [],
};

const mockCopyAr: HomeContent = {
  ...mockCopyEn,
  locale: "ar",
  dir: "rtl",
  settings: {
    ...mockCopyEn.settings!,
    email: "hello@imagedevelopments.com",
    address: "القاهرة · مصر",
    description: "مجتمعات مدروسة تتكامل فيها العمارة والطبيعة وتفاصيل الحياة اليومية.",
    footerExploreHeading: "استكشف",
    footerProjectsHeading: "مشاريعنا",
    footerContactHeading: "تواصل معنا",
    callbackLabel: "طلب معاودة الاتصال",
  },
  common: {
    ...mockCopyEn.common,
    rights: "© 2026 إيمدج للتطوير العقاري. جميع الحقوق محفوظة.",
  },
};

describe("Refined Corporate Footer Component", () => {
  it("renders all four balanced column areas and the legal row in English", () => {
    const html = renderToStaticMarkup(<Footer copy={mockCopyEn} />);

    // Main structural containers
    expect(html).toContain('class="site-footer mm-footer stage-pad');
    expect(html).toContain('class="footer-grid"');

    // Column A: Brand
    expect(html).toContain("footer-col--brand");
    expect(html).toContain("footer-brand-logo");
    expect(html).toContain("Considered communities where architecture, landscape, and everyday living belong together.");

    // Verified social links inside Brand column
    expect(html).toContain("footer-brand-socials");
    expect(html).toContain("https://instagram.com/imagedev");
    expect(html).toContain("https://linkedin.com/company/imagedev");
    expect(html).toContain("https://facebook.com/imagedev");

    // Column B: Explore
    expect(html).toContain("footer-col--explore");
    expect(html).toContain("Explore</h2>");
    expect(html).toContain('href="/en"');
    expect(html).toContain('href="/en/about"');
    expect(html).toContain('href="/en/projects"');
    expect(html).toContain('href="/en/journal"');
    expect(html).toContain('href="/en/careers"');
    expect(html).toContain('href="/en/contact"');

    // Column C: Our Projects
    expect(html).toContain("footer-col--projects");
    expect(html).toContain("Our Projects</h2>");
    expect(html).toContain('href="/en/projects/aera"');
    expect(html).toContain('href="/en/projects/solaya"');
    expect(html).toContain('href="/en/projects/marea"');
    expect(html).toContain("View All Projects");

    // Column D: Contact
    expect(html).toContain("footer-col--contact");
    expect(html).toContain("Contact</h2>");
    expect(html).toContain('href="tel:17087"');
    expect(html).toContain('href="mailto:hello@imagedevelopments.com"');
    expect(html).toContain("Cairo · Egypt");
    expect(html).toContain('href="https://maps.google.com/?q=Image+Developments"');
    expect(html).toContain("Get Directions");

    // Compact Call Back trigger
    expect(html).toContain('data-enquiry-trigger="true"');
    expect(html).toContain('data-enquiry-type="callback"');
    expect(html).toContain("Request a Call Back");

    // Legal Row
    expect(html).toContain("footer-legal-row");
    expect(html).toContain("© 2026 Image Developments. All rights reserved.");
    expect(html).toContain('href="/en/policy"');
    expect(html).toContain('href="/en/terms"');
    expect(html).toContain("Privacy Policy");
    expect(html).toContain("Terms &amp; Conditions");

    // Ensures duplicate oversized wordmark is removed
    expect(html).not.toContain("footer-word");
  });

  it("renders properly in Arabic with RTL semantics and LTR contact details", () => {
    const html = renderToStaticMarkup(<Footer copy={mockCopyAr} />);

    // Arabic Column Headings
    expect(html).toContain("استكشف</h2>");
    expect(html).toContain("مشاريعنا</h2>");
    expect(html).toContain("تواصل معنا</h2>");

    // Arabic Navigation
    expect(html).toContain('href="/ar"');
    expect(html).toContain('href="/ar/about"');
    expect(html).toContain('href="/ar/careers"');

    // View All Projects in Arabic
    expect(html).toContain("عرض جميع المشاريع");
    expect(html).toContain('href="/ar/projects"');

    // Hotline and Email LTR classes
    expect(html).toContain("footer-ltr-text");

    // Legal links in Arabic
    expect(html).toContain('href="/ar/policy"');
    expect(html).toContain('href="/ar/terms"');
    expect(html).toContain("سياسة الخصوصية");
    expect(html).toContain("الشروط والأحكام");
  });

  it("gracefully hides optional callback button when callbackEnabled is false", () => {
    const copyWithoutCallback: HomeContent = {
      ...mockCopyEn,
      settings: {
        ...mockCopyEn.settings!,
        callbackEnabled: false,
      },
    };
    const html = renderToStaticMarkup(<Footer copy={copyWithoutCallback} />);
    expect(html).not.toContain("footer-callback-btn");
  });

  it("renders with full static CMS baseline content from home.ts", async () => {
    const { content } = await import("@/content/home");
    const baselineCopyEn: HomeContent = {
      ...content.en,
      settings: {
        email: "hello@imagedevelopments.com",
        phone: "+20 2 0000 0000",
        hotline: "17087",
        address: "Cairo · Egypt",
        mapUrl: "https://maps.google.com/?q=Image+Developments",
        description: "Considered communities where architecture, landscape, and everyday living belong together.",
        footerExploreHeading: "Explore",
        footerProjectsHeading: "Our Projects",
        footerContactHeading: "Contact",
        callbackEnabled: true,
        callbackLabel: "Request a Call Back",
        menuImage: "/media/menu.jpg",
        menuImageAlt: "Interior",
        socials: [
          { label: "Instagram", url: "https://instagram.com/imagedev" },
          { label: "LinkedIn", url: "https://linkedin.com/company/imagedev" },
        ],
        seoTitle: "Image Developments",
        seoDescription: "Places with perspective.",
      },
    };
    const htmlEn = renderToStaticMarkup(<Footer copy={baselineCopyEn} />);
    expect(htmlEn).toContain("footer-col--brand");
    expect(htmlEn).toContain("footer-col--explore");
    expect(htmlEn).toContain("footer-col--projects");
    expect(htmlEn).toContain("footer-col--contact");
    expect(htmlEn).toContain("tel:17087");

    const baselineCopyAr: HomeContent = {
      ...content.ar,
      settings: {
        ...baselineCopyEn.settings!,
        address: "القاهرة · مصر",
        description: "مجتمعات مدروسة تتكامل فيها العمارة والطبيعة وتفاصيل الحياة اليومية.",
        footerExploreHeading: "استكشف",
        footerProjectsHeading: "مشاريعنا",
        footerContactHeading: "تواصل معنا",
        callbackLabel: "طلب معاودة الاتصال",
      },
    };
    const htmlAr = renderToStaticMarkup(<Footer copy={baselineCopyAr} />);
    expect(htmlAr).toContain("footer-col--brand");
    expect(htmlAr).toContain("footer-col--explore");
    expect(htmlAr).toContain("footer-col--projects");
    expect(htmlAr).toContain("footer-col--contact");
    expect(htmlAr).toContain("tel:17087");
  });
});
