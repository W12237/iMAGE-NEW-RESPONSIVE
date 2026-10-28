# Flexible Section Layout Expansion Design

## Objective

Expand the shared flexible-section system from four to eight presentation templates while preserving the existing `PageSection` database model and every section's existing content. All eight templates must be selectable for every flexible section on every public page rendered through `PageSections`.

## Compatibility Requirements

- Preserve the exact markup, CSS behavior, responsive behavior, and appearance of `TEXT`, `IMAGE_LEFT`, `IMAGE_RIGHT`, and `FULL_IMAGE`.
- Keep the Prisma `PageSection` model unchanged. No migration is required because `layout` is already stored as a string.
- Changing a template changes only the section's `layout` value. It must not reset or rewrite any other section property.
- Treat unknown or legacy layout strings as `TEXT` when reading/rendering content.
- Keep the existing safe CTA URL behavior.
- Support English, Arabic, RTL layout, optional content, long content, and missing images safely.

## Layout Catalog

The shared catalog contains these stable IDs and CMS labels:

1. `TEXT` — Text only
2. `IMAGE_LEFT` — Image left
3. `IMAGE_RIGHT` — Image right
4. `FULL_IMAGE` — Full-image background
5. `EDITORIAL_PORTRAIT` — Editorial Portrait
6. `OVERLAP_FEATURE` — Overlap Feature
7. `MAGAZINE_FEATURE` — Magazine Feature
8. `IMMERSIVE_BANNER` — Immersive Banner

Each catalog entry also provides a concise CMS description and an image recommendation. The first four entries retain their current behavior and appearance.

## Architecture

Create a framework-independent typed layout registry as the single source of truth for valid layout IDs, labels, descriptions, image recommendations, ordering, normalization, and type inference. The CMS selector, server-side save validation, content mapper, and frontend renderer consume this registry rather than declaring their own layout lists.

`PageSections` remains the shared renderer used by all public pages. Common responsibilities stay centralized: section iteration, numbering, safe CTA handling, localized content, background color, and reveal behavior. Layout-specific markup is selected from the normalized layout ID. Focused render helpers/components may be used to keep each template isolated, but no template receives a different content type.

## New Template Behavior

### Editorial Portrait

An asymmetric editorial composition with a tall, arched image and a restrained copy column. It is suited to brand stories, leadership, values, and place-making content. Without an image, the copy uses a balanced text-forward composition and does not reserve an empty media column.

### Overlap Feature

A wide image with a forest-colored content panel overlapping its lower edge. It is suited to featured projects, campaigns, and important story introductions. On narrow screens and when an image is absent, the overlap returns to normal document flow.

### Magazine Feature

A headline-led editorial grid followed by image and body content. It is suited to longer narratives, history, policy introductions, and journal-led pages. Without an image, the body expands into the available grid width.

### Immersive Banner

A cinematic medium-height banner with aligned overlay copy. It is deliberately shallower than `FULL_IMAGE` to work as a visual chapter divider or CTA. Without an image, it renders a forest/section-color text banner with sufficient contrast instead of a broken media area.

## CMS Behavior

The existing layout field remains a single-select control. It displays all eight templates in a stable order, with the four existing layouts followed by the four editorial additions. The selected template's description and image guidance appear next to the control.

Changing the selection updates only `layout` in the corresponding item state. The section object and every other controlled field remain unchanged. Saving continues to serialize the complete list through the existing `pageSections` form value.

No page-specific layout restrictions will be introduced. The same registry-backed selector is used for sections assigned to home, about, history, developments, journal, team, partners, policy, terms, and contact.

## Responsive and Bilingual Design

New templates reuse the established forest, cream, peach, white, and ink palette; `--pad`; `--image-radius`; Jost and Noto Kufi Arabic typography; existing CTA styling; and the shared reveal motion.

Desktop compositions preserve the site's asymmetric editorial identity. At the existing mobile breakpoint, each template becomes a deliberate single-column layout, overlapping content returns to document flow, media heights are bounded, headings remain fluid, and CTA targets remain usable. CSS uses logical alignment where direction matters, and Arabic-specific line height and letter-spacing rules remain consistent with the current site.

## Data Flow and Fallbacks

1. Prisma returns the stored layout string.
2. The content mapper normalizes it through the registry.
3. Recognized values pass through unchanged; unknown values normalize to `TEXT`.
4. `PageSections` receives the existing `PageSectionContent` fields with a typed normalized layout.
5. The renderer chooses exactly one template without altering content.

Optional eyebrow, body, CTA, and image elements are omitted cleanly. Long content expands the section vertically and is never clipped. Unsafe CTA URLs remain hidden under the existing rule.

## Testing and Verification

Implementation follows test-driven development. Automated coverage will verify:

- the registry contains exactly the eight approved IDs in the intended order;
- all eight IDs normalize to themselves and unknown values normalize to `TEXT`;
- server-side save validation accepts all registered IDs and rejects invalid IDs;
- switching layouts preserves every non-layout field in CMS state;
- all new renderers display the same supplied content;
- optional fields and missing images render safely;
- current layouts retain their existing output and class names;
- no public page adds a page-specific layout restriction;
- representative English and Arabic/RTL content remains renderable.

Final verification includes focused tests, the complete test suite, TypeScript checking, ESLint, and a production build. Browser checks cover desktop, tablet, and mobile widths for all four new templates and regression checks for the four existing templates.

## Out of Scope

- Database schema changes or migrations
- Template-specific content fields
- Per-page layout allowlists
- User-configurable template construction
- Changes to the dedicated non-flexible homepage sections
