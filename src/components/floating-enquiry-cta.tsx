"use client";

import React, { useEffect, useState } from "react";
import type { Locale } from "@/content/home";
import { useEnquiryModal } from "./enquiry-provider";

export function FloatingEnquiryCTA({ locale }: { locale: Locale }) {
  const { openEnquiry, isOpen } = useEnquiryModal();
  const [visible, setVisible] = useState(false);
  const ar = locale === "ar";

  useEffect(() => {
    const handleScroll = () => {
      // Reveal after user scrolls past opening hero
      setVisible(window.scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (isOpen || !visible) return null;

  return (
    <aside
      className="floating-enquiry-wrap"
      aria-label={ar ? "إجراء سريع للاستفسار" : "Quick enquiry action"}
    >
      <button
        type="button"
        className="floating-enquiry-btn"
        onClick={() =>
          openEnquiry({
            enquiryType: "general",
            sourceCta: "floating-action",
          })
        }
        aria-label={ar ? "تواصل معنا واستفسر الآن" : "Contact us & enquire now"}
      >
        <span className="floating-enquiry-icon" aria-hidden="true">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className="floating-enquiry-label">
          {ar ? "استفسر الآن" : "Enquire Now"}
        </span>
      </button>
    </aside>
  );
}
