import {describe,expect,it} from "vitest";
import {getPageSectionLayout,PAGE_SECTION_LAYOUTS,isPageSectionLayout,normalizePageSectionLayout,withPageSectionLayout} from "./page-section-layouts";

describe("page section layout registry",()=>{
  it("exposes the eight approved layouts in CMS order",()=>{
    expect(PAGE_SECTION_LAYOUTS.map(layout=>layout.id)).toEqual([
      "TEXT",
      "IMAGE_LEFT",
      "IMAGE_RIGHT",
      "FULL_IMAGE",
      "EDITORIAL_PORTRAIT",
      "OVERLAP_FEATURE",
      "MAGAZINE_FEATURE",
      "IMMERSIVE_BANNER",
    ]);
  });

  it("recognizes every registered layout and rejects unknown values",()=>{
    for(const layout of PAGE_SECTION_LAYOUTS)expect(isPageSectionLayout(layout.id)).toBe(true);
    expect(isPageSectionLayout("LEGACY_UNKNOWN")).toBe(false);
    expect(isPageSectionLayout(null)).toBe(false);
  });

  it("normalizes unknown and legacy values to text",()=>{
    for(const layout of PAGE_SECTION_LAYOUTS)expect(normalizePageSectionLayout(layout.id)).toBe(layout.id);
    expect(normalizePageSectionLayout("LEGACY_UNKNOWN")).toBe("TEXT");
    expect(normalizePageSectionLayout(undefined)).toBe("TEXT");
  });

  it("provides complete CMS guidance with a safe metadata fallback",()=>{
    for(const layout of PAGE_SECTION_LAYOUTS){
      expect(layout.label.trim()).not.toBe("");
      expect(layout.description.trim()).not.toBe("");
      expect(layout.imageGuidance.trim()).not.toBe("");
    }
    expect(getPageSectionLayout("LEGACY_UNKNOWN")).toBe(PAGE_SECTION_LAYOUTS[0]);
    expect(getPageSectionLayout("MAGAZINE_FEATURE").label).toBe("Magazine Feature");
  });

  it("changes only the layout field when an admin switches templates",()=>{
    const section={id:"section-1",layout:"TEXT" as const,titleEn:"A place",titleAr:"مكان",bodyEn:"Body",bodyAr:"المحتوى",imageUrl:"/uploads/place.jpg",visible:true};
    const changed=withPageSectionLayout(section,"OVERLAP_FEATURE");
    expect(changed).toEqual({...section,layout:"OVERLAP_FEATURE"});
    expect(changed).not.toBe(section);
    expect(Object.fromEntries(Object.entries(changed).filter(([key])=>key!=="layout"))).toEqual(Object.fromEntries(Object.entries(section).filter(([key])=>key!=="layout")));
  });
});
