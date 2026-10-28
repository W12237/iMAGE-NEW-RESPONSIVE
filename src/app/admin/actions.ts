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

const str=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const bool=(f:FormData,k:string)=>f.get(k)==="on";
const rgb=(f:FormData,k:string)=>{const parts=str(f,k).split(",").map(value=>Number(value.trim()));return parts.length===3&&parts.every(value=>Number.isInteger(value)&&value>=0&&value<=255)?parts.join(", "):null};
async function saveFontSizes(f:FormData){for(const[key,value]of f.entries()){if(!key.startsWith("fontSize_"))continue;const settingKey=key.slice(9);const raw=String(value).trim();if(!/^[a-z][a-zA-Z0-9]*$/.test(settingKey))continue;if(!raw){await prisma.typographySetting.deleteMany({where:{key:settingKey}});continue}const fontSize=Number(raw);if(Number.isInteger(fontSize)&&fontSize>=12&&fontSize<=200)await prisma.typographySetting.upsert({where:{key:settingKey},create:{key:settingKey,fontSize},update:{fontSize}})}}
export type ActionState={error?:string;success?:string};
export type UploadedMedia={id:string;url:string;filename:string;mimeType:string;size:number;kind:"IMAGE"|"VIDEO"};

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

async function storeMedia(file:File,expectedKind?:"IMAGE"|"VIDEO"):Promise<{asset?:UploadedMedia;error?:string}>{
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

export async function saveTypography(_:ActionState,f:FormData):Promise<ActionState>{await requireAdmin();await saveFontSizes(f);revalidatePath("/", "layout");revalidatePath("/admin/typography");return{success:"Section font sizes saved."};}

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
  await prisma.homepage.update({where:{id:"homepage"},data:{heroEnabled:bool(f,"heroEnabled"),heroEyebrowEn:str(f,"heroEyebrowEn"),heroEyebrowAr:str(f,"heroEyebrowAr"),heroTitleEn:str(f,"heroTitleEn"),heroTitleAr:str(f,"heroTitleAr"),heroNoteEn:str(f,"heroNoteEn"),heroNoteAr:str(f,"heroNoteAr"),heroDiscoverEn:str(f,"heroDiscoverEn"),heroDiscoverAr:str(f,"heroDiscoverAr"),heroMediaUrl:str(f,"heroMediaUrl"),heroMediaAltEn:str(f,"heroMediaAltEn"),heroMediaAltAr:str(f,"heroMediaAltAr"),projectsEnabled:bool(f,"projectsEnabled"),projectsHeadingEn:str(f,"projectsHeadingEn"),projectsHeadingAr:str(f,"projectsHeadingAr"),projectsDescriptionEn:str(f,"projectsDescriptionEn")||null,projectsDescriptionAr:str(f,"projectsDescriptionAr")||null,projectsExploreEn:str(f,"projectsExploreEn"),projectsExploreAr:str(f,"projectsExploreAr"),projectsEnquireEn:str(f,"projectsEnquireEn")||"Enquire",projectsEnquireAr:str(f,"projectsEnquireAr")||"استفسر الآن",projectsViewAllEn:str(f,"projectsViewAllEn")||"View All Projects",projectsViewAllAr:str(f,"projectsViewAllAr")||"جميع المشاريع",projectsSpacing:str(f,"projectsSpacing")||"standard",projectsTheme:str(f,"projectsTheme")||"light",projectsImagePosition:str(f,"projectsImagePosition")||"start",lifestyleEnabled:bool(f,"lifestyleEnabled"),lifestyleEyebrowEn:str(f,"lifestyleEyebrowEn"),lifestyleEyebrowAr:str(f,"lifestyleEyebrowAr"),lifestyleTitleEn:str(f,"lifestyleTitleEn"),lifestyleTitleAr:str(f,"lifestyleTitleAr"),lifestyleMediaUrl:str(f,"lifestyleMediaUrl"),lifestyleMediaAltEn:str(f,"lifestyleMediaAltEn"),lifestyleMediaAltAr:str(f,"lifestyleMediaAltAr"),lifestyleCtaLabelEn:str(f,"lifestyleCtaLabelEn")||"Discover Our Story",lifestyleCtaLabelAr:str(f,"lifestyleCtaLabelAr")||"اكتشف قصتنا",lifestyleCtaUrl:str(f,"lifestyleCtaUrl")||"/about",statsEnabled:bool(f,"statsEnabled"),statsLabelEn:str(f,"statsLabelEn")||null,statsLabelAr:str(f,"statsLabelAr")||null,statsHeadingEn:str(f,"statsHeadingEn")||"Stories, ideas, and updates.",statsHeadingAr:str(f,"statsHeadingAr")||"قصص وأفكار ومستجدات",statsDescriptionEn:str(f,"statsDescriptionEn")||null,statsDescriptionAr:str(f,"statsDescriptionAr")||null,statsImageUrl:str(f,"statsImageUrl")||null,statsImageAltEn:str(f,"statsImageAltEn")||"Image Developments architecture",statsImageAltAr:str(f,"statsImageAltAr")||"العمارة المعاصرة في إيمدج للتطوير العقاري",statsImageFocalPoint:str(f,"statsImageFocalPoint")||"center",statsCtaLabelEn:str(f,"statsCtaLabelEn")||"View All Articles",statsCtaLabelAr:str(f,"statsCtaLabelAr")||"عرض جميع المقالات",statsCtaUrl:str(f,"statsCtaUrl")||"/journal",statsJournalMode:str(f,"statsJournalMode")||"AUTO",statsJournalCategory:str(f,"statsJournalCategory")||"ALL",statsJournalCount:parseInt(str(f,"statsJournalCount")||"3",10)||3,statsJournalArticleIds:str(f,"statsJournalArticleIds")||"[]",journalEnabled:bool(f,"journalEnabled"),journalEyebrowEn:str(f,"journalEyebrowEn"),journalEyebrowAr:str(f,"journalEyebrowAr"),journalTitleEn:str(f,"journalTitleEn"),journalTitleAr:str(f,"journalTitleAr"),closingEnabled:bool(f,"closingEnabled"),closingEyebrowEn:str(f,"closingEyebrowEn"),closingEyebrowAr:str(f,"closingEyebrowAr"),closingTitleEn:str(f,"closingTitleEn"),closingTitleAr:str(f,"closingTitleAr"),closingDescriptionEn:str(f,"closingDescriptionEn")||null,closingDescriptionAr:str(f,"closingDescriptionAr")||null,closingFormHeadingEn:str(f,"closingFormHeadingEn")||null,closingFormHeadingAr:str(f,"closingFormHeadingAr")||null,closingSubmitLabelEn:str(f,"closingSubmitLabelEn")||null,closingSubmitLabelAr:str(f,"closingSubmitLabelAr")||null,closingSuccessMessageEn:str(f,"closingSuccessMessageEn")||null,closingSuccessMessageAr:str(f,"closingSuccessMessageAr")||null,closingCtaEn:str(f,"closingCtaEn"),closingCtaAr:str(f,"closingCtaAr"),closingCtaUrl:str(f,"closingCtaUrl"),sectionOrder:JSON.stringify(order)}});
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
    await tx.homepage.update({where:{id:"homepage"},data:{aboutHeroEnabled:bool(f,"aboutHeroEnabled"),aboutHeroEyebrowEn:str(f,"aboutHeroEyebrowEn"),aboutHeroEyebrowAr:str(f,"aboutHeroEyebrowAr"),aboutHeroTitleEn:str(f,"aboutHeroTitleEn"),aboutHeroTitleAr:str(f,"aboutHeroTitleAr"),aboutHeroBodyEn:str(f,"aboutHeroBodyEn"),aboutHeroBodyAr:str(f,"aboutHeroBodyAr"),aboutHeroImageUrl:str(f,"aboutHeroImageUrl"),aboutHeroImageAltEn:str(f,"aboutHeroImageAltEn"),aboutHeroImageAltAr:str(f,"aboutHeroImageAltAr"),aboutEnabled:bool(f,"aboutEnabled"),aboutEyebrowEn:str(f,"aboutEyebrowEn"),aboutEyebrowAr:str(f,"aboutEyebrowAr"),aboutTitleEn:str(f,"aboutTitleEn"),aboutTitleAr:str(f,"aboutTitleAr"),aboutIntroEn:str(f,"aboutIntroEn"),aboutIntroAr:str(f,"aboutIntroAr")}});
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

export async function saveProject(_:ActionState,f:FormData):Promise<ActionState>{
  await requireAdmin(); 
  const data={
    slug:str(f,"slug"),
    nameEn:str(f,"nameEn"),
    nameAr:str(f,"nameAr"),
    shortDescriptionEn:str(f,"shortDescriptionEn"),
    shortDescriptionAr:str(f,"shortDescriptionAr"),
    locationEn:str(f,"locationEn"),
    locationAr:str(f,"locationAr"),
    coverImageUrl:str(f,"coverImageUrl"),
    status:str(f,"status"),
    featured:bool(f,"featured"),
    featuredOrder:str(f,"featuredOrder")
  };
  const parsed=projectSchema.safeParse(data);
  if(!parsed.success)return{error:parsed.error.issues[0].message};
  const gallery=Array.from({length:4},(_,index)=>str(f,`galleryImage${index+1}`)).filter(Boolean);
  const extra={
    coverImageAltEn:str(f,"coverImageAltEn")||parsed.data.nameEn,
    coverImageAltAr:str(f,"coverImageAltAr")||parsed.data.nameAr,
    coverImageFocalPoint:str(f,"coverImageFocalPoint")||"center",
    ctaLabelEn:str(f,"ctaLabelEn")||null,
    ctaLabelAr:str(f,"ctaLabelAr")||null,
    ctaUrl:str(f,"ctaUrl")||null,
    gallery:gallery.length?JSON.stringify(gallery):str(f,"gallery")||"[]",
    projectType:str(f,"projectType")||"Residential",
    progressStatus:str(f,"progressStatus")||"Ongoing",
    fullDescriptionEn:str(f,"fullDescriptionEn")||null,
    fullDescriptionAr:str(f,"fullDescriptionAr")||null,
    masterPlanUrl:str(f,"masterPlanUrl")||null,
    brochureUrl:str(f,"brochureUrl")||null,
    videoTourUrl:str(f,"videoTourUrl")||null,
    logoUrl:str(f,"logoUrl")||null,
    keyFacts:str(f,"keyFacts")||"[]",
    highlights:str(f,"highlights")||"[]",
    unitTypes:str(f,"unitTypes")||"[]",
    nearbyLocations:str(f,"nearbyLocations")||"[]",
    constructionUpdates:str(f,"constructionUpdates")||"[]",
    seoTitleEn:str(f,"seoTitleEn")||null,
    seoTitleAr:str(f,"seoTitleAr")||null,
    seoDescriptionEn:str(f,"seoDescriptionEn")||null,
    seoDescriptionAr:str(f,"seoDescriptionAr")||null,
    ogImageUrl:str(f,"ogImageUrl")||null
  };
  const id = str(f, "id");
  try {
    if (id) {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (existing && existing.slug !== parsed.data.slug) {
        await prisma.projectRedirect.upsert({
          where: { sourceSlug: existing.slug },
          update: { targetSlug: parsed.data.slug },
          create: { sourceSlug: existing.slug, targetSlug: parsed.data.slug },
        });
        revalidatePath(`/en/projects/${existing.slug}`);
        revalidatePath(`/ar/projects/${existing.slug}`);
      }
      await prisma.project.update({ where: { id }, data: { ...parsed.data, ...extra } });
    } else {
      await prisma.project.create({ data: { ...parsed.data, ...extra } });
    }
  } catch {
    return { error: "The slug must be unique." };
  }

  revalidatePath(`/en/projects/${parsed.data.slug}`);
  revalidatePath(`/ar/projects/${parsed.data.slug}`);
  revalidatePath("/admin/projects");
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/projects");
  revalidatePath("/ar/projects");
  revalidatePath("/", "layout");
  redirect("/admin/projects");
}

export async function deleteProject(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const existing = await prisma.project.findUnique({ where: { id } });
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

export async function uploadHomepageMedia(f:FormData,expectedKind:"IMAGE"|"VIDEO"):Promise<{asset?:UploadedMedia;error?:string}>{await requireAdmin();const file=f.get("file");if(!(file instanceof File)||file.size===0)return{error:`Choose a${expectedKind==="IMAGE"?"n image":" video"} file.`};return storeMedia(file,expectedKind);}

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
