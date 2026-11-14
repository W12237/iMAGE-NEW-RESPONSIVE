import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "./site-header";
import { content } from "@/content/home";

describe("Navigation Menu Architecture & Grouping", () => {
  it("displays exactly the 4 required primary links in exact order on English", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    const homeIdx = html.indexOf(">Home</span>");
    const aboutIdx = html.indexOf(">About Us</span>");
    const projectsIdx = html.indexOf(">Projects</span>");
    const contactIdx = html.indexOf(">Contact Us</span>");

    expect(homeIdx).toBeGreaterThan(-1);
    expect(aboutIdx).toBeGreaterThan(-1);
    expect(projectsIdx).toBeGreaterThan(-1);
    expect(contactIdx).toBeGreaterThan(-1);

    expect(homeIdx).toBeLessThan(aboutIdx);
    expect(aboutIdx).toBeLessThan(projectsIdx);
    expect(projectsIdx).toBeLessThan(contactIdx);
  });

  it("displays exactly the 4 required primary links in exact order on Arabic", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.ar} page="home" initialOpen={true} />
    );

    const homeIdx = html.indexOf(">الرئيسية</span>");
    const aboutIdx = html.indexOf(">من نحن</span>");
    const projectsIdx = html.indexOf(">المشاريع</span>");
    const contactIdx = html.indexOf(">تواصل معنا</span>");

    expect(homeIdx).toBeGreaterThan(-1);
    expect(aboutIdx).toBeGreaterThan(-1);
    expect(projectsIdx).toBeGreaterThan(-1);
    expect(contactIdx).toBeGreaterThan(-1);

    expect(homeIdx).toBeLessThan(aboutIdx);
    expect(aboutIdx).toBeLessThan(projectsIdx);
    expect(projectsIdx).toBeLessThan(contactIdx);
  });

  it("groups secondary destinations under More Pages and keeps them collapsed initially", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // "More Pages" toggle button is present
    expect(html).toContain('class="menu-more-button"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="menu-secondary-nav"');
    expect(html).toContain("More Pages");

    // Collapsed secondary links (Careers, Journal, History, Team, Partners) are NOT mounted in DOM
    expect(html).not.toContain('id="menu-secondary-nav"');
    expect(html).not.toContain(">Careers</span>");
    expect(html).not.toContain(">Journal</span>");
    expect(html).not.toContain(">History</span>");
    expect(html).not.toContain(">Team</span>");
    expect(html).not.toContain(">Partners</span>");
  });

  it("removes duplication of Privacy Policy and Terms from the navigation link lists", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // Primary and secondary navigation lists should NOT contain Policy and Terms
    expect(html).not.toContain('menu-nav-label">Policy</span>');
    expect(html).not.toContain('menu-nav-label">Terms</span>');
    expect(html).not.toContain('menu-nav-label">Privacy Policy</span>');
    expect(html).not.toContain('menu-nav-label">Terms &amp; Conditions</span>');

    // Policy and Terms remain accessible in the footer legal area
    expect(html).toContain('class="menu-legal-links"');
    expect(html).toContain('href="/en/policy"');
    expect(html).toContain('href="/en/terms"');
  });

  it("ensures mobile uses the unified clean menu structure rather than an uncollapsed dump", () => {
    const html = renderToStaticMarkup(
      <SiteHeader copy={content.en} page="home" initialOpen={true} />
    );

    // Only unified menu-nav-list is used
    expect(html).toContain('class="menu-nav-list"');
    expect(html).not.toContain('class="menu-nav-mobile-list"');
    expect(html).not.toContain('class="menu-nav-desktop-list"');
  });
});

