"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/content/home";

export interface ProjectCardData {
  id: string;
  slug?: string;
  name: string;
  location: string;
  promise: string;
  image: string;
  alt?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  focalPoint?: string;
  projectType?: string;
  progressStatus?: string;
  featured?: boolean;
}

export interface ProjectShowcaseCardProps {
  project: ProjectCardData;
  index: number;
  locale: Locale;
  defaultCtaLabel?: string;
  onEnquire?: (projectId: string, projectName: string) => void;
}

export function ProjectShowcaseCard({
  project,
  index,
  locale,
  defaultCtaLabel,
}: ProjectShowcaseCardProps) {
  const ar = locale === "ar";
  const reduce = useReducedMotion();
  const isEven = index % 2 === 0;
  const layoutClass = isEven ? "project-showcase-card--text-photo" : "project-showcase-card--photo-text";

  const detailHref = project.ctaUrl && !project.ctaUrl.startsWith("#")
    ? project.ctaUrl
    : `/${locale}/projects/${project.slug || project.id}`;

  const ctaText = project.ctaLabel || defaultCtaLabel || (ar ? "عرض المشروع" : "View Project");

  const typeLabels: Record<string, { en: string; ar: string }> = {
    residential: { en: "Residential", ar: "سكني" },
    commercial: { en: "Commercial", ar: "تجاري" },
    medical: { en: "Medical", ar: "طبي" },
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    ongoing: { en: "Ongoing", ar: "قيد التنفيذ" },
    delivered: { en: "Delivered", ar: "تم التسليم" },
    upcoming: { en: "Upcoming", ar: "قريباً" },
  };

  const typeKey = (project.projectType || "Residential").toLowerCase();
  const statusKey = (project.progressStatus || "Ongoing").toLowerCase();
  const localizedType = typeLabels[typeKey]?.[ar ? "ar" : "en"] || project.projectType || (ar ? "سكني" : "Residential");
  const localizedStatus = statusLabels[statusKey]?.[ar ? "ar" : "en"] || project.progressStatus || (ar ? "قيد التنفيذ" : "Ongoing");

  return (
    <motion.article
      id={`project-${project.slug || project.id}`}
      className={`project-showcase-card ${layoutClass}`}
      initial={!reduce ? { opacity: 0, y: 22 } : false}
      whileInView={!reduce ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay: (index % 2) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Text Panel (45% on desktop) */}
      <div className="project-showcase-text" dir={ar ? "rtl" : "ltr"}>
        {/* 1. Quiet Location Label */}
        {project.location && (
          <span className="project-card-location">
            {project.location}
          </span>
        )}

        {/* 2. Project Name as H3 */}
        <div className="project-main-info">
          <h3 className="project-card-title">
            <Link
              href={detailHref}
              className="project-title-link"
              aria-label={`${ar ? "عرض تفاصيل مشروع" : "View details of"} ${project.name}`}
            >
              {project.name}
            </Link>
          </h3>

          {/* 3. Short, project-specific description from CMS */}
          <p className="project-card-desc">{project.promise}</p>
        </div>

        {/* 4. Type & Status as Secondary Metadata */}
        <div className="project-secondary-meta">
          {localizedType && <span className="meta-type">{localizedType}</span>}
          {localizedType && localizedStatus && (
            <span className="meta-sep" aria-hidden="true">•</span>
          )}
          {localizedStatus && (
            <span className={`meta-status status-${statusKey}`}>
              <span className="status-dot" aria-hidden="true" />
              {localizedStatus}
            </span>
          )}
        </div>

        {/* 5. One Clear View Project Action */}
        <div className="project-card-actions">
          <Link
            href={detailHref}
            className="btn-project-primary"
            aria-label={`${ctaText}: ${project.name}`}
          >
            <span>{ctaText}</span>
            <b aria-hidden="true">{ar ? "←" : "→"}</b>
          </Link>
        </div>
      </div>

      {/* Photo Panel (55% on desktop) */}
      <div className="project-showcase-photo">
        <Link
          href={detailHref}
          className="project-photo-link"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={project.image}
            alt={project.alt || `${project.name}, ${project.location}`}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            priority={index < 2}
            quality={88}
            style={{
              objectFit: "cover",
              objectPosition: project.focalPoint || "center",
            }}
          />
          <div className="project-showcase-photo-overlay" />
        </Link>
      </div>
    </motion.article>
  );
}
