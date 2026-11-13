"use server";
import { compare } from "bcryptjs";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSession, destroySession, requireAdmin } from "@/lib/session";
import { loginSchema, newsSchema, projectSchema, safeUrl, sectionOrderSchema } from "@/lib/validation";
import { parsePageBlocksInput } from "@/lib/page-blocks-input";
import { BLOCK_PAGES } from "@/lib/page-blocks";
import { processVisualTourUpload, deleteVisualTourAssets } from "@/lib/tours";
import { validateTypographyValue, TYPOGRAPHY_ROLES, type TypographyRole } from "@/lib/typography";

const str=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const bool=(f:FormData,k:string)=>f.get(k)==="on";
const rgb=(f:FormData,k:string)=>{const parts=str(f,k).split(",").map(value=>Number(value.trim()));return parts.length===3&&parts.every(value=>Number.isInteger(value)&&value>=0&&value<=255)?parts.join(", "):null};
async function saveFontSizes(f: FormData) {
  const settingKeys = new Set<string>();
  for (const key of f.keys()) {
    if (key.startsWith("fontSize_")) settingKeys.add(key.slice(9));
    else if (key.startsWith("fontSizeDesktop_")) settingKeys.add(key.slice(16));
    else if (key.startsWith("fontSizeMobile_")) settingKeys.add(key.slice(15));
  }
  for (const settingKey of settingKeys) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(settingKey)) continue;
    const rawDesktop = str(f, `fontSizeDesktop_${settingKey}`) || str(f, `fontSize_${settingKey}`);
    const rawMobile = str(f, `fontSizeMobile_${settingKey}`);
    const desktopNum = rawDesktop ? Number(rawDesktop) : null;
    const mobileNum = rawMobile ? Number(rawMobile) : null;
    const validDesktop = desktopNum !== null && Number.isInteger(desktopNum) && desktopNum >= 12 && desktopNum <= 200 ? desktopNum : null;
    const validMobile = mobileNum !== null && Number.isInteger(mobileNum) && mobileNum >= 12 && mobileNum <= 200 ? mobileNum : null;
    if (!validDesktop && !validMobile) {
      await prisma.typographySetting.deleteMany({ where: { key: settingKey } });
      continue;
    }
    await prisma.typographySetting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        fontSize: validDesktop ?? undefined,
        fontSizeDesktop: validDesktop ?? undefined,
        fontSizeMobile: validMobile ?? undefined,
      },
      update: {
        fontSize: validDesktop ?? undefined,
        fontSizeDesktop: validDesktop ?? undefined,
        fontSizeMobile: validMobile ?? undefined,
      },
    });
  }
}
export type ActionState={error?:string;success?:string};
export type UploadedMedia={id:string;url:string;filename:string;mimeType:string;size:number;kind:"IMAGE"|"VIDEO"|"DOCUMENT"};

const MEDIA_TYPES={
  "image/jpeg":{extension:"jpg",kind:"IMAGE",maxMb:8},"image/png":{extension:"png",kind:"IMAGE",maxMb:8},
  "image/webp":{extension:"webp",kind:"IMAGE",maxMb:8},"image/avif":{extension:"avif",kind:"IMAGE",maxMb:8},
  "video/mp4":{extension:"mp4",kind:"VIDEO",maxMb:80},"video/webm":{extension:"webm",kind:"VIDEO",maxMb:80},
} as const;

function hasValidSignature(bytes:Uint8Array,mimeType:keyof typeof MEDIA_TYPES){
  const ascii=(start:number,length:number)=>String.fromCharCode(...bytes.slice(start,start+length));
  if(mimeType==="image/jpeg")return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mimeType==="image/png")return bytes.slice(0,8).every((value,index)=>value===[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index]);
  if(mimeType==="image/webp")return ascii(0,4)==="RIFF"&&ascii(8,4)==="WEBP";
  if(mimeType==="image/avif")return ascii(4,4)==="ftyp"&&["avif","avis"].includes(ascii(8,4));
  if(mimeType==="video/mp4")return ascii(4,4)==="ftyp";
  return bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3;
}

async function storeMedia(file:File,expectedKind?:"IMAGE"|"VIDEO"|"DOCUMENT"):Promise<{asset?:UploadedMedia;error?:string}>{
  const type=MEDIA_TYPES[file.type as keyof typeof MEDIA_TYPES];
  if(!type)return{error:expectedKind==="VIDEO"?"Unsupported format. Choose an MP4 or WebM video.":expectedKind==="IMAGE"?"Unsupported format. Choose a JPEG, PNG, WebP, or AVIF image.":"Use JPEG, PNG, WebP, AVIF, MP4, or WebM."};
  if(expectedKind&&type.kind!==expectedKind)return{error:`Choose a${expectedKind==="IMAGE"?"n image":" video"} file for this field.`};
  if(file.size>type.maxMb*1024*1024)return{error:type.kind==="VIDEO"?"Maximum video size is 80 MB.":"Maximum image size is 8 MB."};
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!hasValidSignature(bytes,file.type as keyof typeof MEDIA_TYPES))return{error:"The file contents do not match its reported format. Choose a valid media file."};
  const storedName=`${Date.now()}-${crypto.randomUUID()}.${type.extension}`;
  const dir=path.join(process.cwd(),"public","uploads");const diskPath=path.join(dir,storedName);
  try{await mkdir(dir,{recursive:true});await writeFile(diskPath,bytes)}catch{return{error:"Storage failure. The file could not be saved. Please try again."}}
  try{return{asset:await prisma.mediaAsset.create({data:{url:`/uploads/${storedName}`,filename:file.name,mimeType:file.type,size:file.size,kind:type.kind},select:{id:true,url:true,filename:true,mimeType:true,size:true,kind:true}})}}catch{await unlink(diskPath).catch(()=>undefined);return{error:"Database failure. The upload was not added to the Media Library."}}
}

export async function loginAction(_:ActionState, formData:FormData):Promise<ActionState>{
  const parsed=loginSchema.safeParse({email:formData.get("email"),password:formData.get("password")});
  if(!parsed.success)return {error:"Enter a valid email and a password of at least 8 characters."};
  const user=await prisma.adminUser.findUnique({where:{email:parsed.data.email}});
  if(!user||!(await compare(parsed.data.password,user.passwordHash)))return {error:"Invalid email or password."};
  await createSession(user.id); redirect("/admin");
}
export async function logoutAction(){await destroySession();redirect("/admin/login");}

export async function saveTypography(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const rawJson = str(f, "typographyJson");
  if (!rawJson) {
    await saveFontSizes(f);
    revalidatePath("/", "layout");
    revalidatePath("/admin/typography");
    return { success: "Section font sizes saved." };
  }

  let data: Array<{
    sectionKey: string;
    role: TypographyRole;
    locale?: string;
    fontSizeMobile?: number | null;
    fontSizeDesktop?: number | null;
    lineHeight?: number | null;
    fontWeight?: number | null;
  }>;

  try {
    data = JSON.parse(rawJson);
  } catch {
    return { error: "The submitted typography data is invalid. Refresh and try again." };
  }

  // Validate each record against safe bounds
  for (const item of data) {
    if (!TYPOGRAPHY_ROLES[item.role]) {
      return { error: `Unrecognized typography role: ${item.role}` };
    }
    const err = validateTypographyValue(item.role, {
      fontSizeMobile: item.fontSizeMobile ?? undefined,
      fontSizeDesktop: item.fontSizeDesktop ?? undefined,
      lineHeight: item.lineHeight ?? undefined,
      fontWeight: item.fontWeight ?? undefined,
    });
    if (err) {
      return { error: err };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of data) {
        const localeKey = item.locale || "all";
        const uniqueKey = `${item.sectionKey}:${item.role}:${localeKey}`;
        
        const hasValues = 
          (item.fontSizeMobile !== null && item.fontSizeMobile !== undefined) ||
          (item.fontSizeDesktop !== null && item.fontSizeDesktop !== undefined) ||
          (item.lineHeight !== null && item.lineHeight !== undefined) ||
          (item.fontWeight !== null && item.fontWeight !== undefined);

        if (!hasValues) {
          await tx.typographySetting.deleteMany({
            where: { key: uniqueKey },
          });
        } else {
          await tx.typographySetting.upsert({
            where: { key: uniqueKey },
            create: {
              key: uniqueKey,
              fontSizeMobile: item.fontSizeMobile ? Math.round(item.fontSizeMobile) : null,
              fontSizeDesktop: item.fontSizeDesktop ? Math.round(item.fontSizeDesktop) : null,
              lineHeight: item.lineHeight ? Number(item.lineHeight.toFixed(2)) : null,
              fontWeight: item.fontWeight ? Math.round(item.fontWeight) : null,
            },
            update: {
              fontSizeMobile: item.fontSizeMobile ? Math.round(item.fontSizeMobile) : null,
              fontSizeDesktop: item.fontSizeDesktop ? Math.round(item.fontSizeDesktop) : null,
              lineHeight: item.lineHeight ? Number(item.lineHeight.toFixed(2)) : null,
              fontWeight: item.fontWeight ? Math.round(item.fontWeight) : null,
            },
          });
        }
      }
    });
  } catch (error) {
    console.error("Unable to save typography settings", error);
    return { error: "Failed to persist typography settings. Please try again." };
  }

  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath("/en/about");
  revalidatePath("/ar/about");
  revalidatePath("/admin/typography");
  revalidatePath("/", "layout");
  return { success: "Typography settings saved and published successfully." };
}

export async function savePageSections(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  let input:unknown;try{input=JSON.parse(str(f,"pageSections"))}catch{return{error:"The section data is invalid. Refresh and try again."}}
  const parsed=parsePageBlocksInput(input);
  if("error" in parsed)return parsed;
  const rows=parsed.rows;const pages=BLOCK_PAGES;
  try{
    await prisma.$transaction(async tx=>{const ids=rows.map(row=>row.id);await tx.pageSection.deleteMany({where:ids.length?{id:{notIn:ids}}:{}});for(const row of rows)await tx.pageSection.upsert({where:{id:row.id},create:row,update:row})});
  }catch(error){console.error("Unable to save page sections",error);return{error:"The page sections could not be saved. No changes were published. Please try again."}}
  for(const locale of ["en","ar"]){revalidatePath(`/${locale}`);for(const page of pages){if(page!=="home")revalidatePath(`/${locale}/${page}`)}}
  revalidatePath("/admin/sections");
  refresh();
  return{success:`Saved ${rows.length} section${rows.length===1?"":"s"}. Your page layouts are now published.`};
}

