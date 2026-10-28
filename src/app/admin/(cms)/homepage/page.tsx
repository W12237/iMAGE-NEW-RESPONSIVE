import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual, Check, Field, RgbField, Textarea } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media-field";
import { saveHomepage } from "../../actions";
import { TypographyFields } from "@/components/admin/typography-fields";
export default async function HomepageAdmin(){const [h,allAssets,allProjects,allArticles]=await Promise.all([prisma.homepage.findUniqueOrThrow({where:{id:"homepage"},include:{stats:{orderBy:{sortOrder:"asc"}}}}),prisma.mediaAsset.findMany({orderBy:{createdAt:"desc"},select:{id:true,url:true,filename:true,mimeType:true,size:true,kind:true}}),prisma.project.findMany({where:{status:"PUBLISHED"},orderBy:[{featured:"desc"},{featuredOrder:"asc"},{nameEn:"asc"}]}),prisma.newsArticle.findMany({where:{status:"PUBLISHED"},orderBy:[{publicationDate:"desc"}]})]);const videos=allAssets.filter(asset=>asset.kind==="VIDEO");const images=allAssets.filter(asset=>asset.kind==="IMAGE");let currentManualArticleIds:string[]=[];try{currentManualArticleIds=JSON.parse(h.statsJournalArticleIds||"[]");}catch{currentManualArticleIds=[];}return <><header className="page-head"><div><p>Homepage</p><h1>Homepage content</h1><span>Uploads are added to Media immediately. Click Save Homepage to publish field assignments.</span></div></header><ActionForm action={saveHomepage} className="admin-form" submitLabel="Save Homepage">
  <section className="panel"><div className="section-title"><h2>Opening experience</h2><Check name="openingEnabled" label="Enable Opening Experience" checked={h.openingEnabled}/></div><Bilingual base="openingHeadline" label="Opening headline" en={h.openingHeadlineEn} ar={h.openingHeadlineAr}/><MediaField name="openingVideoDesktopUrl" label="Opening Desktop Video" value={h.openingVideoDesktopUrl??""} assets={videos} kind="VIDEO"/><MediaField name="openingVideoMobileUrl" label="Opening Mobile Video" value={h.openingVideoMobileUrl??""} assets={videos} kind="VIDEO"/><MediaField name="openingPosterUrl" label="Opening Poster Image" value={h.openingPosterUrl??""} assets={images} kind="IMAGE"/></section>
  <section className="panel"><div className="section-title"><h2>Hero</h2><Check name="heroEnabled" label="Visible" checked={h.heroEnabled}/></div><Bilingual base="heroEyebrow" label="Eyebrow" en={h.heroEyebrowEn} ar={h.heroEyebrowAr}/><Bilingual base="heroTitle" label="Title (one line per visual line)" en={h.heroTitleEn} ar={h.heroTitleAr} textarea required/><Bilingual base="heroNote" label="Supporting text" en={h.heroNoteEn} ar={h.heroNoteAr} textarea required/><Bilingual base="heroDiscover" label="Discover label" en={h.heroDiscoverEn} ar={h.heroDiscoverAr}/><MediaField name="heroVideoDesktopUrl" label="Hero Desktop Video" value={h.heroVideoDesktopUrl??""} assets={videos} kind="VIDEO"/><MediaField name="heroVideoMobileUrl" label="Hero Mobile Video" value={h.heroVideoMobileUrl??""} assets={videos} kind="VIDEO"/><MediaField name="heroMediaUrl" label="Hero Desktop Image" value={h.heroMediaUrl} assets={images} kind="IMAGE" required/><MediaField name="heroMobileMediaUrl" label="Hero Mobile Image" value={h.heroMobileMediaUrl??""} assets={images} kind="IMAGE"/><MediaField name="heroPosterUrl" label="Hero Poster Image" value={h.heroPosterUrl??""} assets={images} kind="IMAGE"/><Bilingual base="heroMediaAlt" label="Hero image alt text" en={h.heroMediaAltEn} ar={h.heroMediaAltAr}/></section>
  <section className="panel">
    <div className="section-title">
      <h2>Featured developments showcase</h2>
      <Check name="projectsEnabled" label="Section Visible" checked={h.projectsEnabled}/>
    </div>
    <p className="hint">Refined architectural showcase for Image Developments signature destinations on the homepage.</p>
    <Bilingual base="projectsHeading" label="Section Heading" en={h.projectsHeadingEn} ar={h.projectsHeadingAr} required/>
    <Bilingual base="projectsDescription" label="Supporting Description (Optional)" en={h.projectsDescriptionEn || ""} ar={h.projectsDescriptionAr || ""} textarea/>
    <Bilingual base="projectsExplore" label="Primary Action Label (Explore Project)" en={h.projectsExploreEn} ar={h.projectsExploreAr}/>
    <Bilingual base="projectsEnquire" label="Secondary Action Label (Enquiry Modal)" en={h.projectsEnquireEn || "Enquire"} ar={h.projectsEnquireAr || "استفسر الآن"}/>
    <Bilingual base="projectsViewAll" label="Portfolio Link Label (View All)" en={h.projectsViewAllEn || "View All Projects"} ar={h.projectsViewAllAr || "جميع المشاريع"}/>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", margin: "16px 0 24px" }}>
      <div>
        <label htmlFor="projectsSpacing" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Section Spacing</label>
        <select id="projectsSpacing" name="projectsSpacing" defaultValue={h.projectsSpacing || "standard"} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>
          <option value="compact">Compact (Comfortable padding)</option>
          <option value="standard">Standard (Balanced rhythm)</option>
          <option value="spacious">Spacious (Generous breathing room)</option>
        </select>
      </div>
      <div>
        <label htmlFor="projectsTheme" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Background Theme</label>
        <select id="projectsTheme" name="projectsTheme" defaultValue={h.projectsTheme || "light"} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>
          <option value="light">Light (Clean pure background)</option>
          <option value="warm">Warm Cream (Subtle sand)</option>
          <option value="dark">Dark Forest (Deep architectural green)</option>
        </select>
      </div>
      <div>
        <label htmlFor="projectsImagePosition" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Image Position (Desktop)</label>
        <select id="projectsImagePosition" name="projectsImagePosition" defaultValue={h.projectsImagePosition || "start"} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>
          <option value="start">Image First (Start)</option>
          <option value="end">Text First (End)</option>
        </select>
      </div>
    </div>

    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Featured Projects Selector & Order</h3>
      <p className="hint">Choose which published projects appear on the homepage and their display order.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        {allProjects.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.02)", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "10px" }}>
            <input type="hidden" name="managedProjectId" value={p.id} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "200px" }}>
              <input type="checkbox" id={`projectFeatured_${p.id}`} name={`projectFeatured_${p.id}`} defaultChecked={p.featured} style={{ width: "16px", height: "16px" }} />
              <label htmlFor={`projectFeatured_${p.id}`} style={{ fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                {p.nameEn} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({p.nameAr})</span>
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{p.locationEn}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label htmlFor={`projectOrder_${p.id}`} style={{ fontSize: "12px", color: "var(--muted)" }}>Order:</label>
                <input id={`projectOrder_${p.id}`} type="number" name={`projectOrder_${p.id}`} defaultValue={p.featuredOrder} style={{ width: "54px", padding: "4px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border)" }} />
              </div>
              <a href={`/admin/projects/${p.id}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--terracotta)", textDecoration: "underline" }}>
                Edit Project ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
  <section className="panel"><div className="section-title"><h2>Lifestyle</h2><Check name="lifestyleEnabled" label="Visible" checked={h.lifestyleEnabled}/></div><Bilingual base="lifestyleEyebrow" label="Eyebrow" en={h.lifestyleEyebrowEn} ar={h.lifestyleEyebrowAr}/><Bilingual base="lifestyleTitle" label="Heading" en={h.lifestyleTitleEn} ar={h.lifestyleTitleAr} required/><Field name="lifestyleMediaUrl" label="Image URL" value={h.lifestyleMediaUrl}/><Bilingual base="lifestyleMediaAlt" label="Image alt text" en={h.lifestyleMediaAltEn} ar={h.lifestyleMediaAltAr}/><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}><Bilingual base="lifestyleCtaLabel" label="CTA Button Label" en={(h as any).lifestyleCtaLabelEn || "Discover Our Story"} ar={(h as any).lifestyleCtaLabelAr || "اكتشف قصتنا"}/><Field name="lifestyleCtaUrl" label="CTA Destination URL" value={(h as any).lifestyleCtaUrl || "/about"}/></div></section>
  <section className="panel">
    <div className="section-title">
      <h2>News & Journal section</h2>
      <Check name="statsEnabled" label="Section Visible" checked={h.statsEnabled}/>
    </div>
    <p className="hint">Editorial section presenting company stories, architecture perspectives, and recent journal articles directly on the homepage.</p>
    
    <Bilingual base="statsLabel" label="Section label (Eyebrow)" en={h.statsLabelEn || "News & Journal"} ar={h.statsLabelAr || "الأخبار والمقالات"}/>
    <Bilingual base="statsHeading" label="Main Section Heading (H2)" en={h.statsHeadingEn || "Stories, ideas, and updates."} ar={h.statsHeadingAr || "قصص وأفكار ومستجدات"} required/>
    <Bilingual base="statsDescription" label="Section Introduction (Optional)" en={h.statsDescriptionEn || ""} ar={h.statsDescriptionAr || ""} textarea/>

    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Main Call to Action</h3>
      <p className="hint">The button linking to the complete journal archive.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Bilingual base="statsCtaLabel" label="CTA Button Label" en={h.statsCtaLabelEn || "View All Articles"} ar={h.statsCtaLabelAr || "عرض جميع المقالات"}/>
        <Field name="statsCtaUrl" label="CTA Destination URL" value={h.statsCtaUrl || "/journal"}/>
      </div>
    </div>

    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Article Selection & Display Rules</h3>
      <p className="hint">Choose whether to automatically showcase the latest published articles or curate specific articles manually.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "12px" }}>
        <div>
          <label htmlFor="statsJournalMode" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Selection Mode</label>
          <select id="statsJournalMode" name="statsJournalMode" defaultValue={h.statsJournalMode || "AUTO"} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>
            <option value="AUTO">Automatic (Latest Published)</option>
            <option value="MANUAL">Manual (Curated Selection & Order)</option>
          </select>
        </div>

        <div>
          <label htmlFor="statsJournalCategory" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Category Filter</label>
          <select id="statsJournalCategory" name="statsJournalCategory" defaultValue={h.statsJournalCategory || "ALL"} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>
            <option value="ALL">All Categories</option>
            <option value="ARCHITECTURE">Architecture / عمارة وتصميم</option>
            <option value="CONSTRUCTION">Construction / إنشاءات وتطوير</option>
            <option value="EVENTS">Events / فعاليات ومناسبات</option>
            <option value="COMMUNITY">Community / مجتمع وحياة</option>
            <option value="DESIGN">Design / تصميم داخلي</option>
            <option value="NEWS">News / أخبار ومستجدات</option>
          </select>
        </div>

        <div>
          <label htmlFor="statsJournalCount" style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Number of Articles Displayed</label>
          <input id="statsJournalCount" type="number" name="statsJournalCount" min={1} max={6} defaultValue={h.statsJournalCount ?? 3} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}/>
        </div>
      </div>
    </div>

    {allArticles.length > 0 && (
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Manual Article Selection & Ordering</h3>
        <p className="hint">When Selection Mode is set to Manual, the checked articles below will be displayed in the specified order (1, 2, 3...). Enter order numbers to position them.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
          {allArticles.map((art) => {
            const manualIndex = currentManualArticleIds.indexOf(art.id);
            const isSelected = manualIndex !== -1;
            const orderNum = isSelected ? manualIndex + 1 : 99;
            return (
              <div key={art.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.02)", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.08)", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                  <input type="checkbox" name={`manualArticleSelect_${art.id}`} defaultChecked={isSelected} style={{ width: "16px", height: "16px" }}/>
                  <input type="hidden" name="availableArticleId" value={art.id}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{art.titleEn}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", direction: "rtl", textAlign: "right" }}>{art.titleAr}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(0,0,0,0.06)", borderRadius: "3px", textTransform: "uppercase" }}>{art.category}</span>
                  <label htmlFor={`manualArticleOrder_${art.id}`} style={{ fontSize: "12px", color: "var(--muted)" }}>Order:</label>
                  <input id={`manualArticleOrder_${art.id}`} type="number" name={`manualArticleOrder_${art.id}`} defaultValue={orderNum} min={1} max={99} style={{ width: "50px", padding: "4px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border)" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </section>
  <section className="panel"><div className="section-title"><h2>Journal preview</h2><Check name="journalEnabled" label="Visible" checked={h.journalEnabled}/></div><Bilingual base="journalEyebrow" label="Eyebrow" en={h.journalEyebrowEn} ar={h.journalEyebrowAr}/><Bilingual base="journalTitle" label="Heading" en={h.journalTitleEn} ar={h.journalTitleAr}/><p className="hint">Featured articles and their order are managed under News.</p></section>
  <section className="panel">
    <div className="section-title">
      <h2>Enquiry & information card section (Closing)</h2>
      <Check name="closingEnabled" label="Section Visible" checked={h.closingEnabled}/>
    </div>
    <p className="hint">Manage the deep-green information card (heading, description, hotline) and the adjacent compact callback form.</p>
    
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Information Card (Left Column)</h3>
      <Bilingual base="closingEyebrow" label="Card Small Label (Eyebrow)" en={h.closingEyebrowEn || "LET’S TALK"} ar={h.closingEyebrowAr || "لنتحدث"}/>
      <Bilingual base="closingTitle" label="Card Main Heading (H2)" en={h.closingTitleEn || "Find your next place."} ar={h.closingTitleAr || "اكتشف مكانك القادم"} required/>
      <Bilingual base="closingDescription" label="Card Description Text" en={h.closingDescriptionEn || "Tell us which project interests you, and our team will help you explore the details."} ar={h.closingDescriptionAr || "أخبرنا بالمشروع الذي يهمك، وسيساعدك فريقنا في التعرف على التفاصيل."} textarea/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
        <Bilingual base="closingCta" label="Telephone Action Label" en={h.closingCtaEn || "Call 17087"} ar={h.closingCtaAr || "اتصل على 17087"}/>
        <Field name="closingCtaUrl" label="Telephone Action Destination (e.g. tel:17087)" value={h.closingCtaUrl || "tel:17087"}/>
      </div>
    </div>

    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px" }}>Enquiry Form (Right Column)</h3>
      <p className="hint">The form includes Full Name, Phone with country calling code, optional Email, and optional Project dropdown automatically populated from published projects.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
        <Bilingual base="closingFormHeading" label="Form Card Heading" en={h.closingFormHeadingEn || "Request a Call Back"} ar={h.closingFormHeadingAr || "طلب معاودة الاتصال"}/>
        <Bilingual base="closingSubmitLabel" label="Submit Button Label" en={h.closingSubmitLabelEn || "Request a Call Back"} ar={h.closingSubmitLabelAr || "اطلب اتصالاً"}/>
      </div>
      <Bilingual base="closingSuccessMessage" label="Confirmation Message (After Submission)" en={h.closingSuccessMessageEn || "Thank you, your enquiry has been received. Our specialized team will be in touch shortly."} ar={h.closingSuccessMessageAr || "شكراً لك، تم استلام استفسارك بنجاح. سيتواصل معك فريقنا المختص قريباً."} textarea/>
    </div>
  </section>
  <section className="panel"><h2>Homepage background colors</h2><p className="hint">Each label names the exact homepage section that will change. Use the format red, green, blue; each number must be between 0 and 255.</p><div className="bilingual"><RgbField name="openingBackgroundRgb" label="Homepage — Opening experience" value={h.openingBackgroundRgb}/><RgbField name="heroBackgroundRgb" label="Homepage — Hero" value={h.heroBackgroundRgb}/><RgbField name="projectsBackgroundRgb" label="Homepage — Featured projects" value={h.projectsBackgroundRgb}/><RgbField name="aboutBackgroundRgb" label="Homepage — About us timeline" value={h.aboutBackgroundRgb}/><RgbField name="lifestyleBackgroundRgb" label="Homepage — Lifestyle" value={h.lifestyleBackgroundRgb}/><RgbField name="statsBackgroundRgb" label="Homepage — News & Journal" value={h.statsBackgroundRgb}/><RgbField name="journalBackgroundRgb" label="Homepage — Journal preview" value={h.journalBackgroundRgb}/><RgbField name="closingBackgroundRgb" label="Homepage — Closing contact section" value={h.closingBackgroundRgb}/><RgbField name="footerBackgroundRgb" label="Homepage — Footer" value={h.footerBackgroundRgb}/></div></section>
  <section className="panel"><h2>Controlled section order</h2><Textarea name="sectionOrder" label="Comma-separated known sections" value={(JSON.parse(h.sectionOrder) as string[]).filter(section=>section!=="story").join(", ")} required/><p className="hint">Allowed: projects, lifestyle, stats, journal, closing. Hero and footer remain fixed.</p></section>
  <TypographyFields fields={[{key:"opening",label:"Opening experience"},{key:"homeHero",label:"Homepage — Hero"},{key:"projects",label:"Featured projects / Developments"},{key:"aboutTimeline",label:"About timeline"},{key:"lifestyle",label:"Lifestyle"},{key:"stats",label:"News & Journal"},{key:"journal",label:"Journal preview / Journal page"},{key:"closing",label:"Closing contact section"},{key:"footer",label:"Footer wordmark"}]}/>
  </ActionForm></>}
