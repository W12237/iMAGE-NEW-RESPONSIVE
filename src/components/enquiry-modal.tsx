"use client";

import React, { useActionState, useEffect, useRef, useState, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { submitContact, type ContactState } from "@/app/actions";
import type { HomeContent } from "@/content/home";
import { localizedCallingCodes } from "@/lib/country-calling-codes";

export interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  copy: HomeContent;
  initialProjectId?: string;
  initialProjectName?: string;
  initialUnitType?: string;
  enquiryType?: "project" | "general" | "callback" | "visit";
  sourceCta?: string;
  sourcePage?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

interface EnquiryModalContentProps extends EnquiryModalProps {
  isClosing: boolean;
}

const initialContactState: ContactState = { status: "idle" };

function EnquiryModalContent({
  isOpen,
  onClose,
  isClosing,
  copy,
  initialProjectId = "",
  initialProjectName = "",
  initialUnitType = "",
  enquiryType = "general",
  sourceCta = "direct",
  sourcePage = "",
  triggerRef,
}: EnquiryModalContentProps) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [showProjectPicker, setShowProjectPicker] = useState(!initialProjectId);
  const [consentOverride, setConsentOverride] = useState<boolean | null>(null);
  const [clientConsentError, setClientConsentError] = useState<string | null>(null);

  // Default to true on fresh open, preserve visitor selection or server-returned values
  const consent =
    consentOverride !== null
      ? consentOverride
      : state.values && typeof state.values.consent === "boolean"
      ? state.values.consent
      : true;

  const dialogRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const titleId = useId();

  const ar = copy.locale === "ar";
  const countries = localizedCallingCodes(copy.locale);

  // Focus trap, Escape key, background inert, and scroll locking without horizontal jump
  useEffect(() => {
    if (!isOpen) return;

    // Record previous active element to restore focus on close
    const previousActiveElement = (triggerRef?.current || document.activeElement) as HTMLElement | null;

    // Prevent horizontal page jump by compensating for hidden scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Set background content inert so focus & assistive tech cannot leave modal
    const mainEl = document.querySelector("main") || document.getElementById("site-main");
    if (mainEl) {
      mainEl.setAttribute("inert", "");
    }

    // Pause lenis smooth scroll if present
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    lenis?.stop();

    // Focus first input or close button inside modal
    const timer = setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, button.enquiry-close-button'
      );
      firstFocusable?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      // Trap Tab focus inside modal
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (mainEl) {
        mainEl.removeAttribute("inert");
      }
      lenis?.start();
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement && typeof previousActiveElement.focus === "function") {
        previousActiveElement.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  // Focus the first invalid field when server validation fails
  useEffect(() => {
    if (state.status === "error" && state.fields && formRef.current) {
      const firstErrorField = Object.keys(state.fields)[0];
      if (firstErrorField) {
        const input = formRef.current.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
        input?.focus();
      }
    }
  }, [state]);

  // Active project metadata
  const activeProject = copy.inquiryProjects.find((p) => p.id === selectedProjectId);
  const activeProjectName = activeProject ? activeProject.name : initialProjectName;

  // Contextual short headings
  const getHeaderContent = () => {
    if (activeProjectName && enquiryType === "project") {
      return {
        heading: initialUnitType
          ? ar
            ? `استفسار عن ${initialUnitType} — ${activeProjectName}`
            : `Enquire About ${initialUnitType} — ${activeProjectName}`
          : ar
            ? `استفسار عن ${activeProjectName}`
            : `Enquire About ${activeProjectName}`,
        submitLabel: ar ? "اطلب اتصالاً" : "Request a Call Back",
      };
    }

    if (enquiryType === "visit") {
      return {
        heading: ar ? "طلب حجز موعد زيارة" : "Schedule a Private Visit",
        submitLabel: ar ? "طلب حجز الزيارة" : "Confirm Visit Request",
      };
    }

    // Default: General Callback
    return {
      heading: ar ? "طلب معاودة الاتصال" : "Request a Call Back",
      submitLabel: ar ? "اطلب اتصالاً" : "Request a Call Back",
    };
  };

  const { heading, submitLabel } = getHeaderContent();
  const activeConsentError = clientConsentError || state.fields?.consent;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!consent) {
      e.preventDefault();
      setClientConsentError(
        ar
          ? "يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة."
          : "Please agree to the Terms & Conditions and Privacy Policy to proceed."
      );
      const cb = document.getElementById("enquiry-consent");
      cb?.focus();
      return;
    }
    setClientConsentError(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={`enquiry-modal-backdrop ${isClosing ? "is-closing" : ""}`}
      role="presentation"
      onClick={handleBackdropClick}
      data-lenis-prevent="true"
    >
      <div
        ref={dialogRef}
        className="enquiry-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        dir={copy.dir}
      >
        {/* Modal Header — One short heading around 24px and close button */}
        <div className="enquiry-modal-header">
          <div className="enquiry-header-text">
            <h2 id={titleId} className="enquiry-title">
              {heading}
            </h2>
          </div>
          <button
            type="button"
            className="enquiry-close-button"
            onClick={onClose}
            aria-label={ar ? "إغلاق النموذج" : "Close enquiry dialog"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Success Confirmation View */}
        {state.status === "success" ? (
          <div className="enquiry-success-view">
            <div className="enquiry-success-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="enquiry-success-title">
              {ar ? "تم استلام طلبك بنجاح" : "Request Successfully Received"}
            </h3>
            <p className="enquiry-success-desc">{state.message}</p>
            {activeProjectName && (
              <div className="enquiry-success-project-badge">
                <span>{ar ? "المشروع المطلوب:" : "Requested Project:"}</span>
                <strong>{activeProjectName}</strong>
              </div>
            )}
            <button
              type="button"
              className="enquiry-submit-button"
              onClick={onClose}
              style={{ marginTop: "18px" }}
            >
              {ar ? "تم وإغلاق النافذة" : "Done & Close"}
            </button>
          </div>
        ) : (
          /* Main Single-Column Form View */
          <form
            id="enquiry-modal-form"
            ref={formRef}
            action={formAction}
            onSubmit={handleSubmit}
            noValidate
            className="enquiry-form-element"
          >
            <div className="enquiry-modal-body">
              {/* Server Error Banner */}
              {state.status === "error" && state.message && (
                <div className="enquiry-status-banner error" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{state.message}</span>
                </div>
              )}

              {/* Hidden Metadata Inputs */}
              <input type="hidden" name="locale" value={copy.locale} />
              <input type="hidden" name="enquiryType" value={enquiryType} />
              <input type="hidden" name="sourcePage" value={sourcePage} />
              <input type="hidden" name="sourceCta" value={sourceCta} />
              <input type="hidden" name="unitType" value={initialUnitType} />

              {/* Zero-overflow Anti-spam Honeypot */}
              <input
                className="contact-honeypot"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* 1. Full Name — Required */}
              <div className="enquiry-form-group">
                <label htmlFor="enquiry-name" className="enquiry-label">
                  <span>{ar ? "الاسم بالكامل" : "Full Name"}</span>
                  <span className="enquiry-required-star" aria-hidden="true">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="enquiry-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={state.values?.name ?? ""}
                  placeholder={ar ? "مثال: أحمد محمد" : "e.g. John Doe"}
                  aria-invalid={!!state.fields?.name}
                  autoComplete="name"
                  className={`enquiry-input ${state.fields?.name ? "has-error" : ""}`}
                />
                {state.fields?.name && (
                  <span className="enquiry-field-error" role="alert">
                    {state.fields.name}
                  </span>
                )}
              </div>

              {/* 2. Phone Number & Country Code — Required */}
              <div className="enquiry-form-group">
                <label htmlFor="enquiry-phone" className="enquiry-label">
                  <span>{ar ? "رقم الهاتف والاتصال" : "Phone & Country Code"}</span>
                  <span className="enquiry-required-star" aria-hidden="true">*</span>
                </label>
                <div
                  className={`enquiry-phone-control ${
                    state.fields?.phone || state.fields?.countryCode ? "has-error" : ""
                  }`}
                >
                  <div className="enquiry-country-select-wrap">
                    <select
                      id="enquiry-country"
                      name="countryCode"
                      defaultValue={state.values?.countryCode || "EG:+20"}
                      required
                      aria-label={ar ? "رمز الدولة" : "Country calling code"}
                      className="enquiry-select-country"
                    >
                      {countries.map((c) => (
                        <option value={`${c.country}:${c.code}`} key={c.country}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <svg
                      className="enquiry-country-chevron"
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
                  <div className="enquiry-phone-divider" aria-hidden="true" />
                  <input
                    id="enquiry-phone"
                    name="phone"
                    type="tel"
                    required
                    dir="ltr"
                    defaultValue={state.values?.phone ?? ""}
                    placeholder={ar ? "010 0000 0000" : "10 0000 0000"}
                    aria-invalid={!!state.fields?.phone}
                    autoComplete="tel-national"
                    className="enquiry-input-phone"
                  />
                </div>
                {(state.fields?.phone || state.fields?.countryCode) && (
                  <span className="enquiry-field-error" role="alert">
                    {state.fields?.phone || state.fields?.countryCode}
                  </span>
                )}
              </div>

              {/* 3. Email Address — Optional */}
              <div className="enquiry-form-group">
                <label htmlFor="enquiry-email" className="enquiry-label">
                  <span>{ar ? "البريد الإلكتروني" : "Email Address"}</span>
                  <span className="enquiry-optional-tag">
                    {ar ? "(اختياري)" : "(optional)"}
                  </span>
                </label>
                <input
                  id="enquiry-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  defaultValue={state.values?.email ?? ""}
                  placeholder="name@example.com"
                  aria-invalid={!!state.fields?.email}
                  autoComplete="email"
                  className={`enquiry-input ${state.fields?.email ? "has-error" : ""}`}
                />
                {state.fields?.email && (
                  <span className="enquiry-field-error" role="alert">
                    {state.fields.email}
                  </span>
                )}
              </div>

              {/* 4. Interested Project — Dropdown or Preselected Pill */}
              <div className="enquiry-form-group">
                <div className="enquiry-label-row">
                  <label htmlFor="enquiry-project" className="enquiry-label">
                    <span>{ar ? "المشروع المطلوب" : "Interested Project"}</span>
                    <span className="enquiry-optional-tag">
                      {ar ? "(اختياري)" : "(optional)"}
                    </span>
                  </label>
                  {activeProjectName && !showProjectPicker && (
                    <button
                      type="button"
                      className="enquiry-change-project-btn"
                      onClick={() => setShowProjectPicker(true)}
                    >
                      {ar ? "تغيير المشروع" : "Change"}
                    </button>
                  )}
                </div>

                {activeProjectName && !showProjectPicker ? (
                  <div className="enquiry-selected-project-pill">
                    <span className="enquiry-pill-icon" aria-hidden="true">📍</span>
                    <strong className="enquiry-pill-name">{activeProjectName}</strong>
                    {initialUnitType && (
                      <span className="enquiry-pill-unit" style={{ opacity: 0.8, fontSize: "12px", marginInlineStart: "8px", borderInlineStart: "1px solid rgba(182,111,82,0.3)", paddingInlineStart: "8px" }}>
                        {initialUnitType}
                      </span>
                    )}
                    <input type="hidden" name="projectId" value={selectedProjectId} />
                  </div>
                ) : (
                  <div className="enquiry-select-wrap">
                    <select
                      id="enquiry-project"
                      name="projectId"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      aria-invalid={!!state.fields?.projectId}
                      className={`enquiry-select ${state.fields?.projectId ? "has-error" : ""}`}
                    >
                      <option value="">
                        {ar ? "كافة المشاريع / استفسار عام" : "All Projects / General Portfolio"}
                      </option>
                      {copy.inquiryProjects.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="enquiry-select-chevron"
                      width="13"
                      height="13"
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
                )}
                {state.fields?.projectId && (
                  <span className="enquiry-field-error" role="alert">
                    {state.fields.projectId}
                  </span>
                )}
              </div>

              {/* 5. Terms & Conditions and Privacy Policy Acknowledgement Checkbox */}
              <div className="enquiry-form-group enquiry-consent-group">
                <div className="enquiry-consent-item">
                  <input
                    type="checkbox"
                    id="enquiry-consent"
                    name="consent"
                    checked={consent}
                    onChange={(e) => {
                      setConsentOverride(e.target.checked);
                      if (e.target.checked) setClientConsentError(null);
                    }}
                    aria-invalid={!consent && !!activeConsentError}
                    aria-describedby={activeConsentError ? "enquiry-consent-error" : undefined}
                    className={`enquiry-checkbox ${!consent && activeConsentError ? "has-error" : ""}`}
                  />
                  <label htmlFor="enquiry-consent" className="enquiry-consent-label">
                    {ar ? (
                      <span>
                        أوافق على{" "}
                        <Link
                          href={`/${copy.locale}/terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="enquiry-legal-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          الشروط والأحكام
                        </Link>{" "}
                        و{" "}
                        <Link
                          href={`/${copy.locale}/policy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="enquiry-legal-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          سياسة الخصوصية
                        </Link>{" "}
                        لشركة إيمدج.
                      </span>
                    ) : (
                      <span>
                        I agree to the{" "}
                        <Link
                          href={`/${copy.locale}/terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="enquiry-legal-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                          href={`/${copy.locale}/policy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="enquiry-legal-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </Link>.
                      </span>
                    )}
                  </label>
                </div>
                {activeConsentError && (
                  <span id="enquiry-consent-error" className="enquiry-field-error" role="alert">
                    {activeConsentError}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer: Full-Width Submit Button + Direct Hotline 17087 Alternative */}
            <div className="enquiry-modal-footer">
              <button
                type="submit"
                id="enquiry-modal-submit-btn"
                className="enquiry-submit-button enquiry-modal-submit"
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? (
                  <>
                    <span className="admin-spinner" aria-hidden="true" />
                    <span>{ar ? "جارٍ إرسال الطلب…" : "Submitting Request…"}</span>
                  </>
                ) : (
                  <>
                    <span>{submitLabel}</span>
                    <span aria-hidden="true" style={{ fontSize: "16px" }}>
                      {ar ? "←" : "→"}
                    </span>
                  </>
                )}
              </button>

              {/* Direct Hotline 17087 Alternative */}
              <div className="enquiry-hotline-alternative">
                <span className="enquiry-hotline-label">
                  {ar ? "أو اتصل مباشرة:" : "Or call directly:"}
                </span>
                <a href="tel:17087" className="enquiry-hotline-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>17087</span>
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export function EnquiryModal({
  isOpen,
  onClose,
  ...rest
}: EnquiryModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <EnquiryModalContent
      {...rest}
      isOpen={isOpen}
      isClosing={isClosing}
      onClose={handleClose}
    />
  );
}
