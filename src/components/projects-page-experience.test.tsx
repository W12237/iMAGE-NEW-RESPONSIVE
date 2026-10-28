import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ProjectsPageContent } from "../content/home";
import { content } from "../content/home";
import { ProjectShowcaseCard } from "./project-showcase-card";
import { ProjectsPageExperience } from "./projects-page-experience";

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-image-alt={String(props.alt ?? "")} />;
  },
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ introActive: false, introPhase: "done" }),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

const mockProjects = [
  {
    id: "proj-1",
    slug: "aera",
    name: "Aera",
    location: "New Cairo",
    promise: "A quieter expression of city life.",
    image: "https://images.unsplash.com/photo-1",
    projectType: "Residential",
    progressStatus: "Ongoing",
    featured: true,
  },
  {
    id: "proj-2",
    slug: "solaya",
    name: "Solaya",
    location: "New Zayed",
    promise: "Sunlit homes shaped by the landscape.",
    image: "https://images.unsplash.com/photo-2",
    projectType: "Commercial",
    progressStatus: "Ongoing",
    featured: false,
  },
  {
    id: "proj-3",
    slug: "marea",
    name: "Marea",
    location: "North Coast",
    promise: "A horizon made for slower days.",
    image: "https://images.unsplash.com/photo-3",
    projectType: "Residential",
    progressStatus: "Delivered",
    featured: false,
  },
];

describe("ProjectShowcaseCard", () => {
  it("alternates layout classes based on index (even = text-photo, odd = photo-text)", () => {
    const card0 = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[0]} index={0} locale="en" onEnquire={vi.fn()} />
    );
    const card1 = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[1]} index={1} locale="en" onEnquire={vi.fn()} />
    );
    const card2 = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[2]} index={2} locale="en" onEnquire={vi.fn()} />
    );

    expect(card0).toContain("project-showcase-card--text-photo");
    expect(card1).toContain("project-showcase-card--photo-text");
    expect(card2).toContain("project-showcase-card--text-photo");
  });

  it("maintains the exact same alternation classes in Arabic RTL mode", () => {
    const arCard0 = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[0]} index={0} locale="ar" onEnquire={vi.fn()} />
    );
    const arCard1 = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[1]} index={1} locale="ar" onEnquire={vi.fn()} />
    );

    expect(arCard0).toContain("project-showcase-card--text-photo");
    expect(arCard0).toContain('dir="rtl"');
    expect(arCard1).toContain("project-showcase-card--photo-text");
    expect(arCard1).toContain('dir="rtl"');
  });

  it("renders an H2 for the project title linked to detail page and provides clear View Project action", () => {
    const html = renderToStaticMarkup(
      <ProjectShowcaseCard project={mockProjects[0]} index={0} locale="en" onEnquire={vi.fn()} />
    );

    expect(html).toContain('class="project-card-title"');
    expect(html).toContain('href="/en/projects/aera"');
    expect(html).toContain("Aera");
    expect(html).toContain("View Project");
    expect(html).toContain("New Cairo");
  });
});

describe("ProjectsPageExperience", () => {
  it("renders a single H1 for the page title and localized breadcrumb", () => {
    const enCopy: ProjectsPageContent = {
      ...content.en,
      projectsHero: {
        enabled: true,
        eyebrow: "Image Portfolio",
        title: "Our Projects",
        description: "Explore our collection of considered destinations.",
        imageUrl: "https://images.unsplash.com/photo-1",
        focalPoint: "center",
        imageAlt: "Our Projects",
        primaryCta: "Explore Projects",
        secondaryCta: "Register Interest",
      },
      allProjects: mockProjects,
    };
    const htmlEn = renderToStaticMarkup(<ProjectsPageExperience copy={enCopy} />);

    expect(htmlEn).toMatch(/<h1[^>]*>Our Projects<\/h1>/);
    const h1MatchesEn = htmlEn.match(/<h1/g);
    expect(h1MatchesEn).toHaveLength(1);
    expect(htmlEn).toContain("Home");
    expect(htmlEn).toContain("Projects");

    const arCopy: ProjectsPageContent = {
      ...content.ar,
      projectsHero: {
        enabled: true,
        eyebrow: "محفظة المشاريع",
        title: "مشاريعنا",
        description: "استكشف وجهات ومجتمعات إيمدج للتطوير العقاري.",
        imageUrl: "https://images.unsplash.com/photo-1",
        focalPoint: "center",
        imageAlt: "مشاريع إيمدج",
        primaryCta: "استكشف المشاريع",
        secondaryCta: "سجّل اهتمامك",
      },
      allProjects: mockProjects.map((p) => ({ ...p, name: "إيرا" })),
    };
    const htmlAr = renderToStaticMarkup(<ProjectsPageExperience copy={arCopy} />);

    expect(htmlAr).toMatch(/<h1[^>]*>مشاريعنا<\/h1>/);
    const h1MatchesAr = htmlAr.match(/<h1/g);
    expect(h1MatchesAr).toHaveLength(1);
    expect(htmlAr).toContain("الرئيسية");
    expect(htmlAr).toContain("المشاريع");
  });

  it("renders architectural hero with breadcrumbs, CTAs, enquiry trigger, and scroll target", () => {
    const enCopy: ProjectsPageContent = {
      ...content.en,
      projectsHero: {
        enabled: true,
        eyebrow: "Image Portfolio",
        title: "Our Projects",
        description: "Explore our collection of considered destinations.",
        imageUrl: "https://images.unsplash.com/photo-1",
        focalPoint: "top",
        imageAlt: "Our Projects",
        primaryCta: "Explore Projects",
        secondaryCta: "Register Interest",
      },
      allProjects: mockProjects,
    };
    const htmlEn = renderToStaticMarkup(<ProjectsPageExperience copy={enCopy} />);

    // Header element and architectural hero container
    expect(htmlEn).toContain("projects-architectural-hero");
    expect(htmlEn).toContain("projects-hero-directional-overlay");
    expect(htmlEn).toContain("Image Portfolio");
    expect(htmlEn).toContain("Explore our collection of considered destinations.");

    // Primary CTA scrolling to collection
    expect(htmlEn).toContain('aria-controls="projects-collection"');
    expect(htmlEn).toContain("Explore Projects");

    // Secondary CTA opening enquiry popup
    expect(htmlEn).toContain('data-enquiry-trigger="true"');
    expect(htmlEn).toContain('data-enquiry-type="general"');
    expect(htmlEn).toContain("Register Interest");

    // Target collection section with proper id
    expect(htmlEn).toContain('id="projects-collection"');
  });

  it("omits the architectural hero cleanly when enabled is false", () => {
    const disabledCopy: ProjectsPageContent = {
      ...content.en,
      projectsHero: {
        enabled: false,
        eyebrow: "Image Portfolio",
        title: "Our Projects",
        description: "Explore our collection.",
        focalPoint: "center",
        imageAlt: "Our Projects",
        primaryCta: "Explore Projects",
        secondaryCta: "Register Interest",
      },
      allProjects: mockProjects,
    };
    const html = renderToStaticMarkup(<ProjectsPageExperience copy={disabledCopy} />);

    expect(html).not.toContain('class="projects-architectural-hero"');
    expect(html).not.toContain("Explore our collection.");
    // Collection still renders properly
    expect(html).toContain('id="projects-collection"');
  });
});
