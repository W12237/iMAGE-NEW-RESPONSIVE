import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it,vi} from "vitest";
import type {PageSectionContent} from "../content/home";

vi.mock("next/image",()=>({default:({fill,...props}:React.ImgHTMLAttributes<HTMLImageElement>&{fill?:boolean})=>{void fill;return <span data-image-alt={String(props.alt??"")}/>}}));
vi.mock("./motion-reveal",()=>({Reveal:({children,className}:{children:React.ReactNode;className?:string})=><div className={className}>{children}</div>}));

import {PageSections} from "./page-sections";

const section=(layout:PageSectionContent["layout"],overrides:Partial<PageSectionContent>={}):PageSectionContent=>({
  id:`section-${layout}`,
  layout,
  eyebrow:"A new perspective",
  title:"Designed around life",
  body:"First paragraph\n\nSecond paragraph",
  image:"/uploads/place.jpg",
  imageAlt:"A considered place",
  ctaLabel:"Discover more",
  ctaUrl:"/en/contact",
  backgroundRgb:"255, 233, 213",
  ...overrides,
});

const render=(item:PageSectionContent)=>renderToStaticMarkup(<PageSections sections={[item]}/>);

describe("PageSections",()=>{
  it("preserves the legacy text-only structure and classes",()=>{
    const html=render(section("TEXT"));
    expect(html).toContain('class="custom-section custom-section--text stage-pad"');
    expect(html).toContain('<div class="custom-section-grid"><div class="custom-section-copy">');
    expect(html).not.toContain("custom-section-media");
  });

  it("preserves legacy image placement for left, right, and full-image layouts",()=>{
    const left=render(section("IMAGE_LEFT"));
    const right=render(section("IMAGE_RIGHT"));
    const full=render(section("FULL_IMAGE"));
    expect(left).toContain('custom-section--image-left stage-pad');
    expect(left.indexOf("custom-section-media")).toBeLessThan(left.indexOf("custom-section-copy"));
    expect(right).toContain('custom-section--image-right stage-pad');
    expect(right.indexOf("custom-section-copy")).toBeLessThan(right.indexOf("custom-section-media"));
    expect(full).toContain('custom-section--full-image stage-pad');
    expect(full.indexOf("custom-section-media")).toBeLessThan(full.indexOf("custom-section-grid"));
  });

  it.each([
    ["EDITORIAL_PORTRAIT","editorial-portrait"],
    ["OVERLAP_FEATURE","overlap-feature"],
    ["MAGAZINE_FEATURE","magazine-feature"],
    ["IMMERSIVE_BANNER","immersive-banner"],
  ] as const)("renders %s with shared section content",(layout,className)=>{
    const html=render(section(layout));
    expect(html).toContain(`custom-section--${className}`);
    expect(html).toContain("A new perspective");
    expect(html).toContain("Designed around life");
    expect(html).toContain("First paragraph");
    expect(html).toContain("Second paragraph");
    expect(html).toContain('data-image-alt="A considered place"');
    expect(html).toContain('href="/en/contact"');
  });

  it.each(["EDITORIAL_PORTRAIT","OVERLAP_FEATURE","MAGAZINE_FEATURE","IMMERSIVE_BANNER"] as const)("omits empty media in %s",layout=>{
    expect(render(section(layout,{image:undefined}))).not.toContain("custom-section-media");
  });

  it("keeps unsafe CTAs hidden",()=>{
    expect(render(section("IMMERSIVE_BANNER",{ctaUrl:"javascript:alert(1)"}))).not.toContain("<a ");
  });

  it("falls back unknown runtime layouts to the legacy text layout",()=>{
    const legacy={...section("TEXT"),layout:"LEGACY_UNKNOWN" as PageSectionContent["layout"]};
    const html=render(legacy);
    expect(html).toContain('class="custom-section custom-section--text stage-pad"');
    expect(html).toContain('<div class="custom-section-grid"><div class="custom-section-copy">');
  });
});