export async function saveHomepage(_:ActionState, f:FormData):Promise<ActionState>{
  await requireAdmin(); const required=["heroEyebrowEn","heroEyebrowAr","heroTitleEn","heroTitleAr","heroNoteEn","heroNoteAr","heroMediaUrl","lifestyleTitleEn","lifestyleTitleAr","closingTitleEn","closingTitleAr"];
  if(required.some(k=>!str(f,k)))return {error:"Complete all required English and Arabic fields."};
  const colorKeys=["openingBackgroundRgb","heroBackgroundRgb","projectsBackgroundRgb","aboutBackgroundRgb","lifestyleBackgroundRgb","statsBackgroundRgb","journalBackgroundRgb","closingBackgroundRgb","footerBackgroundRgb"] as const;
  const colorEntries=colorKeys.map(key=>[key,rgb(f,key)] as const);
  if(colorEntries.some(([,value])=>value===null))return {error:"Enter every background as three RGB numbers from 0 to 255, for example 255, 255, 255."};
  const colors=Object.fromEntries(colorEntries) as Record<(typeof colorKeys)[number],string>;
  const order=str(f,"sectionOrder").split(",").map(x=>x.trim()).filter(x=>["projects","lifestyle","stats","journal","closing"].includes(x));
  if(!sectionOrderSchema.safeParse(order).success)return {error:"Section order must contain each supported section exactly once."};
  await prisma.homepage.update({where:{id:"homepage"},data:colors});
  await prisma.homepage.update({where:{id:"homepage"},data:{heroEnabled:bool(f,"heroEnabled"),heroEyebrowEn:str(f,"heroEyebrowEn"),heroEyebrowAr:str(f,"heroEyebrowAr"),heroTitleEn:str(f,"heroTitleEn"),heroTitleAr:str(f,"heroTitleAr"),heroNoteEn:str(f,"heroNoteEn"),heroNoteAr:str(f,"heroNoteAr"),heroDiscoverEn:str(f,"heroDiscoverEn"),heroDiscoverAr:str(f,"heroDiscoverAr"),heroMediaUrl:str(f,"heroMediaUrl"),heroMediaAltEn:str(f,"heroMediaAltEn"),heroMediaAltAr:str(f,"heroMediaAltAr"),projectsEnabled:bool(f,"projectsEnabled"),projectsHeadingEn:str(f,"projectsHeadingEn"),projectsHeadingAr:str(f,"projectsHeadingAr"),projectsDescriptionEn:str(f,"projectsDescriptionEn")||null,projectsDescriptionAr:str(f,"projectsDescriptionAr")||null,projectsExploreEn:str(f,"projectsExploreEn"),projectsExploreAr:str(f,"projectsExploreAr"),projectsEnquireEn:str(f,"projectsEnquireEn")||"Enquire",projectsEnquireAr:str(f,"projectsEnquireAr")||"استفسر الآن",projectsViewAllEn:str(f,"projectsViewAllEn")||"View All Projects",projectsViewAllAr:str(f,"projectsViewAllAr")||"جميع المشاريع",projectsSpacing:str(f,"projectsSpacing")||"standard",projectsTheme:str(f,"projectsTheme")||"light",projectsImagePosition:str(f,"projectsImagePosition")||"start",projectsLocationTagsEnabled:bool(f,"projectsLocationTagsEnabled"),projectsAllLabelEn:str(f,"projectsAllLabelEn")||"All Projects",projectsAllLabelAr:str(f,"projectsAllLabelAr")||"كافة المشاريع",projectsShowTagCounts:bool(f,"projectsShowTagCounts"),projectsLocationOrder:str(f,"projectsLocationOrder")||"auto",projectsVisibleLocations:(()=>{const visible=f.getAll("projectsVisibleLocation").map(String);return visible.length>0?JSON.stringify(visible):null;})(),lifestyleEnabled:bool(f,"lifestyleEnabled"),lifestyleEyebrowEn:str(f,"lifestyleEyebrowEn"),lifestyleEyebrowAr:str(f,"lifestyleEyebrowAr"),lifestyleTitleEn:str(f,"lifestyleTitleEn"),lifestyleTitleAr:str(f,"lifestyleTitleAr"),lifestyleMediaUrl:str(f,"lifestyleMediaUrl"),lifestyleMediaAltEn:str(f,"lifestyleMediaAltEn"),lifestyleMediaAltAr:str(f,"lifestyleMediaAltAr"),lifestyleCtaLabelEn:str(f,"lifestyleCtaLabelEn")||"Discover Our Story",lifestyleCtaLabelAr:str(f,"lifestyleCtaLabelAr")||"اكتشف قصتنا",lifestyleCtaUrl:str(f,"lifestyleCtaUrl")||"/about",statsEnabled:bool(f,"statsEnabled"),statsLabelEn:str(f,"statsLabelEn")||null,statsLabelAr:str(f,"statsLabelAr")||null,statsHeadingEn:str(f,"statsHeadingEn")||"Stories, ideas, and updates.",statsHeadingAr:str(f,"statsHeadingAr")||"قصص وأفكار ومستجدات",statsDescriptionEn:str(f,"statsDescriptionEn")||null,statsDescriptionAr:str(f,"statsDescriptionAr")||null,statsImageUrl:str(f,"statsImageUrl")||null,statsImageAltEn:str(f,"statsImageAltEn")||"Image Developments architecture",statsImageAltAr:str(f,"statsImageAltAr")||"العمارة المعاصرة في إيمدج للتطوير العقاري",statsImageFocalPoint:str(f,"statsImageFocalPoint")||"center",statsCtaLabelEn:str(f,"statsCtaLabelEn")||"View All Articles",statsCtaLabelAr:str(f,"statsCtaLabelAr")||"عرض جميع المقالات",statsCtaUrl:str(f,"statsCtaUrl")||"/journal",statsJournalMode:str(f,"statsJournalMode")||"AUTO",statsJournalCategory:str(f,"statsJournalCategory")||"ALL",statsJournalCount:parseInt(str(f,"statsJournalCount")||"3",10)||3,statsJournalArticleIds:str(f,"statsJournalArticleIds")||"[]",journalEnabled:bool(f,"journalEnabled"),journalEyebrowEn:str(f,"journalEyebrowEn"),journalEyebrowAr:str(f,"journalEyebrowAr"),journalTitleEn:str(f,"journalTitleEn"),journalTitleAr:str(f,"journalTitleAr"),closingEnabled:bool(f,"closingEnabled"),closingEyebrowEn:str(f,"closingEyebrowEn"),closingEyebrowAr:str(f,"closingEyebrowAr"),closingTitleEn:str(f,"closingTitleEn"),closingTitleAr:str(f,"closingTitleAr"),closingDescriptionEn:str(f,"closingDescriptionEn")||null,closingDescriptionAr:str(f,"closingDescriptionAr")||null,closingFormHeadingEn:str(f,"closingFormHeadingEn")||null,closingFormHeadingAr:str(f,"closingFormHeadingAr")||null,closingSubmitLabelEn:str(f,"closingSubmitLabelEn")||null,closingSubmitLabelAr:str(f,"closingSubmitLabelAr")||null,closingSuccessMessageEn:str(f,"closingSuccessMessageEn")||null,closingSuccessMessageAr:str(f,"closingSuccessMessageAr")||null,closingCtaEn:str(f,"closingCtaEn"),closingCtaAr:str(f,"closingCtaAr"),closingCtaUrl:str(f,"closingCtaUrl"),sectionOrder:JSON.stringify(order)}});
  await prisma.homepage.update({where:{id:"homepage"},data:{openingEnabled:bool(f,"openingEnabled"),openingHeadlineEn:str(f,"openingHeadlineEn"),openingHeadlineAr:str(f,"openingHeadlineAr"),openingVideoDesktopUrl:str(f,"openingVideoDesktopUrl")||null,openingVideoMobileUrl:str(f,"openingVideoMobileUrl")||null,openingPosterUrl:str(f,"openingPosterUrl")||null,heroVideoDesktopUrl:str(f,"heroVideoDesktopUrl")||null,heroVideoMobileUrl:str(f,"heroVideoMobileUrl")||null,heroMobileMediaUrl:str(f,"heroMobileMediaUrl")||null,heroPosterUrl:str(f,"heroPosterUrl")||null}});
  for(const id of f.getAll("statId").map(String)){
    const isVisible = f.has(`statVisible_${id}`) ? bool(f, `statVisible_${id}`) : true;
    const order = parseInt(str(f, `statOrder_${id}`) || "0", 10);
    await prisma.stat.update({
      where: { id },
      data: {
        valueEn: str(f, `statValueEn_${id}`),
        valueAr: str(f, `statValueAr_${id}`),
        unitEn: str(f, `statUnitEn_${id}`) || null,
        unitAr: str(f, `statUnitAr_${id}`) || null,
        labelEn: str(f, `statLabelEn_${id}`),
        labelAr: str(f, `statLabelAr_${id}`),
        visible: isVisible,
        sortOrder: isNaN(order) ? 0 : order,
      },
    });
  }
  const managedProjectIds = f.getAll("managedProjectId").map(String);
  for (const pid of managedProjectIds) {
    const isFeatured = bool(f, `projectFeatured_${pid}`);
    const orderVal = parseInt(str(f, `projectOrder_${pid}`) || "0", 10);
    await prisma.project.update({
      where: { id: pid },
      data: {
        featured: isFeatured,
        featuredOrder: isNaN(orderVal) ? 0 : orderVal,
      },
    });
  }
  const availableArticleIds = f.getAll("availableArticleId").map(String);
  if (availableArticleIds.length > 0) {
    const selectedArticlesWithOrder = availableArticleIds
      .filter(id => bool(f, `manualArticleSelect_${id}`))
      .map(id => ({
        id,
        order: parseInt(str(f, `manualArticleOrder_${id}`) || "99", 10),
      }))
      .sort((a, b) => a.order - b.order);
    
    const manualIds = selectedArticlesWithOrder.map(item => item.id);
    await prisma.homepage.update({
      where: { id: "homepage" },
      data: { statsJournalArticleIds: JSON.stringify(manualIds) },
    });
  }
  await saveFontSizes(f);
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/admin/homepage");
  revalidatePath("/", "layout");
  return {success:"Homepage saved."};
}

