import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { content } from "@/content/home";
import { EnquiryModal } from "./enquiry-modal";
import { submitContact } from "@/app/actions";

describe("EnquiryModal", () => {
  const enCopy = content.en;
  const arCopy = content.ar;

  it("renders closed modal as null", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={false}
        onClose={vi.fn()}
        copy={enCopy}
      />
    );
    expect(html).toBe("");
  });

  it("renders general callback enquiry modal with compact header and single-column form without message field", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        copy={enCopy}
        enquiryType="general"
      />
    );

    // Dialog semantics
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');

    // Compact Header content — short heading without unnecessary introductory text
    expect(html).toContain("Request a Call Back");
    expect(html).not.toContain("enquiry-description");

    // Single-column persistent labels
    expect(html).toContain("Full Name");
    expect(html).toContain("Phone &amp; Country Code");
    expect(html).toContain("Email Address");
    expect(html).toContain("Interested Project");

    // Message field strictly omitted from general callback popup per BRD
    expect(html).not.toContain("Message or Inquiries");
    expect(html).not.toContain("<textarea");

    // Form inputs and LTR settings
    expect(html).toContain('name="name"');
    expect(html).toContain('name="phone"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="countryCode"');
    expect(html).toContain('name="projectId"');

    // Honeypot spam protection
    expect(html).toContain('name="website"');
    expect(html).toContain('class="contact-honeypot"');

    // Terms & Privacy checkbox: checked by default, visible, editable, with separate localized links
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="consent"');
    expect(html).toContain('checked=""');
    expect(html).toContain("/en/terms");
    expect(html).toContain("Terms &amp; Conditions");
    expect(html).toContain("/en/policy");
    expect(html).toContain("Privacy Policy");

    // Prominent full-width submit button
    expect(html).toContain("enquiry-submit-button");
    expect(html).toContain("Request a Call Back");

    // Hotline 17087 small readable link beneath submit button
    expect(html).toContain("17087");
    expect(html).toContain("enquiry-hotline-alternative");
  });

  it("renders project-specific enquiry modal with preselected project badge", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        copy={enCopy}
        enquiryType="project"
        initialProjectId="aera"
        initialProjectName="Aera"
      />
    );

    // Contextual heading
    expect(html).toContain("Enquire About Aera");
    expect(html).not.toContain("enquiry-description");

    // Preselected project pill
    expect(html).toContain('class="enquiry-selected-project-pill"');
    expect(html).toContain("Aera");
    expect(html).toContain('value="aera"');
  });

  it("renders callback request mode with callback heading and action text", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        copy={enCopy}
        enquiryType="callback"
      />
    );

    expect(html).toContain("Request a Call Back");
  });

  it("renders private visit schedule mode", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        copy={enCopy}
        enquiryType="visit"
      />
    );

    expect(html).toContain("Schedule a Private Visit");
    expect(html).toContain("Confirm Visit Request");
  });

  it("renders localized Arabic mode with RTL dir and natural Arabic typography", () => {
    const html = renderToStaticMarkup(
      <EnquiryModal
        isOpen={true}
        onClose={vi.fn()}
        copy={arCopy}
        enquiryType="general"
      />
    );

    expect(html).toContain('dir="rtl"');
    expect(html).toContain("طلب معاودة الاتصال");
    expect(html).not.toContain("enquiry-description");
    expect(html).toContain("الاسم بالكامل");
    expect(html).toContain("رقم الهاتف والاتصال");
    expect(html).toContain("البريد الإلكتروني");
    expect(html).toContain("المشروع المطلوب");
    expect(html).not.toContain("<textarea");
    expect(html).toContain("اطلب اتصالاً");
    expect(html).toContain("17087");

    // Arabic Terms & Conditions and Privacy Policy separate links
    expect(html).toContain("/ar/terms");
    expect(html).toContain("الشروط والأحكام");
    expect(html).toContain("/ar/policy");
    expect(html).toContain("سياسة الخصوصية");
    expect(html).toContain('name="consent"');
    expect(html).toContain('checked=""');
  });
});

describe("Enquiry Form Submission & Validation", () => {
  it("fails when terms & privacy acknowledgement is unchecked and returns inline message", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("phone", "1012345678");
    formData.append("countryCode", "EG:+20");
    formData.append("locale", "en");
    formData.append("website", "");
    // consent is omitted (unchecked)

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.consent).toBe("Please agree to the Terms & Conditions and Privacy Policy to proceed.");
    // Visitor's unchecked selection is preserved
    expect(result.values?.consent).toBe(false);
    expect(result.values?.name).toBe("John Doe");
  });

  it("fails with Arabic inline message when terms & privacy is unchecked in Arabic", async () => {
    const formData = new FormData();
    formData.append("name", "أحمد محمد");
    formData.append("phone", "01012345678");
    formData.append("countryCode", "EG:+20");
    formData.append("locale", "ar");
    formData.append("website", "");
    // consent omitted

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.consent).toBe("يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة.");
    expect(result.values?.consent).toBe(false);
  });

  it("preserves consent=true when other validation error occurs", async () => {
    const formData = new FormData();
    formData.append("name", ""); // missing name
    formData.append("phone", "01012345678");
    formData.append("countryCode", "EG:+20");
    formData.append("consent", "on"); // checked
    formData.append("locale", "en");
    formData.append("website", "");

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.name).toBeDefined();
    expect(result.values?.consent).toBe(true);
  });
});
