import {describe,expect,it} from "vitest";
import {loginSchema,newsSchema,projectSchema,safeUrl,sectionOrderSchema} from "./validation";

describe("admin validation",()=>{
  it("accepts a valid login and rejects weak input",()=>{expect(loginSchema.safeParse({email:"admin@example.com",password:"long-password"}).success).toBe(true);expect(loginSchema.safeParse({email:"bad",password:"short"}).success).toBe(false)});
  it("persists bilingual project-shaped content",()=>{expect(projectSchema.parse({slug:"new-cairo",nameEn:"Aera",nameAr:"إيرا",shortDescriptionEn:"A place",shortDescriptionAr:"مكان",locationEn:"Cairo",locationAr:"القاهرة",coverImageUrl:"/uploads/a.jpg",status:"PUBLISHED",featured:true,featuredOrder:"0"}).nameAr).toBe("إيرا")});
  it("rejects invalid slugs and enum values",()=>{expect(projectSchema.safeParse({slug:"Bad Slug",status:"LIVE"}).success).toBe(false)});
  it("formats human-readable slugs for CMS entries",()=>{const result=projectSchema.parse({slug:"New Cairo & Gardens!",nameEn:"Aera",nameAr:"إيرا",shortDescriptionEn:"A place",shortDescriptionAr:"مكان",locationEn:"Cairo",locationAr:"القاهرة",coverImageUrl:"/uploads/a.jpg",status:"DRAFT",featured:false,featuredOrder:0});expect(result.slug).toBe("new-cairo-and-gardens")});
  it("validates complete bilingual news content",()=>{expect(newsSchema.safeParse({slug:"studio-story",titleEn:"Story",titleAr:"قصة",excerptEn:"Excerpt",excerptAr:"مقتطف",contentEn:"Body",contentAr:"نص",coverImageUrl:"/image.jpg",publicationDate:"2026-10-04",status:"DRAFT",featured:false,featuredOrder:0}).success).toBe(true)});
  it("allows safe internal, anchor and absolute links",()=>{expect(safeUrl.safeParse("#contact").success).toBe(true);expect(safeUrl.safeParse("/en").success).toBe(true);expect(safeUrl.safeParse("https://example.com").success).toBe(true);expect(safeUrl.safeParse("javascript:alert(1)").success).toBe(false)});
  it("only accepts every controlled homepage section once",()=>{expect(sectionOrderSchema.safeParse(["projects","lifestyle","stats","journal","closing"]).success).toBe(true);expect(sectionOrderSchema.safeParse(["projects","projects","stats","journal","closing"]).success).toBe(false)});
});