export async function saveAbout(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const required=["aboutHeroEyebrowEn","aboutHeroEyebrowAr","aboutHeroTitleEn","aboutHeroTitleAr","aboutHeroBodyEn","aboutHeroBodyAr","aboutHeroImageUrl","aboutHeroImageAltEn","aboutHeroImageAltAr","aboutEyebrowEn","aboutEyebrowAr","aboutTitleEn","aboutTitleAr","aboutIntroEn","aboutIntroAr"];
  if(required.some(key=>!str(f,key)))return{error:"Complete all required English and Arabic fields."};
  const ids=f.getAll("aboutItemId").map(String);
  if(ids.length>100||new Set(ids).size!==ids.length)return{error:"The magazine page list is invalid. Refresh and try again."};
  for(const id of ids){
    const itemRequired=[`aboutYear_${id}`,`aboutItemTitle_${id}En`,`aboutItemTitle_${id}Ar`,`aboutItemBody_${id}En`,`aboutItemBody_${id}Ar`,`aboutImage_${id}`,`aboutImageAlt_${id}En`,`aboutImageAlt_${id}Ar`];
    if(itemRequired.some(key=>!str(f,key)))return{error:"Complete every timeline page before saving."};
  }
  const blockIds=f.getAll("aboutBlockId").map(String);
  if(blockIds.length>100||new Set(blockIds).size!==blockIds.length)return{error:"The content section list is invalid. Refresh and try again."};
  for(const id of blockIds){
    const blockRequired=[`aboutBlockEyebrow_${id}En`,`aboutBlockEyebrow_${id}Ar`,`aboutBlockTitle_${id}En`,`aboutBlockTitle_${id}Ar`,`aboutBlockBody_${id}En`,`aboutBlockBody_${id}Ar`];
    if(blockRequired.some(key=>!str(f,key)))return{error:"Complete every English and Arabic content section before saving."};
    if(str(f,`aboutBlockImage_${id}`)&&(!str(f,`aboutBlockImageAlt_${id}En`)||!str(f,`aboutBlockImageAlt_${id}Ar`)))return{error:"Add English and Arabic alt text for every section image."};
  }
  await prisma.$transaction(async tx=>{
    const brochureVal = str(f, "companyBrochureUrl");
    if (brochureVal !== undefined) {
      await tx.globalSettings.update({
        where: { id: "global" },
        data: { companyBrochureUrl: brochureVal || null },
      });
    }

    await tx.homepage.update({
      where: { id: "homepage" },
      data: {
        aboutHeroEnabled: bool(f, "aboutHeroEnabled"),
        aboutHeroEyebrowEn: str(f, "aboutHeroEyebrowEn"),
        aboutHeroEyebrowAr: str(f, "aboutHeroEyebrowAr"),
        aboutHeroTitleEn: str(f, "aboutHeroTitleEn"),
        aboutHeroTitleAr: str(f, "aboutHeroTitleAr"),
        aboutHeroBodyEn: str(f, "aboutHeroBodyEn"),
        aboutHeroBodyAr: str(f, "aboutHeroBodyAr"),
        aboutHeroImageUrl: str(f, "aboutHeroImageUrl"),
        aboutHeroImageAltEn: str(f, "aboutHeroImageAltEn"),
        aboutHeroImageAltAr: str(f, "aboutHeroImageAltAr"),
        aboutHeroCtaLabelEn: str(f, "aboutHeroCtaLabelEn") || "Explore Our Journey",
        aboutHeroCtaLabelAr: str(f, "aboutHeroCtaLabelAr") || "اكتشف رحلتنا",

        aboutWhoWeAreEnabled: bool(f, "aboutWhoWeAreEnabled"),
        aboutWhoWeAreEyebrowEn: str(f, "aboutWhoWeAreEyebrowEn") || "Who We Are",
        aboutWhoWeAreEyebrowAr: str(f, "aboutWhoWeAreEyebrowAr") || "من نحن",
        aboutWhoWeAreTitleEn: str(f, "aboutWhoWeAreTitleEn") || "Shaping Considered Communities Across Egypt",
        aboutWhoWeAreTitleAr: str(f, "aboutWhoWeAreTitleAr") || "صناعة مجتمعات متكاملة ومدروسة في مصر",
        aboutWhoWeAreBodyEn: str(f, "aboutWhoWeAreBodyEn") || "",
        aboutWhoWeAreBodyAr: str(f, "aboutWhoWeAreBodyAr") || "",
        aboutWhoWeAreApproachEn: str(f, "aboutWhoWeAreApproachEn") || null,
        aboutWhoWeAreApproachAr: str(f, "aboutWhoWeAreApproachAr") || null,
        aboutWhoWeAreImageUrl: str(f, "aboutWhoWeAreImageUrl") || null,
        aboutWhoWeAreImageAltEn: str(f, "aboutWhoWeAreImageAltEn") || null,
        aboutWhoWeAreImageAltAr: str(f, "aboutWhoWeAreImageAltAr") || null,
        aboutWhoWeArePrimaryCtaEn: str(f, "aboutWhoWeArePrimaryCtaEn") || "Explore Our Projects",
        aboutWhoWeArePrimaryCtaAr: str(f, "aboutWhoWeArePrimaryCtaAr") || "استكشف مشاريعنا",
        aboutWhoWeArePrimaryCtaUrl: str(f, "aboutWhoWeArePrimaryCtaUrl") || "/projects",
        aboutWhoWeAreBrochureCtaEn: str(f, "aboutWhoWeAreBrochureCtaEn") || "Download Brochure",
        aboutWhoWeAreBrochureCtaAr: str(f, "aboutWhoWeAreBrochureCtaAr") || "تحميل البروشور",

        aboutEnabled: bool(f, "aboutEnabled"),
        aboutEyebrowEn: str(f, "aboutEyebrowEn"),
        aboutEyebrowAr: str(f, "aboutEyebrowAr"),
        aboutTitleEn: str(f, "aboutTitleEn"),
        aboutTitleAr: str(f, "aboutTitleAr"),
        aboutIntroEn: str(f, "aboutIntroEn"),
        aboutIntroAr: str(f, "aboutIntroAr"),

        aboutVisionMissionEnabled: bool(f, "aboutVisionMissionEnabled"),
        aboutVisionEyebrowEn: str(f, "aboutVisionEyebrowEn") || "Our Vision",
        aboutVisionEyebrowAr: str(f, "aboutVisionEyebrowAr") || "رؤيتنا",
        aboutVisionTitleEn: str(f, "aboutVisionTitleEn") || "",
        aboutVisionTitleAr: str(f, "aboutVisionTitleAr") || "",
        aboutVisionBodyEn: str(f, "aboutVisionBodyEn") || "",
        aboutVisionBodyAr: str(f, "aboutVisionBodyAr") || "",
        aboutMissionEyebrowEn: str(f, "aboutMissionEyebrowEn") || "Our Mission",
        aboutMissionEyebrowAr: str(f, "aboutMissionEyebrowAr") || "رسالتنا",
        aboutMissionTitleEn: str(f, "aboutMissionTitleEn") || "",
        aboutMissionTitleAr: str(f, "aboutMissionTitleAr") || "",
        aboutMissionBodyEn: str(f, "aboutMissionBodyEn") || "",
        aboutMissionBodyAr: str(f, "aboutMissionBodyAr") || "",
        aboutVisionMissionImageUrl: str(f, "aboutVisionMissionImageUrl") || null,
        aboutVisionMissionImageAltEn: str(f, "aboutVisionMissionImageAltEn") || null,
        aboutVisionMissionImageAltAr: str(f, "aboutVisionMissionImageAltAr") || null,
        aboutVisionMissionCtaEn: str(f, "aboutVisionMissionCtaEn") || "Explore Our Projects",
        aboutVisionMissionCtaAr: str(f, "aboutVisionMissionCtaAr") || "استكشف مشاريعنا",
        aboutVisionMissionCtaUrl: str(f, "aboutVisionMissionCtaUrl") || "/projects",

        aboutAchievementsEnabled: bool(f, "aboutAchievementsEnabled"),
        aboutAchievementsEyebrowEn: str(f, "aboutAchievementsEyebrowEn") || "Our Achievements",
        aboutAchievementsEyebrowAr: str(f, "aboutAchievementsEyebrowAr") || "إنجازاتنا",
        aboutAchievementsTitleEn: str(f, "aboutAchievementsTitleEn") || "",
        aboutAchievementsTitleAr: str(f, "aboutAchievementsTitleAr") || "",
        aboutAchievementsDescriptionEn: str(f, "aboutAchievementsDescriptionEn") || null,
        aboutAchievementsDescriptionAr: str(f, "aboutAchievementsDescriptionAr") || null,
        aboutAchievementsCtaEn: str(f, "aboutAchievementsCtaEn") || "View Our Track Record",
        aboutAchievementsCtaAr: str(f, "aboutAchievementsCtaAr") || "استعرض سجل إنجازاتنا",
        aboutAchievementsCtaUrl: str(f, "aboutAchievementsCtaUrl") || "/projects",

        aboutLeadershipEnabled: bool(f, "aboutLeadershipEnabled"),
        aboutLeadershipEyebrowEn: str(f, "aboutLeadershipEyebrowEn") || "Executive Leadership",
        aboutLeadershipEyebrowAr: str(f, "aboutLeadershipEyebrowAr") || "القيادة التنفيذية",
        aboutLeadershipTitleEn: str(f, "aboutLeadershipTitleEn") || "",
        aboutLeadershipTitleAr: str(f, "aboutLeadershipTitleAr") || "",
        aboutLeadershipDescriptionEn: str(f, "aboutLeadershipDescriptionEn") || null,
        aboutLeadershipDescriptionAr: str(f, "aboutLeadershipDescriptionAr") || null,
        aboutLeadershipCtaEn: str(f, "aboutLeadershipCtaEn") || "Contact Our Team",
        aboutLeadershipCtaAr: str(f, "aboutLeadershipCtaAr") || "تواصل مع فريقنا",
        aboutLeadershipCtaUrl: str(f, "aboutLeadershipCtaUrl") || "/contact",
      },
    });
    const existing=await tx.aboutMilestone.findMany({where:{homepageId:"homepage"},select:{id:true}});
    const existingIds=new Set(existing.map(item=>item.id));
    const retainedIds=ids.filter(id=>existingIds.has(id));
    await tx.aboutMilestone.deleteMany({where:{homepageId:"homepage",...(retainedIds.length?{id:{notIn:retainedIds}}:{})}});
    for(const [index,id] of ids.entries()){
      const data={year:str(f,`aboutYear_${id}`),titleEn:str(f,`aboutItemTitle_${id}En`),titleAr:str(f,`aboutItemTitle_${id}Ar`),bodyEn:str(f,`aboutItemBody_${id}En`),bodyAr:str(f,`aboutItemBody_${id}Ar`),imageUrl:str(f,`aboutImage_${id}`),imageAltEn:str(f,`aboutImageAlt_${id}En`),imageAltAr:str(f,`aboutImageAlt_${id}Ar`),sortOrder:index};
      if(existingIds.has(id))await tx.aboutMilestone.update({where:{id},data});
      else await tx.aboutMilestone.create({data:{...data,homepageId:"homepage"}});
    }
    const existingBlocks=await tx.aboutContentBlock.findMany({where:{homepageId:"homepage"},select:{id:true}});
    const existingBlockIds=new Set(existingBlocks.map(item=>item.id));
    const retainedBlockIds=blockIds.filter(id=>existingBlockIds.has(id));
    await tx.aboutContentBlock.deleteMany({where:{homepageId:"homepage",...(retainedBlockIds.length?{id:{notIn:retainedBlockIds}}:{})}});
    for(const [index,id] of blockIds.entries()){
      const imageUrl=str(f,`aboutBlockImage_${id}`)||null;
      const data={enabled:bool(f,`aboutBlockEnabled_${id}`),eyebrowEn:str(f,`aboutBlockEyebrow_${id}En`),eyebrowAr:str(f,`aboutBlockEyebrow_${id}Ar`),titleEn:str(f,`aboutBlockTitle_${id}En`),titleAr:str(f,`aboutBlockTitle_${id}Ar`),bodyEn:str(f,`aboutBlockBody_${id}En`),bodyAr:str(f,`aboutBlockBody_${id}Ar`),imageUrl,imageAltEn:imageUrl?str(f,`aboutBlockImageAlt_${id}En`):null,imageAltAr:imageUrl?str(f,`aboutBlockImageAlt_${id}Ar`):null,sortOrder:index};
      if(existingBlockIds.has(id))await tx.aboutContentBlock.update({where:{id},data});else await tx.aboutContentBlock.create({data:{...data,homepageId:"homepage"}});
    }
  });
  await saveFontSizes(f);
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/about");
  revalidatePath("/ar/about");
  revalidatePath("/en/history");
  revalidatePath("/ar/history");
  revalidatePath("/admin/about");
  revalidatePath("/", "layout");
  return{success:"About page saved."};
}

export async function saveTeam(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  if(["teamEyebrowEn","teamEyebrowAr","teamTitleEn","teamTitleAr","teamIntroEn","teamIntroAr"].some(key=>!str(f,key)))return{error:"Complete all required English and Arabic page fields."};
  const ids=f.getAll("teamMemberId").map(String);
  if(ids.length>100||new Set(ids).size!==ids.length)return{error:"The team member list is invalid. Refresh and try again."};
  for(const id of ids){if([`teamName_${id}En`,`teamName_${id}Ar`,`teamRole_${id}En`,`teamRole_${id}Ar`,`teamBio_${id}En`,`teamBio_${id}Ar`,`teamImage_${id}`,`teamImageAlt_${id}En`,`teamImageAlt_${id}Ar`].some(key=>!str(f,key)))return{error:"Complete every team member profile in English and Arabic."}}
  await prisma.$transaction(async tx=>{await tx.homepage.update({where:{id:"homepage"},data:{teamEyebrowEn:str(f,"teamEyebrowEn"),teamEyebrowAr:str(f,"teamEyebrowAr"),teamTitleEn:str(f,"teamTitleEn"),teamTitleAr:str(f,"teamTitleAr"),teamIntroEn:str(f,"teamIntroEn"),teamIntroAr:str(f,"teamIntroAr")}});const existing=await tx.teamMember.findMany({where:{homepageId:"homepage"},select:{id:true}});const existingIds=new Set(existing.map(x=>x.id));const retained=ids.filter(id=>existingIds.has(id));await tx.teamMember.deleteMany({where:{homepageId:"homepage",...(retained.length?{id:{notIn:retained}}:{})}});for(const[index,id]of ids.entries()){const data={nameEn:str(f,`teamName_${id}En`),nameAr:str(f,`teamName_${id}Ar`),roleEn:str(f,`teamRole_${id}En`),roleAr:str(f,`teamRole_${id}Ar`),bioEn:str(f,`teamBio_${id}En`),bioAr:str(f,`teamBio_${id}Ar`),imageUrl:str(f,`teamImage_${id}`),imageAltEn:str(f,`teamImageAlt_${id}En`),imageAltAr:str(f,`teamImageAlt_${id}Ar`),visible:bool(f,`teamVisible_${id}`),sortOrder:index};if(existingIds.has(id))await tx.teamMember.update({where:{id},data});else await tx.teamMember.create({data:{...data,homepageId:"homepage"}})}});
  await saveFontSizes(f);revalidatePath("/en/team");revalidatePath("/ar/team");revalidatePath("/admin/team");return{success:"Team page saved."};
}

