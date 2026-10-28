import { z } from "zod";

export const contentSlugSchema = z.string().trim().transform(value=>value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"")
  .toLowerCase()
  .replace(/&/g," and ")
  .replace(/[^a-z0-9]+/g,"-")
  .replace(/^-+|-+$/g,"")
  .replace(/-+/g,"-"))
  .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,"Enter a name using at least one English letter or number. The URL slug will be formatted automatically."));

export const loginSchema = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(8) });
export const projectSchema = z.object({
  slug: contentSlugSchema, nameEn: z.string().trim().min(1), nameAr: z.string().trim().min(1),
  shortDescriptionEn: z.string().trim().min(1), shortDescriptionAr: z.string().trim().min(1), locationEn: z.string().trim().min(1), locationAr: z.string().trim().min(1),
  coverImageUrl: z.string().trim().min(1), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), featuredOrder: z.coerce.number().int().min(0), featured: z.boolean(),
});
export const newsSchema = z.object({
  slug: contentSlugSchema, titleEn: z.string().trim().min(1), titleAr: z.string().trim().min(1), excerptEn: z.string().trim().min(1), excerptAr: z.string().trim().min(1),
  contentEn: z.string().trim().min(1), contentAr: z.string().trim().min(1), coverImageUrl: z.string().trim().min(1), publicationDate: z.coerce.date(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), featured: z.boolean(), featuredOrder: z.coerce.number().int().min(0),
});
export const safeUrl = z.string().refine(v => v.startsWith("#") || v.startsWith("/") || /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v), "Enter an anchor, internal path, or safe full URL");
export const sectionOrderSchema = z.array(z.enum(["projects","lifestyle","stats","journal","closing"])).length(5).refine(v=>new Set(v).size===5,"Each homepage section must appear exactly once");
