"use client";

import type { ContactPageContent } from "@/content/home";
import { SiteHeader } from "./site-header";
import { Footer } from "./homepage-experience";
import { GlobalContactForm } from "./contact-form";

export function ContactPageExperience({ copy }: { copy: ContactPageContent }) {
  const ar = copy.locale === "ar";
  const s = copy.settings;
  const hotline = s?.hotline || "17087";
  const email = s?.email || "hello@imagedevelopments.com";
  const address = s?.address || (ar ? "القاهرة · جمهورية مصر العربية" : "Cairo, Arab Republic of Egypt");
  const workingHours = s?.workingHours || (ar ? "الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م" : "Sunday - Thursday: 9:00 AM - 6:00 PM");

  const scrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("contact-form");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <SiteHeader copy={copy} page="contact" />
      <main className="contact-page-redesign" dir={copy.dir}>
        {/* Section A: Hero */}
        <section className="contact-hero-section stage-pad">
          <div className="contact-hero-container">
            <span className="contact-eyebrow">
              {copy.contactPage.eyebrow || (ar ? "٠١ / تواصل معنا" : "01 / Contact Us")}
            </span>
            <h1 className="contact-headline">
              {ar ? "دعنا نتحدث." : "Let’s Talk."}
            </h1>
            <p className="contact-hero-intro">
              {copy.contactPage.intro ||
                (ar
                  ? "سواء كنت مهتماً بحجز وحدة مميزة في مشاريعنا، أو لديك استفسار حول استثماراتك، فريقنا الاستشاري في خدمتك."
                  : "Whether you are looking to reserve a unit across our developments or have an inquiry regarding your investments, our advisory team is here for you.")}
            </p>
            <div className="contact-hero-actions">
              <a
                href="#contact-form"
                onClick={scrollToForm}
                className="contact-action-btn primary"
              >
                <span>{ar ? "أرسل استفسارك" : "Send an Inquiry"}</span>
                <span aria-hidden="true" className="contact-action-arrow">↓</span>
              </a>
              <a
                href={`tel:${hotline}`}
                className="contact-action-btn secondary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{ar ? `الخط الساخن ${hotline}` : `Hotline ${hotline}`}</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section B: Contact Information */}
        <section className="contact-info-section stage-pad">
          <div className="contact-section-header">
            <span className="contact-section-num">02</span>
            <h2>{ar ? "معلومات التواصل" : "Contact Information"}</h2>
            <p>{ar ? "طرق مباشرة وموثوقة للتواصل مع مستشارينا." : "Direct, reliable channels to reach our team."}</p>
          </div>

          <div className="contact-cards-grid">
            {/* Hotline Card */}
            <div className="contact-card highlight-card">
              <div className="contact-card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <span className="contact-card-label">{ar ? "الخط الساخن المباشر" : "Direct Hotline"}</span>
              <strong className="contact-card-value contact-hotline-val">{hotline}</strong>
              <p className="contact-card-sub">{ar ? "خدمة العملاء والاستفسارات على مدار الأسبوع" : "Customer care & general enquiries"}</p>
              <a href={`tel:${hotline}`} className="contact-card-cta">
                <span>{ar ? `اتصل بـ ${hotline}` : `Call ${hotline}`}</span>
                <span aria-hidden="true">{ar ? "←" : "→"}</span>
              </a>
            </div>

            {/* Email Card */}
            <div className="contact-card">
              <div className="contact-card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <span className="contact-card-label">{ar ? "البريد الإلكتروني" : "Email Address"}</span>
              <strong className="contact-card-value">{email}</strong>
              <p className="contact-card-sub">{ar ? "للطلبات والمراسلات الرسمية والشراكات" : "For enquiries, partnerships, and official notices"}</p>
              <a href={`mailto:${email}`} className="contact-card-cta">
                <span>{ar ? "إرسال بريد إلكتروني" : "Send Email"}</span>
                <span aria-hidden="true">{ar ? "←" : "→"}</span>
              </a>
            </div>

            {/* Working Hours Card */}
            <div className="contact-card">
              <div className="contact-card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="contact-card-label">{ar ? "ساعات العمل" : "Working Hours"}</span>
              <strong className="contact-card-value text-normal">{workingHours}</strong>
              <p className="contact-card-sub">{ar ? "المكتب الرئيسي وصالات العرض" : "Head office & presentation galleries"}</p>
            </div>

            {/* Address Card */}
            <div className="contact-card">
              <div className="contact-card-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="contact-card-label">{ar ? "المقر الرئيسي" : "Headquarters"}</span>
              <strong className="contact-card-value text-normal">{address}</strong>
              <p className="contact-card-sub">{ar ? "نرحب بزيارتكم بموعد مسبق" : "Visits welcomed by appointment"}</p>
            </div>
          </div>

          {/* Social Links */}
          {s?.socials && s.socials.length > 0 && (
            <div className="contact-social-bar">
              <span className="contact-social-title">{ar ? "تابعنا على المنصات الرسمية:" : "Follow our official channels:"}</span>
              <div className="contact-social-links">
                {s.socials.map((soc) => (
                  <a
                    key={soc.label}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-social-item"
                  >
                    <span>{soc.label}</span>
                    <span aria-hidden="true" style={{ fontSize: "12px" }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section C: Location Map */}
        <section className="contact-map-section stage-pad">
          <div className="contact-section-header">
            <span className="contact-section-num">03</span>
            <h2>{ar ? "موقع المقر الرئيسي" : "Headquarters Location"}</h2>
            <p>{ar ? "يسعدنا استقبالكم في مقر إيمدج للتطوير العقاري." : "We welcome you at the Image Developments headquarters."}</p>
          </div>

          <div className="contact-map-card">
            <div className="contact-map-embed">
              <iframe
                title={ar ? "خريطة مقر إيمدج" : "Image Developments Office Map"}
                src="https://maps.google.com/maps?q=New%20Cairo,%20Cairo%20Governorate,%20Egypt&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="contact-map-details">
              <div className="contact-map-info-block">
                <span className="contact-map-sub">{ar ? "العنوان بالتفصيل" : "Office Address"}</span>
                <p className="contact-map-addr">{address}</p>
              </div>
              <a
                href="https://maps.google.com/?q=New+Cairo+Egypt"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-directions-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                <span>{ar ? "الاتجاهات على الخريطة" : "Get Directions"}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section D: Reusable Refined Enquiry / Contact Section */}
        <GlobalContactForm
          copy={copy}
          id="contact-form"
          variant="contact"
          sourcePage="contact-page"
          label={ar ? "لنتحدث" : "LET’S TALK"}
          heading={ar ? "أرسل لنا رسالة" : "Send Us a Message"}
          description={
            ar
              ? "املأ النموذج أدناه وسيتواصل معك مستشارونا العقاريون لمساعدتك في كل خطوة."
              : "Fill out the form below and our property advisors will guide you through every step."
          }
        />
      </main>
      <Footer copy={copy} page="contact" />
    </>
  );
}