export async function savePartners(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  if(["partnersEyebrowEn","partnersEyebrowAr","partnersTitleEn","partnersTitleAr","partnersIntroEn","partnersIntroAr"].some(key=>!str(f,key)))return{error:"Complete all required English and Arabic page fields."};
  const ids=f.getAll("partnerId").map(String);
  if(ids.length>100||new Set(ids).size!==ids.length)return{error:"The partner list is invalid. Refresh and try again."};
  for(const id of ids){
    const nameEn=str(f,`partnerName_${id}En`);
    const nameAr=str(f,`partnerName_${id}Ar`);
    if(!nameEn&&!nameAr)return{error:`Partner requires a name.`};
    const logo=str(f,`partnerLogo_${id}`);
    if(!logo)return{error:`Partner (${nameEn||nameAr}) requires a logo image.`};

  }
  await prisma.$transaction(async tx=>{
    await tx.homepage.update({where:{id:"homepage"},data:{partnersEyebrowEn:str(f,"partnersEyebrowEn"),partnersEyebrowAr:str(f,"partnersEyebrowAr"),partnersTitleEn:str(f,"partnersTitleEn"),partnersTitleAr:str(f,"partnersTitleAr"),partnersIntroEn:str(f,"partnersIntroEn"),partnersIntroAr:str(f,"partnersIntroAr")}});
    const existing=await tx.partner.findMany({where:{homepageId:"homepage"},select:{id:true}});const existingIds=new Set(existing.map(x=>x.id));const retained=ids.filter(id=>existingIds.has(id));
    await tx.partner.deleteMany({where:{homepageId:"homepage",...(retained.length?{id:{notIn:retained}}:{})}});
    for(const[index,id]of ids.entries()){
      const rawNameEn=str(f,`partnerName_${id}En`);
      const rawNameAr=str(f,`partnerName_${id}Ar`);
      const nameEn=rawNameEn||rawNameAr;
      const nameAr=rawNameAr||rawNameEn;
      const logoUrl=str(f,`partnerLogo_${id}`);
      const logoAltEn=str(f,`partnerLogoAlt_${id}En`)||nameEn||"Partner logo";
      const logoAltAr=str(f,`partnerLogoAlt_${id}Ar`)||nameAr||logoAltEn||"شعار الشريك";
      let websiteUrl=str(f,`partnerWebsite_${id}`)||null;
      if(websiteUrl&&!/^https?:\/\//i.test(websiteUrl)){websiteUrl=`https://${websiteUrl}`;}
      const data={nameEn,nameAr,descriptionEn:str(f,`partnerDescription_${id}En`)||null,descriptionAr:str(f,`partnerDescription_${id}Ar`)||null,logoUrl,logoAltEn,logoAltAr,websiteUrl,visible:bool(f,`partnerVisible_${id}`),sortOrder:index};
      if(existingIds.has(id))await tx.partner.update({where:{id},data});
      else await tx.partner.create({data:{...data,homepageId:"homepage"}});
    }
  });
  await saveFontSizes(f);revalidatePath("/en/partners");revalidatePath("/ar/partners");revalidatePath("/admin/partners");revalidatePath("/","layout");return{success:"Partners page saved."};
}

export async function savePolicy(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  if(["policyEyebrowEn","policyEyebrowAr","policyPageTitleEn","policyPageTitleAr","policyIntroEn","policyIntroAr"].some(key=>!str(f,key)))return{error:"Complete all required page fields."};
  const ids=f.getAll("policySectionId").map(String);if(ids.length>100||new Set(ids).size!==ids.length)return{error:"The policy section list is invalid. Refresh and try again."};
  const slugs=new Set<string>();for(const id of ids){const slug=str(f,`policySlug_${id}`);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slugs.has(slug))return{error:"Every policy document needs a unique lowercase slug using letters, numbers and hyphens."};slugs.add(slug);if([`policyTitle_${id}En`,`policyTitle_${id}Ar`,`policyBody_${id}En`,`policyBody_${id}Ar`].some(key=>!str(f,key)))return{error:"Complete every policy document in English and Arabic."}}
  await prisma.$transaction(async tx=>{await tx.policyPage.update({where:{id:"policypage"},data:{heroEyebrowEn:str(f,"policyEyebrowEn"),heroEyebrowAr:str(f,"policyEyebrowAr"),heroTitleEn:str(f,"policyPageTitleEn"),heroTitleAr:str(f,"policyPageTitleAr"),heroBodyEn:str(f,"policyIntroEn"),heroBodyAr:str(f,"policyIntroAr")}});const existing=await tx.policyDocument.findMany({where:{policyPageId:"policypage"},select:{id:true}});const existingIds=new Set(existing.map(item=>item.id));const retained=ids.filter(id=>existingIds.has(id));await tx.policyDocument.deleteMany({where:{policyPageId:"policypage",...(retained.length?{id:{notIn:retained}}:{})}});for(const[index,id]of ids.entries()){const data={slug:str(f,`policySlug_${id}`),titleEn:str(f,`policyTitle_${id}En`),titleAr:str(f,`policyTitle_${id}Ar`),summaryEn:str(f,`policySummary_${id}En`),summaryAr:str(f,`policySummary_${id}Ar`),contentEn:str(f,`policyBody_${id}En`),contentAr:str(f,`policyBody_${id}Ar`),visible:bool(f,`policyVisible_${id}`),sortOrder:index};if(existingIds.has(id))await tx.policyDocument.update({where:{id},data});else await tx.policyDocument.create({data:{...data,policyPageId:"policypage"}})}});
  await saveFontSizes(f);revalidatePath("/en/policy");revalidatePath("/ar/policy");revalidatePath("/admin/policy");revalidatePath("/", "layout");return{success:"Policy page saved."};
}

export async function saveTerms(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();if(["termsEyebrowEn","termsEyebrowAr","termsPageTitleEn","termsPageTitleAr","termsIntroEn","termsIntroAr"].some(key=>!str(f,key)))return{error:"Complete all required page fields."};
  const ids=f.getAll("termsSectionId").map(String);if(ids.length>100||new Set(ids).size!==ids.length)return{error:"The terms section list is invalid. Refresh and try again."};const slugs=new Set<string>();for(const id of ids){const slug=str(f,`termsSlug_${id}`);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slugs.has(slug))return{error:"Every terms section needs a unique lowercase slug using letters, numbers and hyphens."};slugs.add(slug);if([`termsTitle_${id}En`,`termsTitle_${id}Ar`,`termsBody_${id}En`,`termsBody_${id}Ar`].some(key=>!str(f,key)))return{error:"Complete every terms section in English and Arabic."}}
  await prisma.$transaction(async tx=>{await tx.termsPage.update({where:{id:"termspage"},data:{heroEyebrowEn:str(f,"termsEyebrowEn"),heroEyebrowAr:str(f,"termsEyebrowAr"),heroTitleEn:str(f,"termsPageTitleEn"),heroTitleAr:str(f,"termsPageTitleAr"),heroBodyEn:str(f,"termsIntroEn"),heroBodyAr:str(f,"termsIntroAr")}});const existing=await tx.termsSection.findMany({where:{termsPageId:"termspage"},select:{id:true}});const existingIds=new Set(existing.map(item=>item.id));const retained=ids.filter(id=>existingIds.has(id));await tx.termsSection.deleteMany({where:{termsPageId:"termspage",...(retained.length?{id:{notIn:retained}}:{})}});for(const[index,id]of ids.entries()){const data={slug:str(f,`termsSlug_${id}`),titleEn:str(f,`termsTitle_${id}En`),titleAr:str(f,`termsTitle_${id}Ar`),contentEn:str(f,`termsBody_${id}En`),contentAr:str(f,`termsBody_${id}Ar`),visible:bool(f,`termsVisible_${id}`),sortOrder:index};if(existingIds.has(id))await tx.termsSection.update({where:{id},data});else await tx.termsSection.create({data:{...data,termsPageId:"termspage"}})}});await saveFontSizes(f);revalidatePath("/en/terms");revalidatePath("/ar/terms");revalidatePath("/admin/terms");revalidatePath("/", "layout");return{success:"Terms page saved."};
}

export async function saveContactPage(_:ActionState,f:FormData):Promise<ActionState>{await requireAdmin();if(["contactEyebrowEn","contactEyebrowAr","contactPageTitleEn","contactPageTitleAr","contactIntroEn","contactIntroAr"].some(key=>!str(f,key)))return{error:"Complete all required page fields."};await prisma.contactPage.update({where:{id:"contactpage"},data:{heroEyebrowEn:str(f,"contactEyebrowEn"),heroEyebrowAr:str(f,"contactEyebrowAr"),heroTitleEn:str(f,"contactPageTitleEn"),heroTitleAr:str(f,"contactPageTitleAr"),heroBodyEn:str(f,"contactIntroEn"),heroBodyAr:str(f,"contactIntroAr")}});await saveFontSizes(f);revalidatePath("/en/contact");revalidatePath("/ar/contact");revalidatePath("/admin/contact");revalidatePath("/", "layout");return{success:"Contact page saved."};}

