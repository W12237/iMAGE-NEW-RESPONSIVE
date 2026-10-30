import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectDetailExperience } from "./project-detail-experience";
import { content, type ProjectDetailPageContent } from "@/content/home";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/projects/solaya",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ introPhase: "done", isInitialCinematic: false }),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("./site-header", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
}));

vi.mock("./homepage-experience", () => ({
  Footer: () => <footer data-testid="footer" />,
}));

vi.mock("./enquiry-provider", () => ({
  useEnquiryModal: () => ({
    openEnquiry: vi.fn(),
    closeEnquiry: vi.fn(),
    isOpen: false,
    config: {},
  }),
}));

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-testid="img" data-alt={String(props.alt ?? "")} />;
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
}));

const mockProjectDetailCopy: ProjectDetailPageContent = {
  ...content.en,
  locale: "en",
  project: {
    id: "solaya-id",
    slug: "solaya",
    name: "Solaya",
    shortDescription: "A considered vision of coastal living in Ras El Hekma.",
    fullDescription: "Solaya combines architectural craft with natural sea breezes.",
    location: "Ras El Hekma, North Coast",
    coverImageUrl: "/images/solaya-cover.jpg",
    coverImageAlt: "Solaya North Coast",
    gallery: ["/images/solaya-1.jpg", "/images/solaya-2.jpg"],
    projectType: "Residential",
    progressStatus: "Ongoing",
    masterPlanUrl: "/images/solaya-masterplan.jpg",
    brochureUrl: "/documents/solaya-brochure.pdf",
    latitude: 31.123,
    longitude: 27.891,
    mapUrl: "https://maps.google.com/?q=31.123,27.891",
    keyFacts: [
      { label: "Total Area", value: "120 Acres", unit: "Acres" },
      { label: "Greenery", value: "82%" },
    ],
    highlights: [
      { title: "Private Beachfront", description: "Direct crystal-water lagoon access." },
    ],
    unitTypes: [
      {
        id: "unit-1",
        name: "2-Bedroom Chalet",
        area: "115 - 135 sqm",
        finishing: "Fully Finished",
        payment: "10% down payment, up to 8 years",
      },
    ],
    nearbyLocations: [
      { name: "Alamein International Airport", distance: "20 Mins" },
    ],
    constructionUpdates: [
      { date: "2026-09-15", title: "Phase 1 Foundation Pouring Completed" },
    ],
    visualTours: [
      {
        id: "tour-solaya-1",
        title: "Solaya 360° Architectural Walkthrough",
        extractedPrefix: "/tours/tour-solaya-1",
        entryFilePath: "index.html",
        isDefault: true,
        localeTarget: "ALL",
      },
    ],
  },
  otherProjects: [
    {
      id: "aera-id",
      slug: "aera",
      name: "Aera",
      location: "New Cairo",
      image: "/images/aera.jpg",
      projectType: "Residential",
    },
    {
      id: "marea-id",
      slug: "marea",
      name: "Marea",
      location: "North Coast",
      image: "/images/marea.jpg",
      projectType: "Residential",
    },
  ],
};

describe("ProjectDetailExperience Component", () => {
  it("renders the Journal-inspired two-column layout with physical LEFT sidebar and RIGHT main content", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailExperience copy={mockProjectDetailCopy} />
    );

    // Verify two-column layout container
    expect(html).toContain("article-two-column-layout has-sidebar");

    // Verify physical left sidebar for Other Projects
    expect(html).toContain("article-projects-sidebar");
    expect(html).toContain("Other Projects");
    expect(html).toContain("Aera");
    expect(html).toContain("Marea");

    // Verify right column for project details
    expect(html).toContain("article-body-column project-details-body");
  });

  it("renders the Project Hero with title, breadcrumbs, badges, and Visual Tour button", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailExperience copy={mockProjectDetailCopy} />
    );

    expect(html).toContain("project-hero");
    expect(html).toContain("Solaya");
    expect(html).toContain("Ras El Hekma, North Coast");
    expect(html).toContain("btn-project-tour");
    expect(html).toContain("Visual Tour");
    expect(html).toContain("Register Interest");
    expect(html).toContain("Discover Project");
  });

  it("renders rich normalized sections: Key Facts, Highlights, Unit Types, Master Plan, and Connectivity", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailExperience copy={mockProjectDetailCopy} />
    );

    // Key Facts
    expect(html).toContain("Total Area");
    expect(html).toContain("120 Acres");
    expect(html).toContain("Greenery");

    // Highlights
    expect(html).toContain("Private Beachfront");
    expect(html).toContain("Direct crystal-water lagoon access.");

    // Unit Types with enquire action
    expect(html).toContain("2-Bedroom Chalet");
    expect(html).toContain("115 - 135 sqm");
    expect(html).toContain("Request Unit Details");

    // Master Plan
    expect(html).toContain("View Full Master Plan");

    // Location & Connectivity
    expect(html).toContain("Alamein International Airport");
    expect(html).toContain("20 Mins");
  });

  it("renders the Register Interest section with the approved compact contact form and Hotline 17087", () => {
    const html = renderToStaticMarkup(
      <ProjectDetailExperience copy={mockProjectDetailCopy} />
    );

    expect(html).toContain("Register Your Interest");
    expect(html).toContain("17087");
    expect(html).toContain("contact-form-refined");
    expect(html).toContain("name=\"name\"");
    expect(html).toContain("name=\"phone\"");
  });

  it("renders the Arabic version with proper localized text direction and terminology", () => {
    const arCopy: ProjectDetailPageContent = {
      ...mockProjectDetailCopy,
      locale: "ar",
      project: {
        ...mockProjectDetailCopy.project,
        name: "سوليا",
        location: "رأس الحكمة، الساحل الشمالي",
        shortDescription: "رؤية معمارية ساحلية راقية في رأس الحكمة.",
      },
    };

    const html = renderToStaticMarkup(
      <ProjectDetailExperience copy={arCopy} />
    );

    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("سوليا");
    expect(html).toContain("رأس الحكمة، الساحل الشمالي");
    expect(html).toContain("جولة افتراضية");
    expect(html).toContain("مشروعات أخرى");
    expect(html).toContain("سجل اهتمامك");
  });
});
