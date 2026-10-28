import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { content } from "@/content/home";
import { GlobalContactForm } from "./contact-form";
import { submitContact } from "@/app/actions";

describe("GlobalContactForm", () => {
  const enCopy = content.en;
  const arCopy = content.ar;

  it("renders balanced two-column composition with information card and callback form without message field", () => {
    const html = renderToStaticMarkup(<GlobalContactForm copy={enCopy} />);

    // Section and container alignment
    expect(html).toContain('id="contact"');
    expect(html).toContain("global-contact-container");
    expect(html).toContain("global-contact-info-card");
    expect(html).toContain("contact-form-wrap");

    // Information card typography & hotline action
    expect(html).toContain("LET’S TALK");
    expect(html).toContain("Find your next place.");
    expect(html).toContain("Tell us which project interests you, and our team will help you explore the details.");
    expect(html).toContain('href="tel:17087"');
    expect(html).toContain("Call 17087");
    expect(html).toContain("17087");

    // Form card header
    expect(html).toContain("Request a Call Back");

    // Form legend
    expect(html).toContain("Indicates required field");

    // Required and optional fields
    expect(html).toContain("Full Name");
    expect(html).toContain('name="name"');
    expect(html).toContain("Email Address");
    expect(html).toContain("(Optional)");
    expect(html).toContain('name="email"');
    expect(html).toContain("Phone Number");
    expect(html).toContain('name="phone"');
    expect(html).toContain('name="countryCode"');
    expect(html).toContain("contact-phone-composite");
    expect(html).toContain("Interested Project");
    expect(html).toContain('name="projectId"');
    expect(html).toContain("All Projects / General Portfolio");

    // Published CMS projects in dropdown
    expect(html).toContain("Aera");
    expect(html).toContain("Solaya");
    expect(html).toContain("Marea");

    // MESSAGE FIELD MUST BE REMOVED FROM THIS CALLBACK FORM
    expect(html).not.toContain('name="message"');
    expect(html).not.toContain("Message or Enquiry Details");

    // Consent checkboxes
    expect(html).toContain('name="consent"');
    expect(html).toContain('name="marketingConsent"');
    expect(html).toContain("/en/policy");
    expect(html).toContain("Privacy Policy");

    // Submit button labeled "Request a Call Back"
    expect(html).toContain("Request a Call Back");
    expect(html).toContain("contact-submit-btn");
  });

  it("renders Arabic typography, RTL layout, and preserved LTR inputs in Arabic", () => {
    const html = renderToStaticMarkup(<GlobalContactForm copy={arCopy} />);

    // Information card in Arabic
    expect(html).toContain("لنتحدث");
    expect(html).toContain("اكتشف مكانك القادم");
    expect(html).toContain("أخبرنا بالمشروع الذي يهمك، وسيساعدك فريقنا في التعرف على التفاصيل.");
    expect(html).toContain('href="tel:17087"');
    expect(html).toContain("اتصل على 17087");

    // Arabic form heading & legend
    expect(html).toContain("طلب معاودة الاتصال");
    expect(html).toContain("الحقول المشار إليها مطلوبة");

    // Arabic labels
    expect(html).toContain("الاسم بالكامل");
    expect(html).toContain("البريد الإلكتروني");
    expect(html).toContain("رقم الهاتف");
    expect(html).toContain("المشروع المطلوب");
    expect(html).toContain("كافة المشاريع / استفسار عام");

    // Message field is removed from callback form in Arabic too
    expect(html).not.toContain('name="message"');

    // Phone and email have dir="ltr"
    expect(html).toContain('dir="ltr"');

    // Privacy link to Arabic policy
    expect(html).toContain("/ar/policy");
    expect(html).toContain("سياسة الخصوصية");

    // Submit button labeled "اطلب اتصالاً"
    expect(html).toContain("اطلب اتصالاً");
  });

  it("renders required message field when variant='contact' on dedicated contact page", () => {
    const html = renderToStaticMarkup(
      <GlobalContactForm copy={enCopy} variant="contact" />
    );

    // Dedicated contact page retains the message textarea
    expect(html).toContain('name="message"');
    expect(html).toContain("Message or Enquiry Details");
    expect(html).toContain("Send Enquiry");
  });
});

describe("submitContact Action Validation & Preservation", () => {
  it("submits callback enquiries successfully WITHOUT a message field", async () => {
    const formData = new FormData();
    formData.append("name", "Nour El-Din");
    formData.append("phone", "01055554444");
    formData.append("countryCode", "EG:+20");
    formData.append("formVariant", "callback");
    formData.append("enquiryType", "callback");
    formData.append("consent", "on");
    formData.append("locale", "en");
    formData.append("website", "");
    // message is deliberately omitted

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("success");
    expect(result.message).toContain("your enquiry has been received");
  });

  it("requires message on dedicated contact page variant", async () => {
    const formData = new FormData();
    formData.append("name", "Nour El-Din");
    formData.append("phone", "01055554444");
    formData.append("countryCode", "EG:+20");
    formData.append("formVariant", "contact");
    formData.append("consent", "on");
    formData.append("locale", "en");
    formData.append("website", "");
    // message is missing on dedicated contact page

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.message).toBe("Please enter a message.");
  });

  it("fails when required privacy consent is not checked and preserves values", async () => {
    const formData = new FormData();
    formData.append("name", "Ahmed Ali");
    formData.append("email", "ahmed@example.com");
    formData.append("phone", "01012345678");
    formData.append("countryCode", "EG:+20");
    formData.append("locale", "en");
    formData.append("website", "");
    // consent is omitted

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.consent).toBeDefined();
    // Preserves values on error
    expect(result.values?.name).toBe("Ahmed Ali");
    expect(result.values?.email).toBe("ahmed@example.com");
    expect(result.values?.phone).toBe("01012345678");
    expect(result.values?.countryCode).toBe("EG:+20");
  });

  it("fails when name is missing and preserves entered phone and country", async () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("phone", "01099887766");
    formData.append("countryCode", "AE:+971");
    formData.append("consent", "on");
    formData.append("locale", "ar");
    formData.append("website", "");

    const result = await submitContact({ status: "idle" }, formData);
    expect(result.status).toBe("error");
    expect(result.fields?.name).toBeDefined();
    expect(result.values?.phone).toBe("01099887766");
    expect(result.values?.countryCode).toBe("AE:+971");
  });
});