export async function saveProject(_: ActionState, f: FormData): Promise<ActionState & { projectId?: string }> {
  await requireAdmin();
  const rawStatus = str(f, "status") || "DRAFT";
  const validStatus = (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(rawStatus) ? rawStatus : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const rawSlug = str(f, "slug") || str(f, "nameEn");
  const nameEn = str(f, "nameEn");
  const nameAr = str(f, "nameAr") || nameEn;
  const shortDescriptionEn = str(f, "shortDescriptionEn");
  const shortDescriptionAr = str(f, "shortDescriptionAr") || shortDescriptionEn;
  const locationEn = str(f, "locationEn");
  const locationAr = str(f, "locationAr") || locationEn;
  const coverImageUrl = str(f, "coverImageUrl");

  // If publishing, strictly validate all required presentation fields
  if (validStatus === "PUBLISHED") {
    const data = {
      slug: rawSlug,
      nameEn,
      nameAr,
      shortDescriptionEn,
      shortDescriptionAr,
      locationEn,
      locationAr,
      coverImageUrl,
      status: validStatus,
      featured: bool(f, "featured"),
      featuredOrder: str(f, "featuredOrder"),
    };
    const parsed = projectSchema.safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
  } else {
    // For drafts: minimum required is an English name
    if (!nameEn) {
      return { error: "Please enter at least an English project name." };
    }
  }

  // Format safe URL slug
  let formattedSlug = rawSlug
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  if (!formattedSlug) formattedSlug = `project-${Date.now()}`;

  const resolvedData = {
    slug: formattedSlug,
    nameEn,
    nameAr: nameAr || nameEn,
    shortDescriptionEn: shortDescriptionEn || "Draft project description",
    shortDescriptionAr: shortDescriptionAr || shortDescriptionEn || "وصف المشروع",
    locationEn: locationEn || "Cairo",
    locationAr: locationAr || locationEn || "القاهرة",
    coverImageUrl: coverImageUrl || "",
    status: validStatus,
    featured: bool(f, "featured"),
    featuredOrder: parseInt(str(f, "featuredOrder") || "0", 10) || 0,
  };

  // Helper to parse JSON payloads safely
  const parseJson = <T>(val: string, fallback: T): T => {
    if (!val) return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  };

  const rawKeyFactsInput = str(f, "keyFactsJson");
  const rawHighlightsInput = str(f, "highlightsJson");
  const rawUnitTypesInput = str(f, "unitTypesJson");
  const rawGalleryItemsInput = str(f, "galleryItemsJson");
  const rawUpdatesInput = str(f, "constructionUpdatesJson");
  const rawConnectivityInput = str(f, "connectivityJson");

  const parsedKeyFacts = rawKeyFactsInput ? parseJson<any[]>(rawKeyFactsInput, []) : null;
  const parsedHighlights = rawHighlightsInput ? parseJson<any[]>(rawHighlightsInput, []) : null;
  const parsedUnitTypes = rawUnitTypesInput ? parseJson<any[]>(rawUnitTypesInput, []) : null;
  const parsedGalleryItems = rawGalleryItemsInput ? parseJson<any[]>(rawGalleryItemsInput, []) : null;
  const parsedUpdates = rawUpdatesInput ? parseJson<any[]>(rawUpdatesInput, []) : null;
  const parsedConnectivity = rawConnectivityInput ? parseJson<any[]>(rawConnectivityInput, []) : null;

  // Build backward-compatible JSON fields if repeatable items are provided
  const legacyKeyFacts = parsedKeyFacts
    ? JSON.stringify(parsedKeyFacts.map((k) => ({ labelEn: k.labelEn, labelAr: k.labelAr || k.labelEn, valueEn: k.valueEn, valueAr: k.valueAr || k.valueEn, unitEn: k.unitEn || null, unitAr: k.unitAr || null, icon: k.icon || null })))
    : str(f, "keyFacts") || "[]";

  const legacyHighlights = parsedHighlights
    ? JSON.stringify(parsedHighlights.map((h) => ({ titleEn: h.titleEn, titleAr: h.titleAr || h.titleEn, descriptionEn: h.descriptionEn, descriptionAr: h.descriptionAr || h.descriptionEn, icon: h.icon || null, image: h.imageUrl || null })))
    : str(f, "highlights") || "[]";

  const legacyUnitTypes = parsedUnitTypes
    ? JSON.stringify(parsedUnitTypes.map((u, i) => ({ id: u.id || `unit-${i}`, nameEn: u.titleEn || u.nameEn || "", nameAr: u.titleAr || u.nameAr || u.titleEn || "", areaEn: u.areaEn || u.areaRange || "", areaAr: u.areaAr || u.areaRange || "", finishingEn: u.finishingEn || "", finishingAr: u.finishingAr || "", paymentEn: u.paymentPlanEn || u.paymentEn || "", paymentAr: u.paymentPlanAr || u.paymentAr || "", image: u.imageUrl || u.image || null, floorPlanUrl: u.floorPlanUrl || null })))
    : str(f, "unitTypes") || "[]";

  const legacyNearby = parsedConnectivity
    ? JSON.stringify(parsedConnectivity.map((c) => ({ nameEn: c.destinationEn, nameAr: c.destinationAr || c.destinationEn, distanceEn: c.distanceOrDurationEn, distanceAr: c.distanceOrDurationAr || c.distanceOrDurationEn, type: c.travelType || "CAR" })))
    : str(f, "nearbyLocations") || "[]";

  const legacyUpdates = parsedUpdates
    ? JSON.stringify(parsedUpdates.map((u) => ({ date: u.date || "", titleEn: u.titleEn, titleAr: u.titleAr || u.titleEn, imageUrl: u.imageUrl || null, isVideo: Boolean(u.isVideo) })))
    : str(f, "constructionUpdates") || "[]";

  const legacyGalleryImages = parsedGalleryItems
    ? JSON.stringify(parsedGalleryItems.map((g) => g.imageUrl).filter(Boolean))
    : str(f, "gallery") || "[]";

  const latStr = str(f, "latitude");
  const lngStr = str(f, "longitude");
  const lat = latStr ? parseFloat(latStr) : null;
  const lng = lngStr ? parseFloat(lngStr) : null;

  const extra = {
    projectCode: str(f, "projectCode") || null,
    addressEn: str(f, "addressEn") || null,
    addressAr: str(f, "addressAr") || null,
    directionsUrl: str(f, "directionsUrl") || null,
    latitude: !isNaN(lat as number) ? lat : null,
    longitude: !isNaN(lng as number) ? lng : null,
    mapUrl: str(f, "mapUrl") || null,
    mobileHeroImageUrl: str(f, "mobileHeroImageUrl") || null,
    heroVideoUrl: str(f, "heroVideoUrl") || null,
    heroVideoPosterUrl: str(f, "heroVideoPosterUrl") || null,
    cardImageUrl: str(f, "cardImageUrl") || null,
    heroTitleEn: str(f, "heroTitleEn") || null,
    heroTitleAr: str(f, "heroTitleAr") || null,
    heroDescriptionEn: str(f, "heroDescriptionEn") || null,
    heroDescriptionAr: str(f, "heroDescriptionAr") || null,
    coverImageAltEn: str(f, "coverImageAltEn") || resolvedData.nameEn,
    coverImageAltAr: str(f, "coverImageAltAr") || resolvedData.nameAr,
    coverImageFocalPoint: str(f, "coverImageFocalPoint") || "center",
    ctaLabelEn: str(f, "ctaLabelEn") || null,
    ctaLabelAr: str(f, "ctaLabelAr") || null,
    ctaUrl: str(f, "ctaUrl") || null,
    gallery: legacyGalleryImages,
    projectType: str(f, "projectType") || "Residential",
    progressStatus: str(f, "progressStatus") || "Ongoing",
    fullDescriptionEn: str(f, "fullDescriptionEn") || null,
    fullDescriptionAr: str(f, "fullDescriptionAr") || null,
    masterPlanUrl: str(f, "masterPlanUrl") || null,
    brochureUrl: str(f, "brochureUrl") || null,
    videoTourUrl: str(f, "videoTourUrl") || null,
    logoUrl: str(f, "logoUrl") || null,
    keyFacts: legacyKeyFacts,
    highlights: legacyHighlights,
    unitTypes: legacyUnitTypes,
    nearbyLocations: legacyNearby,
    constructionUpdates: legacyUpdates,
    seoTitleEn: str(f, "seoTitleEn") || null,
    seoTitleAr: str(f, "seoTitleAr") || null,
    seoDescriptionEn: str(f, "seoDescriptionEn") || null,
    seoDescriptionAr: str(f, "seoDescriptionAr") || null,
    ogImageUrl: str(f, "ogImageUrl") || null,
  };

  const id = str(f, "id");
  let savedId = id;

  try {
    await prisma.$transaction(async (tx) => {
      let targetProjectId = id;

      if (id) {
        const existing = await tx.project.findUnique({ where: { id } });
        if (existing && existing.slug !== resolvedData.slug) {
          await tx.projectRedirect.upsert({
            where: { sourceSlug: existing.slug },
            update: { targetSlug: resolvedData.slug },
            create: { sourceSlug: existing.slug, targetSlug: resolvedData.slug },
          });
          revalidatePath(`/en/projects/${existing.slug}`);
          revalidatePath(`/ar/projects/${existing.slug}`);
        }
        await tx.project.update({ where: { id }, data: { ...resolvedData, ...extra } });
      } else {
        const created = await tx.project.create({ data: { ...resolvedData, ...extra } });
        targetProjectId = created.id;
        savedId = created.id;
      }

      // Sync normalized Key Facts
      if (parsedKeyFacts !== null) {
        await tx.projectKeyFact.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedKeyFacts.length > 0) {
          await tx.projectKeyFact.createMany({
            data: parsedKeyFacts.map((kf, idx) => ({
              projectId: targetProjectId,
              labelEn: String(kf.labelEn || "").trim(),
              labelAr: String(kf.labelAr || kf.labelEn || "").trim(),
              valueEn: String(kf.valueEn || "").trim(),
              valueAr: String(kf.valueAr || kf.valueEn || "").trim(),
              unitEn: kf.unitEn ? String(kf.unitEn).trim() : null,
              unitAr: kf.unitAr ? String(kf.unitAr).trim() : null,
              icon: kf.icon ? String(kf.icon).trim() : null,
              sortOrder: typeof kf.sortOrder === "number" ? kf.sortOrder : idx,
            })),
          });
        }
      }

      // Sync normalized Highlights
      if (parsedHighlights !== null) {
        await tx.projectHighlight.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedHighlights.length > 0) {
          await tx.projectHighlight.createMany({
            data: parsedHighlights.map((h, idx) => ({
              projectId: targetProjectId,
              titleEn: String(h.titleEn || "").trim(),
              titleAr: String(h.titleAr || h.titleEn || "").trim(),
              descriptionEn: String(h.descriptionEn || "").trim(),
              descriptionAr: String(h.descriptionAr || h.descriptionEn || "").trim(),
              imageUrl: h.imageUrl ? String(h.imageUrl).trim() : null,
              icon: h.icon ? String(h.icon).trim() : null,
              sortOrder: typeof h.sortOrder === "number" ? h.sortOrder : idx,
            })),
          });
        }
      }

      // Sync normalized Unit Types
      if (parsedUnitTypes !== null) {
        await tx.projectUnitType.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedUnitTypes.length > 0) {
          await tx.projectUnitType.createMany({
            data: parsedUnitTypes.map((u, idx) => ({
              projectId: targetProjectId,
              titleEn: String(u.titleEn || u.nameEn || "").trim(),
              titleAr: String(u.titleAr || u.nameAr || u.titleEn || u.nameEn || "").trim(),
              areaEn: u.areaEn ? String(u.areaEn).trim() : null,
              areaAr: u.areaAr ? String(u.areaAr).trim() : null,
              areaRange: u.areaRange ? String(u.areaRange).trim() : null,
              areaUnit: u.areaUnit ? String(u.areaUnit).trim() : "sqm",
              finishingEn: u.finishingEn ? String(u.finishingEn).trim() : null,
              finishingAr: u.finishingAr ? String(u.finishingAr).trim() : null,
              descriptionEn: u.descriptionEn ? String(u.descriptionEn).trim() : null,
              descriptionAr: u.descriptionAr ? String(u.descriptionAr).trim() : null,
              paymentPlanEn: (u.paymentPlanEn || u.paymentEn) ? String(u.paymentPlanEn || u.paymentEn).trim() : null,
              paymentPlanAr: (u.paymentPlanAr || u.paymentAr) ? String(u.paymentPlanAr || u.paymentAr).trim() : null,
              imageUrl: u.imageUrl || u.image ? String(u.imageUrl || u.image).trim() : null,
              floorPlanUrl: u.floorPlanUrl ? String(u.floorPlanUrl).trim() : null,
              sortOrder: typeof u.sortOrder === "number" ? u.sortOrder : idx,
            })),
          });
        }
      }

      // Sync normalized Gallery Items
      if (parsedGalleryItems !== null) {
        await tx.projectGalleryItem.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedGalleryItems.length > 0) {
          await tx.projectGalleryItem.createMany({
            data: parsedGalleryItems.map((g, idx) => ({
              projectId: targetProjectId,
              imageUrl: String(g.imageUrl || "").trim(),
              category: String(g.category || "RENDERS").trim(),
              captionEn: g.captionEn ? String(g.captionEn).trim() : null,
              captionAr: g.captionAr ? String(g.captionAr).trim() : null,
              altEn: g.altEn ? String(g.altEn).trim() : null,
              altAr: g.altAr ? String(g.altAr).trim() : null,
              isVideo: Boolean(g.isVideo),
              videoUrl: g.videoUrl ? String(g.videoUrl).trim() : null,
              posterUrl: g.posterUrl ? String(g.posterUrl).trim() : null,
              sortOrder: typeof g.sortOrder === "number" ? g.sortOrder : idx,
            })),
          });
        }
      }

      // Sync normalized Construction Updates
      if (parsedUpdates !== null) {
        await tx.projectConstructionUpdate.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedUpdates.length > 0) {
          await tx.projectConstructionUpdate.createMany({
            data: parsedUpdates.map((u, idx) => ({
              projectId: targetProjectId,
              date: u.date ? new Date(u.date) : new Date(),
              titleEn: String(u.titleEn || "").trim(),
              titleAr: String(u.titleAr || u.titleEn || "").trim(),
              descriptionEn: u.descriptionEn ? String(u.descriptionEn).trim() : null,
              descriptionAr: u.descriptionAr ? String(u.descriptionAr).trim() : null,
              imageUrl: u.imageUrl ? String(u.imageUrl).trim() : null,
              isVideo: Boolean(u.isVideo),
              videoUrl: u.videoUrl ? String(u.videoUrl).trim() : null,
              sortOrder: typeof u.sortOrder === "number" ? u.sortOrder : idx,
            })),
          });
        }
      }

      // Sync normalized Connectivity
      if (parsedConnectivity !== null) {
        await tx.projectConnectivity.deleteMany({ where: { projectId: targetProjectId } });
        if (parsedConnectivity.length > 0) {
          await tx.projectConnectivity.createMany({
            data: parsedConnectivity.map((c, idx) => ({
              projectId: targetProjectId,
              destinationEn: String(c.destinationEn || "").trim(),
              destinationAr: String(c.destinationAr || c.destinationEn || "").trim(),
              distanceOrDurationEn: String(c.distanceOrDurationEn || "").trim(),
              distanceOrDurationAr: String(c.distanceOrDurationAr || c.distanceOrDurationEn || "").trim(),
              travelType: String(c.travelType || "CAR").trim(),
              sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : idx,
            })),
          });
        }
      }
    });
  } catch (err: any) {
    console.error("saveProject error:", err);
    return { error: err.message || "Failed to save project. Ensure slug is unique." };
  }

  revalidatePath(`/en/projects/${resolvedData.slug}`);
  revalidatePath(`/ar/projects/${resolvedData.slug}`);
  revalidatePath("/admin/projects");
  if (savedId) revalidatePath(`/admin/projects/${savedId}`);
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/", "layout");

  // If redirect requested explicitly (e.g. from non-ajax form)
  if (str(f, "redirectAfterSave") === "true") {
    redirect(`/admin/projects/${savedId}`);
  }

  return { success: "Project and all normalized details saved successfully.", projectId: savedId };
}

