import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { content } from "../content/home";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ introPhase: "done", isInitialCinematic: false }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
    create: <T,>(Comp: T): T => Comp,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock("./enquiry-provider", () => ({
  useEnquiryModal: () => ({
    openEnquiry: vi.fn(),
    closeEnquiry: vi.fn(),
    isOpen: false,
  }),
}));

describe("SiteHeader Original Design & Navigation", () => {
  it("keeps the closed header clean with logo, language switcher, projects arrow, and hamburger menu button", () => {
    const html = renderToStaticMarkup(<SiteHeader copy={content.en} page="home" />);

    // Company logo
    expect(html).toContain("header-logo");
    // AR/EN language switcher
    expect(html).toContain("language-link");
    expect(html).toContain(content.en.common.language);
    // Projects arrow button
    expect(html).toContain("header-projects");
    // Dedicated circular 3-bar Menu button
    expect(html).toContain("menu-button");

    // Menu overlay is not shown when closed
    expect(html).not.toContain("menu-overlay");
    expect(html).not.toContain("menu-nav");
  });

  it("renders Arabic labels and directional arrow when locale is ar", () => {
    const html = renderToStaticMarkup(<SiteHeader copy={content.ar} page="home" />);

    expect(html).toContain("header-logo");
    expect(html).toContain("language-link");
    expect(html).toContain(content.ar.common.language);
    expect(html).toContain("header-projects");
    expect(html).toContain("menu-button");
    // Arrow for RTL points left
    expect(html).toContain("←");
  });

  it("groups the close button (X) and language switcher in top-left with X first on English pages", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // Menu overlay is shown
    expect(html).toContain("menu-overlay");
    expect(html).toContain("menu-top");
    expect(html).toContain("menu-controls-group");

    // The group must explicitly enforce dir="ltr" to maintain physical top-left [X] [Lang] order
    expect(html).toContain('class="menu-controls-group" dir="ltr"');

    // Close button comes first inside menu-controls-group
    const closePos = html.indexOf('class="menu-close"');
    const langPos = html.indexOf('class="menu-language"');
    expect(closePos).toBeGreaterThan(-1);
    expect(langPos).toBeGreaterThan(-1);
    expect(closePos).toBeLessThan(langPos);

    // On English page, language switcher shows "العربية" and links to /ar
    expect(html).toContain(">العربية</a>");
    expect(html).toContain('href="/ar"');

    // Exactly one language button inside the menu overlay
    const menuMatches = html.match(/class="menu-language"/g);
    expect(menuMatches?.length).toBe(1);
  });

  it("groups close button and language switcher in physical top-left on Arabic pages without reversing order", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.ar} page="journal" initialOpen={true} />
    );

    expect(html).toContain("menu-overlay");
    expect(html).toContain('dir="rtl"');

    // The controls group retains dir="ltr" to prevent RTL from moving it or reversing X and language
    expect(html).toContain('class="menu-controls-group" dir="ltr"');

    const closePos = html.indexOf('class="menu-close"');
    const langPos = html.indexOf('class="menu-language"');
    expect(closePos).toBeGreaterThan(-1);
    expect(langPos).toBeGreaterThan(-1);
    expect(closePos).toBeLessThan(langPos);

    // On Arabic page, language button shows "English" and links to equivalent /en/journal
    expect(html).toContain(">English</a>");
    expect(html).toContain('href="/en/journal"');
  });

  it("renders 5 primary links in exact initial order and spells Careers correctly", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // Primary links order
    const homePos = html.indexOf(">Home</span>");
    const aboutPos = html.indexOf(">About Us</span>");
    const projectsPos = html.indexOf(">Projects</span>");
    const careersPos = html.indexOf(">Careers</span>");
    const contactPos = html.indexOf(">Contact Us</span>");

    expect(homePos).toBeGreaterThan(-1);
    expect(aboutPos).toBeGreaterThan(-1);
    expect(projectsPos).toBeGreaterThan(-1);
    expect(careersPos).toBeGreaterThan(-1);
    expect(contactPos).toBeGreaterThan(-1);

    expect(homePos).toBeLessThan(aboutPos);
    expect(aboutPos).toBeLessThan(projectsPos);
    expect(projectsPos).toBeLessThan(careersPos);
    expect(careersPos).toBeLessThan(contactPos);

    // More Pages button exists with accessibility attributes
    expect(html).toContain('class="menu-more-button"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="menu-secondary-nav"');
    expect(html).toContain("More Pages");

    // Collapsed secondary links are unmounted so they cannot receive keyboard focus
    expect(html).not.toContain('id="menu-secondary-nav"');

    // Menu preview photograph panel is present
    expect(html).toContain('class="menu-image"');
  });

  it("renders Arabic primary links in exact order with More Pages button", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.ar} page="projects" initialOpen={true} />
    );

    const homePos = html.indexOf(">الرئيسية</span>");
    const aboutPos = html.indexOf(">من نحن</span>");
    const projectsPos = html.indexOf(">المشاريع</span>");
    const careersPos = html.indexOf(">الوظائف</span>");
    const contactPos = html.indexOf(">تواصل معنا</span>");

    expect(homePos).toBeGreaterThan(-1);
    expect(aboutPos).toBeGreaterThan(-1);
    expect(projectsPos).toBeGreaterThan(-1);
    expect(careersPos).toBeGreaterThan(-1);
    expect(contactPos).toBeGreaterThan(-1);

    expect(homePos).toBeLessThan(aboutPos);
    expect(aboutPos).toBeLessThan(projectsPos);
    expect(projectsPos).toBeLessThan(careersPos);
    expect(careersPos).toBeLessThan(contactPos);

    // Arabic More Pages label
    expect(html).toContain("المزيد من الصفحات");
    // Highlights current page (Projects)
    expect(html).toContain('aria-current="page"');
  });

  it("renders prominent mobile callback CTA and hotline inside the open menu", () => {
    const htmlEn = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // Menu mobile CTA container and callback button
    expect(htmlEn).toContain('class="menu-mobile-cta"');
    expect(htmlEn).toContain('class="menu-callback-btn"');
    expect(htmlEn).toContain("Request a Call Back");

    // Hotline 17087 is accessible in menu footer
    expect(htmlEn).toContain('href="tel:17087"');
    expect(htmlEn).toContain("17087");

    // Arabic variant
    const htmlAr = renderToStaticMarkup(
      <SiteHeader copy={content.ar} page="home" initialOpen={true} />
    );
    expect(htmlAr).toContain('class="menu-mobile-cta"');
    expect(htmlAr).toContain('class="menu-callback-btn"');
    expect(htmlAr).toContain("اطلب اتصالاً");
    expect(htmlAr).toContain('href="tel:17087"');
  });

  it("renders responsive callback CTA in closed header with full and short labels", () => {
    const html = renderToStaticMarkup(<SiteHeader copy={content.en} page="home" />);

    expect(html).toContain('class="header-enquire-btn"');
    expect(html).toContain('class="header-enquire-full"');
    expect(html).toContain("Request a Call Back");
    expect(html).toContain('class="header-enquire-short"');
    expect(html).toContain("Call Back");
  });
});
