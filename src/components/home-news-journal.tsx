"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { HomeContent, HomeJournalArticle } from "@/content/home";

function CardImage({
  src,
  alt,
  focalPoint = "center",
}: {
  src?: string;
  alt?: string;
  focalPoint?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="home-journal-fallback-frame" aria-hidden="true">
        <span className="home-journal-fallback-brand">IMAGE DEVELOPMENTS</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Image Developments article"}
      fill
      loading="lazy"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
      style={{
        objectFit: "cover",
        objectPosition: focalPoint,
      }}
      className="home-journal-card-img"
      onError={() => setFailed(true)}
    />
  );
}

export function HomeNewsJournal({ copy }: { copy: HomeContent }) {
  const reduce = useReducedMotion();
  const ar = copy.locale === "ar";
  const section = copy.newsJournalSection;

  if (!section || section.enabled === false) return null;

  const articles: HomeJournalArticle[] = section.articles || [];
  if (articles.length === 0) return null;

  const resolvedCtaUrl = section.ctaUrl.startsWith(`/${copy.locale}`)
    ? section.ctaUrl
    : section.ctaUrl.startsWith("http") || section.ctaUrl.startsWith("#")
      ? section.ctaUrl
      : `/${copy.locale}${section.ctaUrl.startsWith("/") ? section.ctaUrl : `/${section.ctaUrl}`}`;

  const countClass =
    articles.length === 1
      ? "is-single"
      : articles.length === 2
        ? "is-pair"
        : "is-trio";

  const revealMotion = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: {
      duration: 0.6,
      delay: reduce ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      id="journal"
      className="home-news-journal stage-pad"
      style={{
        backgroundColor: `rgb(${copy.backgrounds?.stats || copy.backgrounds?.journal || "255, 255, 255"})`,
      }}
      aria-label={section.heading}
      dir={copy.dir}
    >
      <div className="home-news-journal-container">
        {/* Section Header: Eyebrow, Heading, Intro, and View All CTA */}
        <motion.div
          className="home-journal-header"
          {...revealMotion(0)}
        >
          <div className="home-journal-header-text">
            {section.label && (
              <span className="home-journal-eyebrow">
                {section.label}
              </span>
            )}
            <h2 className="home-journal-heading">
              {section.heading}
            </h2>
            {section.description && (
              <p className="home-journal-intro">
                {section.description}
              </p>
            )}
          </div>

          {section.ctaLabel && (
            <div className="home-journal-header-cta-wrap">
              <Link
                href={resolvedCtaUrl}
                className="home-journal-view-all-btn"
                aria-label={section.ctaLabel}
              >
                <span>{section.ctaLabel}</span>
                <span className="home-journal-btn-arrow" aria-hidden="true">
                  {ar ? "←" : "→"}
                </span>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Balanced Grid of Article Photo Cards (1, 2, or 3 columns) */}
        <div className={`home-journal-grid ${countClass}`} role="list">
          {articles.map((article, index) => (
            <motion.article
              key={article.id}
              className="home-journal-card"
              role="listitem"
              {...revealMotion(0.08 * (index + 1))}
            >
              {/* Media Container with reserved ratio to prevent CLS */}
              <Link
                href={article.href}
                className="home-journal-card-media-link"
                tabIndex={-1}
                aria-hidden="true"
              >
                <div className="home-journal-card-media-frame">
                  <CardImage
                    src={article.coverImageUrl}
                    alt={article.coverImageAlt}
                    focalPoint={article.focalPoint}
                  />
                </div>
              </Link>

              {/* Card Body */}
              <div className="home-journal-card-content">
                <div className="home-journal-card-meta">
                  {article.categoryLabel && (
                    <span className="home-journal-card-category">
                      {article.categoryLabel}
                    </span>
                  )}
                  {article.categoryLabel && (
                    <span className="home-journal-card-dot" aria-hidden="true">
                      •
                    </span>
                  )}
                  <time
                    className="home-journal-card-date"
                    dateTime={article.rawDate}
                  >
                    {article.publicationDate}
                  </time>
                </div>

                <h3 className="home-journal-card-title">
                  <Link href={article.href}>
                    {article.title}
                  </Link>
                </h3>

                {article.excerpt && (
                  <p className="home-journal-card-excerpt">
                    {article.excerpt}
                  </p>
                )}

                <div className="home-journal-card-footer">
                  <Link
                    href={article.href}
                    className="home-journal-read-link"
                    aria-label={`${ar ? "اقرأ المقال:" : "Read Article:"} ${article.title}`}
                  >
                    <span className="home-journal-read-text">
                      {ar ? "اقرأ المقال" : "Read Article"}
                    </span>
                    <span
                      className="home-journal-read-arrow"
                      aria-hidden="true"
                    >
                      {ar ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