export async function deleteProject(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const count = await prisma.contactSubmission.count({ where: { projectId: id } });
  if (count > 0) {
    throw new Error(
      `Cannot delete project: ${count} contact enquiry/lead record(s) reference this project. Please set the project status to ARCHIVED instead.`
    );
  }

  const existing = await prisma.project.findUnique({
    where: { id },
    include: { visualTours: true },
  });

  if (existing?.visualTours) {
    for (const tour of existing.visualTours) {
      await deleteVisualTourAssets(tour.id).catch(() => undefined);
    }
  }

  await prisma.project.delete({ where: { id } });
  if (existing) {
    revalidatePath(`/en/projects/${existing.slug}`);
    revalidatePath(`/ar/projects/${existing.slug}`);
  }
  revalidatePath("/admin/projects");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/", "layout");
}

export async function setProjectStatus(projectId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<ActionState> {
  await requireAdmin();
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data: { status },
      select: { slug: true },
    });
    revalidatePath(`/en/projects/${project.slug}`);
    revalidatePath(`/ar/projects/${project.slug}`);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/en");
    revalidatePath("/ar");
    revalidatePath("/en/projects");
    revalidatePath("/ar/projects");
    revalidatePath("/", "layout");
    return { success: `Project status updated to ${status}.` };
  } catch (err: any) {
    return { error: err.message || "Failed to update project status." };
  }
}

export async function toggleProjectFeatured(projectId: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { featured: true, slug: true },
    });
    if (!project) return { error: "Project not found." };
    await prisma.project.update({
      where: { id: projectId },
      data: { featured: !project.featured },
    });
    revalidatePath("/admin/projects");
    revalidatePath("/en");
    revalidatePath("/ar");
    revalidatePath("/", "layout");
    return { success: `Project featured state updated.` };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle featured state." };
  }
}

export async function archiveProject(projectId: string): Promise<ActionState> {
  return setProjectStatus(projectId, "ARCHIVED");
}

export async function uploadProjectVisualTour(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const projectId = str(f, "projectId");
  if (!projectId) return { error: "Missing project ID." };
  const file = f.get("tourFile") as File | null;
  if (!file || !file.size) return { error: "Please select an HTML file (.html) or ZIP archive (.zip) to upload." };

  const titleEn = str(f, "titleEn") || file.name.replace(/\.[^/.]+$/, "");
  const titleAr = str(f, "titleAr") || titleEn;
  const descriptionEn = str(f, "descriptionEn") || null;
  const descriptionAr = str(f, "descriptionAr") || null;
  const localeTarget = str(f, "localeTarget") || "ALL";
  const posterUrl = str(f, "posterUrl") || null;
  const isDefault = bool(f, "isDefault");

  const result = await processVisualTourUpload(file);
  if (!result.success || !result.tourId) {
    return { error: result.error || "Failed to process visual tour archive." };
  }

  try {
    if (isDefault) {
      await prisma.projectVisualTour.updateMany({
        where: { projectId, localeTarget },
        data: { isDefault: false },
      });
    }

    await prisma.projectVisualTour.create({
      data: {
        id: result.tourId,
        projectId,
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        localeTarget,
        sourceType: result.sourceType || "ZIP",
        originalFilename: result.originalFilename || file.name,
        extractedPrefix: result.extractedPrefix!,
        entryFilePath: result.entryFilePath || "index.html",
        uploadedSize: result.uploadedSize || 0,
        extractedSize: result.extractedSize || 0,
        assetCount: result.assetCount || 1,
        posterUrl,
        processingState: "READY",
        publicationState: "PUBLISHED",
        isDefault,
        publishedAt: new Date(),
      },
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      revalidatePath(`/en/projects/${project.slug}`);
      revalidatePath(`/ar/projects/${project.slug}`);
    }
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/en/projects");
    revalidatePath("/ar/projects");

    return {
      success: `Visual tour "${titleEn}" uploaded and verified! Processed ${result.assetCount} asset(s) with entry file "${result.entryFilePath}".`,
    };
  } catch (err: any) {
    await deleteVisualTourAssets(result.tourId).catch(() => undefined);
    return { error: `Database error while saving visual tour: ${err.message}` };
  }
}

export async function updateProjectVisualTour(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "tourId");
  const tour = await prisma.projectVisualTour.findUnique({ where: { id } });
  if (!tour) return { error: "Visual tour not found." };

  const titleEn = str(f, "titleEn") || tour.titleEn;
  const titleAr = str(f, "titleAr") || tour.titleAr;
  const entryFilePath = str(f, "entryFilePath") || tour.entryFilePath;
  const posterUrl = str(f, "posterUrl") || null;
  const isDefault = bool(f, "isDefault");
  const publicationState = (str(f, "publicationState") || tour.publicationState) as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  if (isDefault) {
    await prisma.projectVisualTour.updateMany({
      where: { projectId: tour.projectId, localeTarget: tour.localeTarget, id: { not: id } },
      data: { isDefault: false },
    });
  }

  await prisma.projectVisualTour.update({
    where: { id },
    data: {
      titleEn,
      titleAr,
      entryFilePath,
      posterUrl,
      isDefault,
      publicationState,
      publishedAt: publicationState === "PUBLISHED" ? (tour.publishedAt || new Date()) : null,
    },
  });

  const project = await prisma.project.findUnique({ where: { id: tour.projectId } });
  if (project) {
    revalidatePath(`/en/projects/${project.slug}`);
    revalidatePath(`/ar/projects/${project.slug}`);
  }
  revalidatePath(`/admin/projects/${tour.projectId}`);
  return { success: "Visual tour updated successfully." };
}

export async function deleteProjectVisualTour(f: FormData): Promise<void> {
  await requireAdmin();
  const id = str(f, "id");
  const tour = await prisma.projectVisualTour.findUnique({ where: { id } });
  if (!tour) return;
  await prisma.projectVisualTour.delete({ where: { id } });
  await deleteVisualTourAssets(id);

  const project = await prisma.project.findUnique({ where: { id: tour.projectId } });
  if (project) {
    revalidatePath(`/en/projects/${project.slug}`);
    revalidatePath(`/ar/projects/${project.slug}`);
  }
  revalidatePath(`/admin/projects/${tour.projectId}`);
}

export async function updateLead(f:FormData){await requireAdmin();const id=str(f,"id");const status=str(f,"status");if(!["NEW","CONTACTED","QUALIFIED","CLOSED"].includes(status))return;await prisma.contactSubmission.update({where:{id},data:{status,notes:str(f,"notes")||null}});revalidatePath("/admin/leads");}
export async function deleteLead(f:FormData){await requireAdmin();await prisma.contactSubmission.delete({where:{id:str(f,"id")}});revalidatePath("/admin/leads");}

export async function saveNews(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const data={
    slug:str(f,"slug"),
    titleEn:str(f,"titleEn"),
    titleAr:str(f,"titleAr"),
    excerptEn:str(f,"excerptEn"),
    excerptAr:str(f,"excerptAr"),
    contentEn:str(f,"contentEn"),
    contentAr:str(f,"contentAr"),
    coverImageUrl:str(f,"coverImageUrl"),
    publicationDate:str(f,"publicationDate"),
    status:str(f,"status"),
    featured:bool(f,"featured"),
    featuredOrder:str(f,"featuredOrder")
  };
  const parsed=newsSchema.safeParse(data);
  if(!parsed.success)return{error:parsed.error.issues[0].message};
  const category=str(f,"category")||"NEWS";
  const projectId=str(f,"projectId")||null;
  const rawConstructionDate = str(f, "constructionDate");
  const constructionDate = rawConstructionDate ? new Date(rawConstructionDate) : null;

  const extra = {
    coverImageAltEn: str(f, "coverImageAltEn") || parsed.data.titleEn,
    coverImageAltAr: str(f, "coverImageAltAr") || parsed.data.titleAr,
    coverCaptionEn: str(f, "coverCaptionEn") || null,
    coverCaptionAr: str(f, "coverCaptionAr") || null,
    coverCreditEn: str(f, "coverCreditEn") || null,
    coverCreditAr: str(f, "coverCreditAr") || null,
    category,
    projectId,
    constructionDate,
    showRelatedProject: bool(f, "showRelatedProject"),
    showTableOfContents: bool(f, "showTableOfContents"),
    ctaEnabled: bool(f, "ctaEnabled"),
    ctaHeadingEn: str(f, "ctaHeadingEn") || null,
    ctaHeadingAr: str(f, "ctaHeadingAr") || null,
    ctaTextEn: str(f, "ctaTextEn") || null,
    ctaTextAr: str(f, "ctaTextAr") || null,
    ctaButtonEn: str(f, "ctaButtonEn") || null,
    ctaButtonAr: str(f, "ctaButtonAr") || null,
    ctaLink: str(f, "ctaLink") || null,
    ctaActionType: str(f, "ctaActionType") || "ENQUIRY",
    gallery: str(f, "gallery") || "[]",
    videoUrl: str(f, "videoUrl") || null,
    authorEn: str(f, "authorEn") || null,
    authorAr: str(f, "authorAr") || null,
    focalPoint: str(f, "focalPoint") || "center",
    tags: str(f, "tags") || "[]",
    relatedArticleIds: str(f, "relatedArticleIds") || "[]",
    seoTitleEn: str(f, "seoTitleEn") || null,
    seoTitleAr: str(f, "seoTitleAr") || null,
    seoDescriptionEn: str(f, "seoDescriptionEn") || null,
    seoDescriptionAr: str(f, "seoDescriptionAr") || null,
    ogImageUrl: str(f, "ogImageUrl") || null,
    sidebarProjectsEnabled: bool(f, "sidebarProjectsEnabled"),
    sidebarProjectsHeadingEn: str(f, "sidebarProjectsHeadingEn") || null,
    sidebarProjectsHeadingAr: str(f, "sidebarProjectsHeadingAr") || null,
    sidebarProjectsMode: str(f, "sidebarProjectsMode") || "AUTO",
    sidebarProjectIds: str(f, "sidebarProjectIds") || "[]",
    sidebarProjectsCount: parseInt(str(f, "sidebarProjectsCount") || "3", 10) || 3,
    sidebarShowLocation: bool(f, "sidebarShowLocation"),
    sidebarShowType: bool(f, "sidebarShowType"),
    sidebarShowStatus: bool(f, "sidebarShowStatus"),
    sidebarViewAllLabelEn: str(f, "sidebarViewAllLabelEn") || null,
    sidebarViewAllLabelAr: str(f, "sidebarViewAllLabelAr") || null,
  };

  const id=str(f,"id");
  try{
    if(id) {
      const existing = await prisma.newsArticle.findUnique({ where: { id } });
      if (existing && existing.slug !== parsed.data.slug) {
        // Record redirect from prior slug to new slug
        await prisma.articleRedirect.upsert({
          where: { sourceSlug: existing.slug },
          update: { targetSlug: parsed.data.slug },
          create: { sourceSlug: existing.slug, targetSlug: parsed.data.slug },
        });
        revalidatePath(`/en/journal/${existing.slug}`);
        revalidatePath(`/ar/journal/${existing.slug}`);
      }
      await prisma.newsArticle.update({where:{id},data:{...parsed.data,...extra}});
    } else {
      await prisma.newsArticle.create({data:{...parsed.data,...extra}});
    }
  }catch{return{error:"The slug must be unique."}}

  revalidatePath("/admin/news");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath(`/en/journal/${parsed.data.slug}`);
  revalidatePath(`/ar/journal/${parsed.data.slug}`);
  revalidatePath("/", "layout");
  redirect("/admin/news");
}

