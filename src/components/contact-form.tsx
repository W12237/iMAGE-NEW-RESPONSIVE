"use client";

import React, { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { submitContact, type ContactState } from "@/app/actions";
import type { HomeContent } from "@/content/home";
import { localizedCallingCodes } from "@/lib/country-calling-codes";

const initial: ContactState = { status: "idle" };

export interface ContactFormProps {
  copy: HomeContent;
  variant?: "callback" | "contact";
  sourcePage?: string;
  sourceCta?: string;
  projectId?: string;
}

export function ContactForm({
  copy,
  variant = "callback",
  sourcePage = "home-contact",
  sourceCta = "direct",
  projectId,
}: ContactFormProps) {
  const [state, action, pending] = useActionState(submitContact, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const ar = copy.locale === "ar";
  const countries = localizedCallingCodes(copy.locale);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <div className="enquiry-success-icon" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3>{ar ? "تم استلام طلبك بنجاح" : "Request Successfully Received"}</h3>
        <p>
          {state.message ||
            copy.closing.successMessage ||
            (ar
              ? "شكراً لتواصلك معنا. سيتواصل معك مستشارونا العقاريون قريباً."
              : "Thank you for reaching out. Our property advisors will be in touch shortly.")}
        </p>
        <button
          type="button"
          className="contact-submit-btn contact-reset-btn"
          onClick={() => window.location.reload()}
        >
          {ar ? "إرسال طلب آخر" : "Send Another Request"}
        </button>
      </div>
    );
  }

  const defaultCountry = state.values?.countryCode || "EG:+20";
  const defaultProject = state.values?.projectId ?? (projectId || "");

  // Submit button text:
  // In callback mode, default to "Request a Call Back" / "اطلب اتصالاً"
  // In contact mode, default to "Send Enquiry" / "إرسال الاستفسار"
  const submitButtonLabel =
    variant === "contact"
      ? ar
        ? "إرسال الاستفسار"
        : "Send Enquiry"
      : copy.closing.submitLabel ||
        (ar ? "اطلب اتصالاً" : "Request a Call Back");

  return (
    <form
      ref={formRef}
      action={action}
      className={`contact-form-refined ${variant === "contact" ? "contact-form--full" : ""}`}
      noValidate
    >
      {state.status === "error" && state.message && (
        <div className="contact-status-banner error" role="alert">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      {/* Form Legend */}
      <div className="contact-form-legend" aria-hidden="true">
        <span className="contact-required-mark">*</span>
        <span>
          {ar ? "الحقول المشار إليها مطلوبة" : "Indicates required field"}
        </span>
      </div>

      {/* Hidden Metadata Inputs */}
      <input type="hidden" name="locale" value={copy.locale} />
      <input type="hidden" name="formVariant" value={variant} />
      <input
        type="hidden"
        name="enquiryType"
        value={variant === "contact" ? "contact" : "callback"}
      />
      <input type="hidden" name="sourcePage" value={sourcePage} />
      <input type="hidden" name="sourceCta" value={sourceCta} />
      <input
        className="contact-honeypot"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* 1. Full Name — Required */}
      <div className="contact-form-group">
        <label htmlFor="contact-name" className="contact-label">
          <span>{ar ? "الاسم بالكامل" : "Full Name"}</span>
          <span className="contact-required-mark" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          defaultValue={state.values?.name ?? ""}
          placeholder={ar ? "مثال: أحمد محمد" : "e.g. John Doe"}
          aria-invalid={!!state.fields?.name}
          aria-describedby={state.fields?.name ? "contact-name-error" : undefined}
          autoComplete="name"
          className={`contact-input ${state.fields?.name ? "has-error" : ""}`}
        />
        {state.fields?.name && (
          <span
            id="contact-name-error"
            className="contact-field-error"
            role="alert"
          >
            {state.fields.name}
          </span>
        )}
      </div>

      {/* 2. Phone & Country Calling Code — Required */}
      <div className="contact-form-group">
        <label htmlFor="contact-phone" className="contact-label">
          <span>{ar ? "رقم الهاتف" : "Phone Number"}</span>
          <span className="contact-required-mark" aria-hidden="true">*</span>
        </label>
        <div
          className={`contact-phone-composite ${
            state.fields?.phone || state.fields?.countryCode ? "has-error" : ""
          }`}
        >
          <div className="contact-phone-prefix">
            <select
              id="contact-country"
              name="countryCode"
              defaultValue={defaultCountry}
              required
              aria-label={ar ? "رمز الدولة والاتصال" : "Country calling code"}
              className="contact-select-country"
            >
              {countries.map((c) => (
                <option value={`${c.country}:${c.code}`} key={c.country}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <svg
              className="contact-chevron-icon"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="contact-phone-divider" aria-hidden="true" />
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            required
            dir="ltr"
            defaultValue={state.values?.phone ?? ""}
            placeholder={ar ? "010 0000 0000" : "10 0000 0000"}
            aria-invalid={!!state.fields?.phone}
            aria-describedby={
              state.fields?.phone ? "contact-phone-error" : undefined
            }
            autoComplete="tel-national"
            className="contact-input-phone"
          />
        </div>
        {(state.fields?.phone || state.fields?.countryCode) && (
          <span
            id="contact-phone-error"
            className="contact-field-error"
            role="alert"
          >
            {state.fields?.phone || state.fields?.countryCode}
          </span>
        )}
      </div>

      {/* 3. Email Address — Optional */}
      <div className="contact-form-group">
        <label htmlFor="contact-email" className="contact-label">
          <span>{ar ? "البريد الإلكتروني" : "Email Address"}</span>
          <span className="contact-optional-tag">
            {ar ? "(اختياري)" : "(Optional)"}
          </span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          dir="ltr"
          defaultValue={state.values?.email ?? ""}
          placeholder="name@example.com"
          aria-invalid={!!state.fields?.email}
          aria-describedby={
            state.fields?.email ? "contact-email-error" : undefined
          }
          autoComplete="email"
          className={`contact-input contact-input-ltr ${
            state.fields?.email ? "has-error" : ""
          }`}
        />
        {state.fields?.email && (
          <span
            id="contact-email-error"
            className="contact-field-error"
            role="alert"
          >
            {state.fields.email}
          </span>
        )}
      </div>

      {/* 4. Interested Project — Optional dropdown populated from published projects */}
      <div className="contact-form-group">
        <label htmlFor="contact-project" className="contact-label">
          <span>{ar ? "المشروع المطلوب" : "Interested Project"}</span>
          <span className="contact-optional-tag">
            {ar ? "(اختياري)" : "(Optional)"}
          </span>
        </label>
        <div className="contact-select-wrap">
          <select
            id="contact-project"
            name="projectId"
            defaultValue={defaultProject}
            aria-invalid={!!state.fields?.projectId}
            aria-describedby={
              state.fields?.projectId ? "contact-project-error" : undefined
            }
            className={`contact-input contact-select ${
              state.fields?.projectId ? "has-error" : ""
            }`}
          >
            <option value="">
              {ar
                ? "كافة المشاريع / استفسار عام"
                : "All Projects / General Portfolio"}
            </option>
            {copy.inquiryProjects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <svg
            className="contact-chevron-icon"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {state.fields?.projectId && (
          <span
            id="contact-project-error"
            className="contact-field-error"
            role="alert"
          >
            {state.fields.projectId}
          </span>
        )}
      </div>

      {/* 5. Message Field — ONLY rendered when variant === "contact" (dedicated Contact page) */}
      {variant === "contact" && (
        <div className="contact-form-group contact-form-group--full">
          <label htmlFor="contact-message" className="contact-label">
            <span>
              {ar ? "رسالتك أو تفاصيل استفسارك" : "Message or Enquiry Details"}
            </span>
            <span className="contact-required-mark" aria-hidden="true">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            required
            defaultValue={state.values?.message ?? ""}
            placeholder={
              ar
                ? "أخبرنا بالوحدات أو المساحات أو المواعيد التي تناسبك..."
                : "Tell us about your requirements, preferred spaces, or inquiries..."
            }
            aria-invalid={!!state.fields?.message}
            aria-describedby={
              state.fields?.message ? "contact-message-error" : undefined
            }
            className={`contact-input contact-textarea ${
              state.fields?.message ? "has-error" : ""
            }`}
          />
          {state.fields?.message && (
            <span
              id="contact-message-error"
              className="contact-field-error"
              role="alert"
            >
              {state.fields.message}
            </span>
          )}
        </div>
      )}

      {/* 6. Privacy & Terms Consents */}
      <div className="contact-consent-group">
        <div className="contact-consent-item">
          <input
            type="checkbox"
            id="contact-consent"
            name="consent"
            required
            defaultChecked={state.values ? state.values.consent : true}
            aria-invalid={!!state.fields?.consent}
            aria-describedby={
              state.fields?.consent ? "contact-consent-error" : undefined
            }
            className="contact-checkbox"
          />
          <label htmlFor="contact-consent" className="contact-checkbox-label">
            {ar ? (
              <span>
                أوافق على{" "}
                <Link
                  href={`/${copy.locale}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-privacy-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  الشروط والأحكام
                </Link>{" "}
                و{" "}
                <Link
                  href={`/${copy.locale}/policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-privacy-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  سياسة الخصوصية
                </Link>{" "}
                لشركة إيمدج واستخدام بياناتي للرد على هذا الاستفسار.
                <span className="contact-required-mark" aria-hidden="true">
                  *
                </span>
              </span>
            ) : (
              <span>
                I agree to the{" "}
                <Link
                  href={`/${copy.locale}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-privacy-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href={`/${copy.locale}/policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-privacy-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>{" "}
                and consent to Image Developments processing my information for
                this enquiry.
                <span className="contact-required-mark" aria-hidden="true">
                  *
                </span>
              </span>
            )}
          </label>
        </div>
        {state.fields?.consent && (
          <span
            id="contact-consent-error"
            className="contact-field-error"
            role="alert"
          >
            {state.fields.consent}
          </span>
        )}

        <div className="contact-consent-item">
          <input
            type="checkbox"
            id="contact-marketing-consent"
            name="marketingConsent"
            defaultChecked={
              state.values ? state.values.marketingConsent : false
            }
            className="contact-checkbox"
          />
          <label
            htmlFor="contact-marketing-consent"
            className="contact-checkbox-label"
          >
            <span>
              {ar
                ? "أرغب في استلام تحديثات المشاريع الجديدة والفرص الاستثمارية (اختياري)."
                : "Keep me informed about future project launches and market insights (optional)."}
            </span>
          </label>
        </div>
      </div>

      {/* 7. Submit Button */}
      <div className="contact-submit-row">
        <button
          type="submit"
          id="contact-form-submit-btn"
          className="contact-submit-btn"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <>
              <span className="contact-submit-spinner" aria-hidden="true" />
              <span>
                {ar ? "جارٍ إرسال الطلب…" : "Sending Request…"}
              </span>
            </>
          ) : (
            <>
              <span>{submitButtonLabel}</span>
              <span aria-hidden="true" className="contact-submit-arrow">
                {ar ? "←" : "→"}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export interface GlobalContactFormProps {
  copy: HomeContent;
  variant?: "callback" | "contact";
  label?: string;
  heading?: string;
  description?: string;
  cardVisible?: boolean;
  hotline?: string;
  id?: string;
  className?: string;
  projectId?: string;
  sourcePage?: string;
  sourceCta?: string;
  children?: React.ReactNode;
}

export function GlobalContactForm({
  copy,
  variant = "callback",
  label,
  heading,
  description,
  cardVisible = true,
  hotline,
  id = "contact",
  className = "",
  projectId,
  sourcePage = "home-contact",
  sourceCta = "direct",
  children,
}: GlobalContactFormProps) {
  const ar = copy.locale === "ar";
  const reduce = useReducedMotion();

  // Information Card Content:
  // Label: "LET’S TALK" / "لنتحدث"
  const displayLabel =
    label ?? copy.closing.eyebrow ?? (ar ? "لنتحدث" : "LET’S TALK");

  // Heading: "Find your next place." / "اكتشف مكانك القادم"
  const displayHeading =
    heading ??
    copy.closing.title ??
    (ar ? "اكتشف مكانك القادم" : "Find your next place.");

  // Description: "Tell us which project interests you, and our team will help you explore the details."
  const displayDescription =
    description ??
    copy.closing.description ??
    (ar
      ? "أخبرنا بالمشروع الذي يهمك، وسيساعدك فريقنا في التعرف على التفاصيل."
      : "Tell us which project interests you, and our team will help you explore the details.");

  // Hotline: inherited from global contact settings or default 17087
  const hotlineDisplay = hotline || copy.settings?.hotline || "17087";
  const hotlineDestination = (
    copy.closing.url?.startsWith("tel:")
      ? copy.closing.url.replace("tel:", "")
      : hotlineDisplay
  ).trim();

  // Form Card Heading:
  const formTitle =
    copy.closing.formHeading ||
    (variant === "contact"
      ? ar
        ? "أرسل لنا استفسارك"
        : "Send us an enquiry"
      : ar
      ? "طلب معاودة الاتصال"
      : "Request a Call Back");

  const hasCustomBg = Boolean(
    copy.backgrounds?.closing &&
      copy.backgrounds.closing !== "255, 255, 255" &&
      copy.backgrounds.closing !== "255,255,255"
  );
  const bgStyle = hasCustomBg
    ? { backgroundColor: `rgb(${copy.backgrounds.closing})` }
    : undefined;

  return (
    <section
      id={id}
      className={`global-contact stage-pad ${className}`.trim()}
      style={bgStyle}
      aria-labelledby={`${id}-heading`}
    >
      <div
        className={`global-contact-container ${
          !cardVisible ? "global-contact-container--single" : ""
        }`}
      >
        {/* Column 1: Information Card (~40%) */}
        {cardVisible && (
          <motion.div
            className="global-contact-info-card"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="contact-card-top">
              {displayLabel && (
                <div className="contact-card-eyebrow-wrap">
                  <span className="contact-card-badge">{displayLabel}</span>
                </div>
              )}
              <h2 id={`${id}-heading`} className="contact-card-heading">
                {displayHeading}
              </h2>
              <p className="contact-card-desc">{displayDescription}</p>
            </div>

            <div className="contact-card-bottom">
              <span className="contact-card-hotline-prompt">
                {ar ? "أو اتصل مباشرة بالخط الساخن:" : "Or call directly on hotline:"}
              </span>
              <a
                href={`tel:${hotlineDestination}`}
                className="contact-card-hotline-action"
                aria-label={
                  ar ? `اتصل على ${hotlineDisplay}` : `Call ${hotlineDisplay}`
                }
              >
                <div className="contact-card-hotline-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="contact-card-hotline-text">
                  <span className="contact-card-hotline-label">
                    {ar ? `اتصل على ${hotlineDisplay}` : `Call ${hotlineDisplay}`}
                  </span>
                  <strong className="contact-card-hotline-num" dir="ltr">
                    {hotlineDisplay}
                  </strong>
                </div>
              </a>
            </div>
          </motion.div>
        )}

        {/* Column 2: Enquiry Form Card (~60%) */}
        <motion.div
          className="contact-form-wrap"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.6,
            delay: reduce ? 0 : 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="contact-form-head">
            <h3 className="contact-form-title">{formTitle}</h3>
          </div>
          {children ?? (
            <ContactForm
              copy={copy}
              variant={variant}
              sourcePage={sourcePage}
              sourceCta={sourceCta}
              projectId={projectId}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
