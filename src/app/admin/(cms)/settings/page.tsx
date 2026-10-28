import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/admin/action-form";
import { Bilingual, Field } from "@/components/admin/fields";
import { SocialLinksEditor } from "@/components/admin/social-links-editor";
import { saveSettings } from "../../actions";

export default async function Settings() {
  const s = await prisma.globalSettings.findUniqueOrThrow({
    where: { id: "global" },
    include: { socialLinks: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <p>Global content</p>
          <h1>Settings</h1>
          <span>Manage company identity, hotline, working hours, and brochure downloads.</span>
        </div>
      </header>

      <ActionForm action={saveSettings} className="admin-form">
        <section className="panel">
          <h2>Identity & contact</h2>
          <Bilingual base="siteName" label="Site name" en={s.siteNameEn} ar={s.siteNameAr} />
          <Field name="hotline" label="Hotline (e.g. 17087)" value={s.hotline ?? "17087"} />
          <Field name="contactEmail" label="Contact email" type="email" value={s.contactEmail} />
          <Field name="phone" label="Landline / Direct phone" value={s.phone} />
          <Field name="mapUrl" label="Map destination / Directions URL" value={s.mapUrl ?? ""} />
          <Field name="companyBrochureUrl" label="Company Brochure URL / PDF" value={s.companyBrochureUrl ?? ""} />
          <Bilingual
            base="workingHours"
            label="Working hours"
            en={s.workingHoursEn ?? "Sunday - Thursday: 9:00 AM - 6:00 PM"}
            ar={s.workingHoursAr ?? "الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م"}
          />
          <Bilingual base="address" label="Address" en={s.addressEn} ar={s.addressAr} />
        </section>

        <SocialLinksEditor initialLinks={s.socialLinks} />

        <section className="panel">
          <h2>Footer</h2>
          <Bilingual
            base="description"
            label="Company description (Brand column copy)"
            en={s.descriptionEn ?? ""}
            ar={s.descriptionAr ?? ""}
            textarea
          />
          <Bilingual
            base="footerExploreHeading"
            label="Explore column heading"
            en={s.footerExploreHeadingEn ?? "Explore"}
            ar={s.footerExploreHeadingAr ?? "استكشف"}
          />
          <Bilingual
            base="footerProjectsHeading"
            label="Projects column heading"
            en={s.footerProjectsHeadingEn ?? "Our Projects"}
            ar={s.footerProjectsHeadingAr ?? "مشاريعنا"}
          />
          <Bilingual
            base="footerContactHeading"
            label="Contact column heading"
            en={s.footerContactHeadingEn ?? "Contact"}
            ar={s.footerContactHeadingAr ?? "تواصل معنا"}
          />
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="callbackEnabled"
              name="callbackEnabled"
              defaultChecked={s.callbackEnabled !== false}
            />
            <label htmlFor="callbackEnabled">Enable Request a Call Back action in Contact column</label>
          </div>
          <Bilingual
            base="callbackLabel"
            label="Callback action button label"
            en={s.callbackLabelEn ?? "Request a Call Back"}
            ar={s.callbackLabelAr ?? "طلب معاودة الاتصال"}
          />
          <Bilingual base="copyright" label="Copyright" en={s.copyrightEn} ar={s.copyrightAr} />
        </section>

        <section className="panel">
          <h2>Default SEO</h2>
          <Bilingual base="defaultSeoTitle" label="SEO title" en={s.defaultSeoTitleEn} ar={s.defaultSeoTitleAr} />
          <Bilingual
            base="defaultSeoDescription"
            label="SEO description"
            en={s.defaultSeoDescriptionEn}
            ar={s.defaultSeoDescriptionAr}
            textarea
          />
          <Field name="defaultOgImageUrl" label="Default OG image URL" value={s.defaultOgImageUrl ?? ""} />
        </section>

        <section className="panel">
          <h2>Fullscreen menu media</h2>
          <Field name="menuMediaUrl" label="Image URL" value={s.menuMediaUrl} />
          <Bilingual base="menuMediaAlt" label="Image alt text" en={s.menuMediaAltEn} ar={s.menuMediaAltAr} />
        </section>
      </ActionForm>
    </>
  );
}