export async function deleteNews(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const existing = await prisma.newsArticle.findUnique({ where: { id } });
  await prisma.newsArticle.update({ where: { id }, data: { status: "ARCHIVED", featured: false } });
  if (existing) {
    revalidatePath(`/en/journal/${existing.slug}`);
    revalidatePath(`/ar/journal/${existing.slug}`);
  }
  revalidatePath("/admin/news");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath("/", "layout");
}

export async function saveJournalSettings(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const data = {
    titleEn: str(f, "titleEn") || "Journal",
    titleAr: str(f, "titleAr") || "يوميات إيمدج",
    introEn: str(f, "introEn") || "Follow milestones, architecture, events, and construction progress across Image destinations.",
    introAr: str(f, "introAr") || "تابع أحدث المستجدات، الفعاليات وتطورات البناء في مجتمعات إيمدج للتطوير العقاري.",
    heroImageUrl: str(f, "heroImageUrl") || null,
    heroImageAltEn: str(f, "heroImageAltEn") || "Image Developments Journal",
    heroImageAltAr: str(f, "heroImageAltAr") || "يوميات إيمدج للتطوير العقاري",
    heroFocalPoint: str(f, "heroFocalPoint") || "center",
    featuredArticleId: str(f, "featuredArticleId") || null,
    categoryOrder: str(f, "categoryOrder") || "ALL,NEWS,EVENTS,CONSTRUCTION",
    sidebarEnabled: bool(f, "sidebarEnabled"),
    sidebarHeadingEn: str(f, "sidebarHeadingEn") || "Recent Articles",
    sidebarHeadingAr: str(f, "sidebarHeadingAr") || "أحدث المقالات",
    sidebarMode: str(f, "sidebarMode") || "AUTO",
    sidebarArticleIds: str(f, "sidebarArticleIds") || "[]",
    sidebarItemCount: Number(str(f, "sidebarItemCount")) || 5,
    articlesPerPage: Number(str(f, "articlesPerPage")) || 6,
    closingCtaEnabled: bool(f, "closingCtaEnabled"),
    closingCtaHeadingEn: str(f, "closingCtaHeadingEn") || "Discover Our Living Communities",
    closingCtaHeadingAr: str(f, "closingCtaHeadingAr") || "اكتشف مجتمعاتنا السكنية",
    closingCtaTextEn: str(f, "closingCtaTextEn") || "Explore our master-planned destinations across Egypt or speak with our property advisors.",
    closingCtaTextAr: str(f, "closingCtaTextAr") || "استكشف وجهاتنا المطورة بعناية في مصر أو تواصل مع مستشارينا العقاريين.",
    closingCtaButtonEn: str(f, "closingCtaButtonEn") || "Explore Our Projects",
    closingCtaButtonAr: str(f, "closingCtaButtonAr") || "استكشف مشاريعنا",
    closingCtaLink: str(f, "closingCtaLink") || "/projects",
    closingCtaSecondary: bool(f, "closingCtaSecondary"),
    seoTitleEn: str(f, "seoTitleEn") || "Journal & Latest News — Image Developments",
    seoTitleAr: str(f, "seoTitleAr") || "اليوميات وآخر الأخبار — إيمدج للتطوير العقاري",
    seoDescriptionEn: str(f, "seoDescriptionEn") || "Discover latest architectural milestones, stories, events, and construction updates from Image Developments.",
    seoDescriptionAr: str(f, "seoDescriptionAr") || "اطلع على أحدث المقالات والأخبار وتحديثات البناء من إيمدج للتطوير العقاري.",
    ogImageUrl: str(f, "ogImageUrl") || null,
  };

  await prisma.journalPageSettings.upsert({
    where: { id: "journal" },
    update: data,
    create: { id: "journal", ...data },
  });

  revalidatePath("/admin/news");
  revalidatePath("/admin/news/settings");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/", "layout");

  return { success: "Journal page settings saved successfully." };
}

export async function saveNavigation(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const ids = f.getAll("id").map(String);
  if (ids.length > 50 || new Set(ids).size !== ids.length) return { error: "The navigation items list is invalid. Refresh and try again." };

  const items = ids.map((id, sortOrder) => ({
    id,
    labelEn: str(f, `labelEn_${id}`),
    labelAr: str(f, `labelAr_${id}`),
    url: str(f, `url_${id}`),
    visible: bool(f, `visible_${id}`),
    mobileVisible: f.has(`mobileVisible_${id}`) ? bool(f, `mobileVisible_${id}`) : true,
    external: bool(f, `external_${id}`),
    group: str(f, `group_${id}`) || "primary",
    previewImageUrl: str(f, `previewImageUrl_${id}`) || null,
    previewImageUrlAr: str(f, `previewImageUrlAr_${id}`) || null,
    focalPoint: str(f, `focalPoint_${id}`) || "center",
    sortOrder,
  }));

  if (items.some((item) => !item.labelEn || !item.labelAr || !safeUrl.safeParse(item.url).success)) {
    return { error: "Complete all navigation link labels in English and Arabic with valid URLs." };
  }

  const defaultMenuUrl = str(f, "defaultMenuMediaUrl");
  const defaultMenuFocalPoint = str(f, "defaultMenuMediaFocalPoint") || "center";
  const defaultMenuAltEn = str(f, "defaultMenuMediaAltEn");
  const defaultMenuAltAr = str(f, "defaultMenuMediaAltAr");

  await prisma.$transaction(async (tx) => {
    if (defaultMenuUrl) {
      await tx.globalSettings.update({
        where: { id: "global" },
        data: {
          menuMediaUrl: defaultMenuUrl,
          menuMediaFocalPoint: defaultMenuFocalPoint,
          ...(defaultMenuAltEn ? { menuMediaAltEn: defaultMenuAltEn } : {}),
          ...(defaultMenuAltAr ? { menuMediaAltAr: defaultMenuAltAr } : {}),
        },
      });
    }

    const existing = await tx.navigationItem.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((item) => item.id));
    const retained = ids.filter((id) => existingIds.has(id));
    await tx.navigationItem.deleteMany({ where: retained.length ? { id: { notIn: retained } } : {} });

    for (const item of items) {
      const data = {
        labelEn: item.labelEn,
        labelAr: item.labelAr,
        url: item.url,
        visible: item.visible,
        mobileVisible: item.mobileVisible,
        external: item.external,
        group: item.group,
        previewImageUrl: item.previewImageUrl,
        previewImageUrlAr: item.previewImageUrlAr,
        focalPoint: item.focalPoint,
        sortOrder: item.sortOrder,
      };
      if (existingIds.has(item.id)) {
        await tx.navigationItem.update({ where: { id: item.id }, data });
      } else {
        await tx.navigationItem.create({ data });
      }
    }
  });

  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/admin/navigation");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath("/en/about");
  revalidatePath("/ar/about");
  revalidatePath("/en/contact");
  revalidatePath("/ar/contact");
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/en/history");
  revalidatePath("/ar/history");
  revalidatePath("/en/team");
  revalidatePath("/ar/team");
  revalidatePath("/en/partners");
  revalidatePath("/ar/partners");
  revalidatePath("/en/policy");
  revalidatePath("/ar/policy");
  revalidatePath("/en/terms");
  revalidatePath("/ar/terms");
  revalidatePath("/", "layout");
  return { success: "Navigation links saved." };
}
export async function saveSettings(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const email=str(f,"contactEmail");
  if(!loginSchema.shape.email.safeParse(email).success)return{error:"Enter a valid contact email."};
  const ids=f.getAll("socialId").map(String);
  if(ids.length>20||new Set(ids).size!==ids.length)return{error:"The social links list is invalid. Refresh and try again."};
  const socials=ids.map((id,sortOrder)=>({name:str(f,`socialName_${id}`),url:str(f,`socialUrl_${id}`),svgIcon:str(f,`socialSvg_${id}`),sortOrder}));
  for(const social of socials){
    if(!social.name||social.name.length>50)return{error:"Enter a social network name of 50 characters or fewer."};
    if(!/^https?:\/\//i.test(social.url)||!safeUrl.safeParse(social.url).success)return{error:`Enter a valid public URL for ${social.name}.`};
    if(social.svgIcon.length>20000||!/^<svg(?:\s|>)/i.test(social.svgIcon)||!/<\/svg>$/i.test(social.svgIcon))return{error:`Paste a complete SVG icon for ${social.name}.`};
  }
  await prisma.$transaction(async tx=>{
    await tx.globalSettings.update({
      where:{id:"global"},
      data:{
        siteNameEn:str(f,"siteNameEn"),siteNameAr:str(f,"siteNameAr"),contactEmail:email,phone:str(f,"phone"),hotline:str(f,"hotline")||"17087",companyBrochureUrl:str(f,"companyBrochureUrl")||null,workingHoursEn:str(f,"workingHoursEn")||"Sunday - Thursday: 9:00 AM - 6:00 PM",workingHoursAr:str(f,"workingHoursAr")||"الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م",addressEn:str(f,"addressEn"),addressAr:str(f,"addressAr"),mapUrl:str(f,"mapUrl")||null,descriptionEn:str(f,"descriptionEn")||null,descriptionAr:str(f,"descriptionAr")||null,footerExploreHeadingEn:str(f,"footerExploreHeadingEn")||"Explore",footerExploreHeadingAr:str(f,"footerExploreHeadingAr")||"استكشف",footerProjectsHeadingEn:str(f,"footerProjectsHeadingEn")||"Our Projects",footerProjectsHeadingAr:str(f,"footerProjectsHeadingAr")||"مشاريعنا",footerContactHeadingEn:str(f,"footerContactHeadingEn")||"Contact",footerContactHeadingAr:str(f,"footerContactHeadingAr")||"تواصل معنا",callbackEnabled:bool(f,"callbackEnabled"),callbackLabelEn:str(f,"callbackLabelEn")||"Request a Call Back",callbackLabelAr:str(f,"callbackLabelAr")||"طلب معاودة الاتصال",copyrightEn:str(f,"copyrightEn"),copyrightAr:str(f,"copyrightAr"),defaultSeoTitleEn:str(f,"defaultSeoTitleEn"),defaultSeoTitleAr:str(f,"defaultSeoTitleAr"),defaultSeoDescriptionEn:str(f,"defaultSeoDescriptionEn"),defaultSeoDescriptionAr:str(f,"defaultSeoDescriptionAr"),defaultOgImageUrl:str(f,"defaultOgImageUrl")||null,menuMediaUrl:str(f,"menuMediaUrl"),menuMediaAltEn:str(f,"menuMediaAltEn"),menuMediaAltAr:str(f,"menuMediaAltAr")
      }
    });
    await tx.socialLink.deleteMany({where:{globalSettingsId:"global"}});
    if(socials.length)await tx.socialLink.createMany({data:socials.map(item=>({...item,globalSettingsId:"global"}))});
  });
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/admin/settings");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/en/journal");
  revalidatePath("/ar/journal");
  revalidatePath("/en/about");
  revalidatePath("/ar/about");
  revalidatePath("/en/contact");
  revalidatePath("/ar/contact");
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/en/history");
  revalidatePath("/ar/history");
  revalidatePath("/en/team");
  revalidatePath("/ar/team");
  revalidatePath("/en/partners");
  revalidatePath("/ar/partners");
  revalidatePath("/en/policy");
  revalidatePath("/ar/policy");
  revalidatePath("/en/terms");
  revalidatePath("/ar/terms");
  revalidatePath("/", "layout");
  return { success: "Global settings saved." };
}

