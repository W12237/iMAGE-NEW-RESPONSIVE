import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CareersPageContent } from "../content/home";
import { content } from "../content/home";
import { CareersPageExperience } from "./careers-page-experience";
import { submitCareerApplication } from "../app/actions";

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return <span data-image-alt={String(props.alt ?? "")} />;
  },
}));

vi.mock("./page-transition", () => ({
  usePageTransition: () => ({ introPhase: "done", isInitialCinematic: false }),
}));

vi.mock("./smooth-scroll", () => ({
  SmoothScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/careers",
}));

vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <header {...props}>{children}</header>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

const mockCareersContentEn: CareersPageContent = {
  ...content.en,
  careersPage: {
    hero: {
      eyebrow: "Careers & Culture",
      title: "Shape the Future of Living with Image Developments",
      intro: "We build enduring landmarks through thoughtful design and deliberate execution.",
      image: "https://images.unsplash.com/photo-careers-1",
    },
    lifeAtImage: {
      eyebrow: "Life at Image",
      title: "Built on Collaboration, Driven by Ambition",
      body: "Our workplace unites architects, engineers, and visionaries.",
      images: [
        "https://images.unsplash.com/photo-careers-2",
        "https://images.unsplash.com/photo-careers-3",
        "https://images.unsplash.com/photo-careers-4",
      ],
    },
    jobs: [
      {
        id: "job-1",
        slug: "senior-architectural-designer",
        title: "Senior Architectural Designer",
        department: "Design & Architecture",
        location: "Cairo, Egypt",
        description: "Lead conceptual architectural design for luxury mixed-use communities.",
        requirements: "Bachelor's or Master's in Architecture, 6+ years experience in high-end projects.",
      },
      {
        id: "job-2",
        slug: "senior-property-sales-consultant",
        title: "Senior Property Sales Consultant",
        department: "Commercial & Sales",
        location: "New Cairo, Egypt",
        description: "Represent Image Developments' developments to high-net-worth investors.",
        requirements: "5+ years in luxury real estate advisory with demonstrated sales track record.",
      },
    ],
    seoTitle: "Careers | Image Developments",
    seoDescription: "Explore career opportunities at Image Developments.",
  },
};

describe("CareersPageExperience", () => {
  it("renders Careers Hero with title, intro, and Explore Opportunities scroll CTA", () => {
    const html = renderToStaticMarkup(<CareersPageExperience copy={mockCareersContentEn} />);
    expect(html).toContain("Shape the Future of Living with Image Developments");
    expect(html).toContain("We build enduring landmarks");
    expect(html).toContain("Explore Opportunities");
  });

  it("renders Life at Image section with pillars and workplace imagery", () => {
    const html = renderToStaticMarkup(<CareersPageExperience copy={mockCareersContentEn} />);
    expect(html).toContain("Life at Image");
    expect(html).toContain("Built on Collaboration, Driven by Ambition");
    expect(html).toContain("Craft &amp; Precision");
    expect(html).toContain("Interdisciplinary Culture");
    expect(html).toContain("Professional Evolution");
  });

  it("renders open vacancies with job titles, departments, locations, and actions", () => {
    const html = renderToStaticMarkup(<CareersPageExperience copy={mockCareersContentEn} />);
    expect(html).toContain("Senior Architectural Designer");
    expect(html).toContain("Design &amp; Architecture");
    expect(html).toContain("Cairo, Egypt");
    expect(html).toContain("View Job Details");
    expect(html).toContain("Apply Now");
  });

  it("renders professional empty state when no vacancies are open", () => {
    const emptyCareers: CareersPageContent = {
      ...mockCareersContentEn,
      careersPage: {
        ...mockCareersContentEn.careersPage,
        jobs: [],
      },
    };
    const html = renderToStaticMarkup(<CareersPageExperience copy={emptyCareers} />);
    expect(html).toContain("vacancies-empty");
    expect(html).toContain("Submit a General Application");
  });
});

describe("submitCareerApplication validation", () => {
  it("rejects incomplete applications missing required fields", async () => {
    const formData = new FormData();
    formData.set("fullName", "J");
    formData.set("email", "invalid-email");
    formData.set("phone", "");
    formData.set("locale", "en");

    const res = await submitCareerApplication({ status: "idle" }, formData);
    expect(res.status).toBe("error");
    expect(res.fields?.fullName).toBeDefined();
    expect(res.fields?.email).toBeDefined();
    expect(res.fields?.phone).toBeDefined();
    expect(res.fields?.cv).toBeDefined();
  });

  it("rejects unsupported CV file formats", async () => {
    const formData = new FormData();
    formData.set("fullName", "John Smith");
    formData.set("email", "john@example.com");
    formData.set("phone", "+201000000000");
    formData.set("jobTitle", "Architect");
    formData.set("locale", "en");

    const fakeFile = new File(["dummy content"], "cv.exe", { type: "application/x-msdownload" });
    formData.set("cv", fakeFile);

    const res = await submitCareerApplication({ status: "idle" }, formData);
    expect(res.status).toBe("error");
    expect(res.fields?.cv).toContain("Allowed formats are PDF or Word");
  });
});
