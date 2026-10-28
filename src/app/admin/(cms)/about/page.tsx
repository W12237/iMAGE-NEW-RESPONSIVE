import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual, Check } from "@/components/admin/fields";
import { AboutMagazineEditor } from "@/components/admin/about-magazine-editor";
import { AboutContentEditor } from "@/components/admin/about-content-editor";
import { MediaField } from "@/components/admin/media-field";
import { saveAbout } from "../../actions";
import { TypographyFields } from "@/components/admin/typography-fields";

export default async function AboutAdmin() {
  const [home, milestones, blocks, images] = await Promise.all([
    prisma.homepage.findUniqueOrThrow({ where: { id: "homepage" } }),
    prisma.aboutMilestone.findMany({ where: { homepageId: "homepage" }, orderBy: { sortOrder: "asc" } }),
    prisma.aboutContentBlock.findMany({ where: { homepageId: "homepage" }, orderBy: { sortOrder: "asc" } }),
    prisma.mediaAsset.findMany({ where: { kind: "IMAGE" }, orderBy: { createdAt: "desc" }, select: { id:true,url:true,filename:true,mimeType:true,size:true,kind:true } }),
  ]);
  return <><header className="page-head"><div><p>Standalone page</p><h1>About us page</h1><span>Control the page hero, animated timeline, and every flexible content section.</span></div></header><ActionForm action={saveAbout} className="admin-form" submitLabel="Save About Page">
    <section className="panel"><div className="section-title"><h2>Page hero</h2><Check name="aboutHeroEnabled" label="Visible" checked={home.aboutHeroEnabled}/></div><Bilingual base="aboutHeroEyebrow" label="Eyebrow" en={home.aboutHeroEyebrowEn} ar={home.aboutHeroEyebrowAr} required/><Bilingual base="aboutHeroTitle" label="Heading" en={home.aboutHeroTitleEn} ar={home.aboutHeroTitleAr} textarea required/><Bilingual base="aboutHeroBody" label="Introduction" en={home.aboutHeroBodyEn} ar={home.aboutHeroBodyAr} textarea required/><MediaField name="aboutHeroImageUrl" label="Hero image" value={home.aboutHeroImageUrl??home.heroMediaUrl} assets={images} kind="IMAGE" required/><Bilingual base="aboutHeroImageAlt" label="Hero image alt text" en={home.aboutHeroImageAltEn} ar={home.aboutHeroImageAltAr} required/></section>
    <section className="panel"><div className="section-title"><h2>Animated timeline</h2><Check name="aboutEnabled" label="Visible" checked={home.aboutEnabled}/></div><Bilingual base="aboutEyebrow" label="Eyebrow" en={home.aboutEyebrowEn} ar={home.aboutEyebrowAr} required/><Bilingual base="aboutTitle" label="Heading" en={home.aboutTitleEn} ar={home.aboutTitleAr} textarea required/><Bilingual base="aboutIntro" label="Introduction" en={home.aboutIntroEn} ar={home.aboutIntroAr} textarea required/></section>
    <TypographyFields fields={[{key:"aboutHero",label:"About page — Hero"},{key:"aboutTimeline",label:"About page — Timeline"},{key:"aboutBlocks",label:"About page — Content sections"}]}/>
    <AboutMagazineEditor initialPages={milestones} assets={images}/>
    <AboutContentEditor initialBlocks={blocks} assets={images}/>
  </ActionForm></>;
}