export async function uploadMedia(_:ActionState,f:FormData):Promise<ActionState>{await requireAdmin();const file=f.get("file");if(!(file instanceof File)||file.size===0)return{error:"Choose an image or video."};const result=await storeMedia(file);if(result.error)return{error:result.error};if(result.asset&&(str(f,"altEn")||str(f,"altAr")))await prisma.mediaAsset.update({where:{id:result.asset.id},data:{altEn:str(f,"altEn")||null,altAr:str(f,"altAr")||null}});revalidatePath("/admin/media");revalidatePath("/admin/homepage");return{success:`${result.asset?.kind==="VIDEO"?"Video":"Image"} uploaded to the Media Library.`};}

export async function uploadHomepageMedia(f:FormData,expectedKind:"IMAGE"|"VIDEO"|"DOCUMENT"):Promise<{asset?:UploadedMedia;error?:string}>{await requireAdmin();const file=f.get("file");if(!(file instanceof File)||file.size===0)return{error:`Choose a${expectedKind==="IMAGE"?"n image":expectedKind==="VIDEO"?" video":" document"} file.`};return storeMedia(file,expectedKind);}

export async function deleteMedia(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin();
  const id=str(f,"id");
  const asset=await prisma.mediaAsset.findUnique({where:{id}});
  if(!asset)return{error:"Media item not found."};
  const [home,settings,project,news]=await Promise.all([
    prisma.homepage.findFirst({where:{OR:[{openingVideoDesktopUrl:asset.url},{openingVideoMobileUrl:asset.url},{openingPosterUrl:asset.url},{heroMediaUrl:asset.url},{heroMobileMediaUrl:asset.url},{heroVideoDesktopUrl:asset.url},{heroVideoMobileUrl:asset.url},{heroPosterUrl:asset.url},{lifestyleMediaUrl:asset.url},{aboutHeroImageUrl:asset.url}]},select:{id:true}}),
    prisma.globalSettings.findFirst({where:{OR:[{menuMediaUrl:asset.url},{defaultOgImageUrl:asset.url}]},select:{id:true}}),
    prisma.project.findFirst({where:{OR:[{coverImageUrl:asset.url},{logoUrl:asset.url},{ogImageUrl:asset.url}]},select:{id:true}}),
    prisma.newsArticle.findFirst({where:{OR:[{coverImageUrl:asset.url},{ogImageUrl:asset.url}]},select:{id:true}}),
  ]);
  const about=await prisma.aboutMilestone.findFirst({where:{imageUrl:asset.url},select:{id:true}});
  const aboutBlock=await prisma.aboutContentBlock.findFirst({where:{imageUrl:asset.url},select:{id:true}});
  const pageSection=await prisma.pageSection.findFirst({where:{imageUrl:asset.url},select:{id:true}});
  if(home||about||aboutBlock||pageSection||settings||project||news)return{error:"This media is still in use. Replace it in the relevant content first."};
  await prisma.mediaAsset.delete({where:{id}});
  if(asset.url.startsWith("/uploads/"))await unlink(path.join(process.cwd(),"public",asset.url)).catch(()=>undefined);
  revalidatePath("/admin/media");
  return{success:"Unused media deleted."};
}

export async function saveCareerJob(_:ActionState, f:FormData):Promise<ActionState>{
  await requireAdmin();
  const id=str(f,"id");
  const slug=str(f,"slug");
  const titleEn=str(f,"titleEn");
  const titleAr=str(f,"titleAr");
  const departmentEn=str(f,"departmentEn");
  const departmentAr=str(f,"departmentAr");
  const locationEn=str(f,"locationEn")||"Cairo, Egypt";
  const locationAr=str(f,"locationAr")||"القاهرة، مصر";
  const descriptionEn=str(f,"descriptionEn");
  const descriptionAr=str(f,"descriptionAr");
  const requirementsEn=str(f,"requirementsEn");
  const requirementsAr=str(f,"requirementsAr");
  const status=str(f,"status")==="DRAFT"?"DRAFT":"PUBLISHED";
  const sortOrder=Number(str(f,"sortOrder"))||0;

  if(!slug||!titleEn||!titleAr||!departmentEn||!departmentAr||!descriptionEn||!descriptionAr){
    return{error:"Please fill out all required job fields in English and Arabic."};
  }

  try{
    if(id){
      await prisma.careerJob.update({
        where:{id},
        data:{slug,titleEn,titleAr,departmentEn,departmentAr,locationEn,locationAr,descriptionEn,descriptionAr,requirementsEn,requirementsAr,status,sortOrder}
      });
    } else {
      await prisma.careerJob.create({
        data:{slug,titleEn,titleAr,departmentEn,departmentAr,locationEn,locationAr,descriptionEn,descriptionAr,requirementsEn,requirementsAr,status,sortOrder}
      });
    }
  }catch{
    return{error:"The job slug must be unique."};
  }

  revalidatePath("/admin/careers");
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/", "layout");
  return{success:"Career vacancy saved."};
}

export async function deleteCareerJob(f:FormData){
  await requireAdmin();
  const id=str(f,"id");
  await prisma.careerJob.delete({where:{id}});
  revalidatePath("/admin/careers");
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/", "layout");
}

export async function updateCareerApplicationStatus(f:FormData){
  await requireAdmin();
  const id=str(f,"id");
  const status=str(f,"status");
  const notes=str(f,"notes")||null;
  if(!["NEW","REVIEWED","SHORTLISTED","REJECTED"].includes(status))return;
  await prisma.careerApplication.update({where:{id},data:{status,notes}});
  revalidatePath("/admin/careers");
}

export async function deleteCareerApplication(f:FormData){
  await requireAdmin();
  const id=str(f,"id");
  await prisma.careerApplication.delete({where:{id}});
  revalidatePath("/admin/careers");
}

export async function saveProjectsHero(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const titleEn = str(f, "projectsHeroTitleEn");
  const titleAr = str(f, "projectsHeroTitleAr");
  if (!titleEn || !titleAr) {
    return { error: "Main heading is required in both English and Arabic." };
  }
  await prisma.homepage.update({
    where: { id: "homepage" },
    data: {
      projectsHeroEnabled: bool(f, "projectsHeroEnabled"),
      projectsHeroEyebrowEn: str(f, "projectsHeroEyebrowEn"),
      projectsHeroEyebrowAr: str(f, "projectsHeroEyebrowAr"),
      projectsHeroTitleEn: titleEn,
      projectsHeroTitleAr: titleAr,
      projectsHeroDescriptionEn: str(f, "projectsHeroDescriptionEn"),
      projectsHeroDescriptionAr: str(f, "projectsHeroDescriptionAr"),
      projectsHeroImageUrl: str(f, "projectsHeroImageUrl") || null,
      projectsHeroMobileImageUrl: str(f, "projectsHeroMobileImageUrl") || null,
      projectsHeroFocalPoint: str(f, "projectsHeroFocalPoint") || "center",
      projectsHeroImageAltEn: str(f, "projectsHeroImageAltEn"),
      projectsHeroImageAltAr: str(f, "projectsHeroImageAltAr"),
      projectsHeroPrimaryCtaEn: str(f, "projectsHeroPrimaryCtaEn") || "Explore Projects",
      projectsHeroPrimaryCtaAr: str(f, "projectsHeroPrimaryCtaAr") || "استكشف المشاريع",
      projectsHeroSecondaryCtaEn: str(f, "projectsHeroSecondaryCtaEn") || "Register Interest",
      projectsHeroSecondaryCtaAr: str(f, "projectsHeroSecondaryCtaAr") || "سجّل اهتمامك",
      projectsOpeningEnabled: bool(f, "projectsOpeningEnabled"),
      projectsOpeningHeadlineEn: str(f, "projectsOpeningHeadlineEn") || "Our Portfolio",
      projectsOpeningHeadlineAr: str(f, "projectsOpeningHeadlineAr") || "محفظة المشاريع",
    },
  });
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/", "layout");
  return { success: "Projects hero and reload animation settings saved successfully." };
}

export async function saveProjectsCollectionSettings(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const headingEn = str(f, "projectsHeadingEn") || "Projects";
  const headingAr = str(f, "projectsHeadingAr") || "المشاريع";
  const descEn = str(f, "projectsDescriptionEn") || null;
  const descAr = str(f, "projectsDescriptionAr") || null;
  const exploreEn = str(f, "projectsExploreEn") || "View Project";
  const exploreAr = str(f, "projectsExploreAr") || "عرض المشروع";
  const enabled = bool(f, "projectsEnabled");

  await prisma.homepage.update({
    where: { id: "homepage" },
    data: {
      projectsEnabled: enabled,
      projectsHeadingEn: headingEn,
      projectsHeadingAr: headingAr,
      projectsDescriptionEn: descEn,
      projectsDescriptionAr: descAr,
      projectsExploreEn: exploreEn,
      projectsExploreAr: exploreAr,
    },
  });

  const projectIds = f.getAll("projectId").map(String);
  for (const id of projectIds) {
    const featured = bool(f, `projectFeatured_${id}`);
    const order = parseInt(str(f, `projectOrder_${id}`) || "0", 10);
    const status = str(f, `projectStatus_${id}`) as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    await prisma.project.update({
      where: { id },
      data: {
        featured,
        featuredOrder: isNaN(order) ? 0 : order,
        ...(status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? { status } : {}),
      },
    });
  }

  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/", "layout");
  return { success: "Projects collection settings saved successfully." };
}

export async function saveCareersPageContent(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const heroTitleEn = str(f, "careersHeroTitleEn");
  const heroTitleAr = str(f, "careersHeroTitleAr");
  if (!heroTitleEn || !heroTitleAr) {
    return { error: "Hero title is required in both English and Arabic." };
  }
  await prisma.homepage.update({
    where: { id: "homepage" },
    data: {
      careersHeroEyebrowEn: str(f, "careersHeroEyebrowEn") || "Careers at Image",
      careersHeroEyebrowAr: str(f, "careersHeroEyebrowAr") || "انضم إلى فريقنا",
      careersHeroTitleEn: heroTitleEn,
      careersHeroTitleAr: heroTitleAr,
      careersHeroIntroEn: str(f, "careersHeroIntroEn"),
      careersHeroIntroAr: str(f, "careersHeroIntroAr"),
      careersHeroImageUrl: str(f, "careersHeroImageUrl") || null,
      careersLifeEyebrowEn: str(f, "careersLifeEyebrowEn") || "Life at Image",
      careersLifeEyebrowAr: str(f, "careersLifeEyebrowAr") || "الحياة في إيمدج",
      careersLifeTitleEn: str(f, "careersLifeTitleEn"),
      careersLifeTitleAr: str(f, "careersLifeTitleAr"),
      careersLifeBodyEn: str(f, "careersLifeBodyEn"),
      careersLifeBodyAr: str(f, "careersLifeBodyAr"),
      careersLifeImages: str(f, "careersLifeImages") || "[]",
    },
  });
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/admin/careers");
  revalidatePath("/", "layout");
  return { success: "Careers page content saved successfully." };
}

export async function toggleCareerJobStatus(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const currentStatus = str(f, "currentStatus");
  const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  await prisma.careerJob.update({
    where: { id },
    data: { status: nextStatus },
  });
  revalidatePath("/admin/careers");
  revalidatePath("/en/careers");
  revalidatePath("/ar/careers");
  revalidatePath("/", "layout");
}
