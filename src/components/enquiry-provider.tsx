"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { HomeContent } from "@/content/home";
import { EnquiryModal } from "./enquiry-modal";

export type EnquiryType = "project" | "general" | "callback" | "visit";

export interface EnquiryOpenOptions {
  projectId?: string;
  projectName?: string;
  enquiryType?: EnquiryType;
  sourcePage?: string;
  sourceCta?: string;
  unitType?: string;
}

interface EnquiryContextValue {
  isOpen: boolean;
  openEnquiry: (options?: EnquiryOpenOptions) => void;
  closeEnquiry: () => void;
  config: EnquiryOpenOptions;
}

const defaultEnquiryContextValue: EnquiryContextValue = {
  isOpen: false,
  openEnquiry: () => {},
  closeEnquiry: () => {},
  config: { enquiryType: "general" },
};

const EnquiryContext = createContext<EnquiryContextValue | null>(null);

export function useEnquiryModal() {
  const context = useContext(EnquiryContext);
  return context || defaultEnquiryContextValue;
}

export function EnquiryProvider({
  children,
  copy,
}: {
  children: React.ReactNode;
  copy: HomeContent;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<EnquiryOpenOptions>({
    enquiryType: "general",
  });

  const openEnquiry = useCallback((options?: EnquiryOpenOptions) => {
    setConfig({
      projectId: options?.projectId || "",
      projectName: options?.projectName || "",
      enquiryType: options?.enquiryType || (options?.projectId ? "project" : "general"),
      sourcePage: options?.sourcePage || (typeof window !== "undefined" ? window.location.pathname : ""),
      sourceCta: options?.sourceCta || "direct",
      unitType: options?.unitType || "",
    });
    setIsOpen(true);
  }, []);

  const closeEnquiry = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Global document listener for any [data-enquiry-trigger] or href="#enquire"
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-enquiry-trigger], a[href="#enquire"], a[href="#contact-modal"], button[data-enquiry]'
      );
      if (!target) return;

      e.preventDefault();
      const projectId = target.getAttribute("data-project-id") || undefined;
      const projectName = target.getAttribute("data-project-name") || undefined;
      const rawType = target.getAttribute("data-enquiry-type");
      const unitType = target.getAttribute("data-unit-type") || undefined;
      const enquiryType = (rawType as EnquiryType) || (projectId ? "project" : "general");
      const sourceCta = target.getAttribute("data-source-cta") || target.innerText?.trim() || "link";

      openEnquiry({
        projectId,
        projectName,
        enquiryType,
        sourceCta,
        unitType,
        sourcePage: window.location.pathname,
      });
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [openEnquiry]);

  return (
    <EnquiryContext.Provider value={{ isOpen, openEnquiry, closeEnquiry, config }}>
      {children}
      <EnquiryModal
        isOpen={isOpen}
        onClose={closeEnquiry}
        copy={copy}
        initialProjectId={config.projectId}
        initialProjectName={config.projectName}
        initialUnitType={config.unitType}
        enquiryType={config.enquiryType}
        sourceCta={config.sourceCta}
        sourcePage={config.sourcePage}
      />
    </EnquiryContext.Provider>
  );
}

/**
 * Reusable CTA button that opens the enquiry modal with specific context.
 */
export function EnquiryCTAButton({
  children,
  className = "",
  projectId,
  projectName,
  unitType,
  enquiryType = "general",
  sourceCta,
  style,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  projectId?: string;
  projectName?: string;
  unitType?: string;
  enquiryType?: EnquiryType;
  sourceCta?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const { openEnquiry } = useEnquiryModal();

  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={ariaLabel}
      onClick={() =>
        openEnquiry({
          projectId,
          projectName,
          unitType,
          enquiryType,
          sourceCta: sourceCta || (typeof children === "string" ? children : "cta-button"),
        })
      }
    >
      {children}
    </button>
  );
}
