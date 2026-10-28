# Flexible Section Layout Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four editorial flexible-section templates, expose all eight templates everywhere in the CMS, and preserve the existing section schema and legacy layout output.

**Architecture:** Introduce one framework-independent typed registry that owns layout IDs and CMS metadata. Normalize database strings at the content boundary, preserve the existing renderer branch verbatim for the four legacy layouts, and render the four new layouts through dedicated branches using the same `PageSectionContent` object.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Prisma 6, Vitest 5, global CSS.

---

## File Structure

- Create `src/lib/page-section-layouts.ts`: registry, type guard, normalization, CMS metadata, immutable layout-only update helper.
- Create `src/lib/page-section-layouts.test.ts`: registry, fallback, and content-preservation tests.
- Create `src/components/page-sections.test.tsx`: renderer regression and new-template markup tests.
- Modify `src/content/home.ts`: use the registry-derived `PageSectionLayout` type.
- Modify `src/lib/content.ts`: normalize database layout strings at both mapping sites.
- Modify `src/components/admin/page-sections-editor.tsx`: render registry-backed options and guidance.
- Modify `src/app/admin/actions.ts`: validate layouts through the registry.
- Modify `src/components/page-sections.tsx`: preserve the legacy branch and add four new branches.
- Modify `src/app/page-sections.css`: append isolated new-template styles and responsive/RTL rules without changing legacy selectors.

### Task 1: Typed layout registry and safe normalization

**Files:**
- Create: `src/lib/page-section-layouts.test.ts`
- Create: `src/lib/page-section-layouts.ts`
- Modify: `src/content/home.ts`

- [ ] **Step 1: Write failing registry tests**

Test that the registry exposes the eight approved IDs in order, recognizes all registered IDs, normalizes unknown strings to `TEXT`, and changes only `layout` when applying a CMS layout change.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test -- src/lib/page-section-layouts.test.ts`

Expected: FAIL because `page-section-layouts.ts` does not exist.

- [ ] **Step 3: Implement the registry**

Define `PAGE_SECTION_LAYOUTS` with `id`, `label`, `description`, and `imageGuidance`; derive `PageSectionLayout`; add `isPageSectionLayout`, `normalizePageSectionLayout`, and generic `withPageSectionLayout(item, layout)` returning `{...item, layout}`.

- [ ] **Step 4: Use the derived type in content**

Replace the inline four-value layout union in `PageSectionContent` with imported `PageSectionLayout`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `pnpm test -- src/lib/page-section-layouts.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/page-section-layouts.ts src/lib/page-section-layouts.test.ts src/content/home.ts
git commit -m "feat: add page section layout registry"
```

### Task 2: Registry-backed content mapping, validation, and CMS

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/app/admin/actions.ts`
- Modify: `src/components/admin/page-sections-editor.tsx`

- [ ] **Step 1: Add failing expectations for CMS metadata and immutable updates**

Extend the registry test to assert every entry has non-empty guidance and that `withPageSectionLayout` preserves all non-layout fields by deep equality.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm test -- src/lib/page-section-layouts.test.ts`

Expected: FAIL until complete metadata and immutable update behavior exist.

- [ ] **Step 3: Normalize content at both database mapping sites**

Import `normalizePageSectionLayout` into `src/lib/content.ts` and replace both type assertions with `layout: normalizePageSectionLayout(section.layout)`.

- [ ] **Step 4: Replace duplicated server validation**

Import `isPageSectionLayout` into `src/app/admin/actions.ts`, remove the local layout set, validate with the guard, and keep the saved `layout` field as the selected registered ID.

- [ ] **Step 5: Make the CMS selector registry-driven**

Type `EditablePageSection.layout` as `PageSectionLayout`, use `withPageSectionLayout` in the selection handler, map `PAGE_SECTION_LAYOUTS` to `<option>` elements, and show the selected entry's description plus image guidance. Do not alter any other update path or serialized field.

- [ ] **Step 6: Run tests and type checking**

Run: `pnpm test -- src/lib/page-section-layouts.test.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/content.ts src/app/admin/actions.ts src/components/admin/page-sections-editor.tsx src/lib/page-section-layouts.test.ts
git commit -m "feat: use shared section layouts in cms"
```

### Task 3: Preserve legacy rendering and add new renderer branches

**Files:**
- Create: `src/components/page-sections.test.tsx`
- Modify: `src/components/page-sections.tsx`

- [ ] **Step 1: Write failing renderer tests**

Mock `next/image` and `Reveal`, render with `react-dom/server`, and assert:

- `TEXT`, `IMAGE_LEFT`, `IMAGE_RIGHT`, and `FULL_IMAGE` retain their current section classes and media placement;
- each new ID produces its dedicated class while rendering the supplied number, eyebrow, heading, body paragraphs, image alt text, and safe CTA;
- missing images produce no image element for every new template;
- unsafe CTA values produce no anchor;
- an unknown runtime layout normalizes to legacy `TEXT` markup.

- [ ] **Step 2: Run the renderer test and verify RED**

Run: `pnpm test -- src/components/page-sections.test.tsx`

Expected: FAIL because the new renderer branches do not exist.

- [ ] **Step 3: Refactor common fragments without changing legacy output**

Extract internal image and copy builders whose returned legacy markup is byte-for-byte structurally equivalent to the current JSX. Keep the existing section class generation, `custom-section-grid`, media positions, numbering, `Reveal`, paragraph splitting, and CTA markup for the four legacy layouts.

- [ ] **Step 4: Add the four new branches**

Add dedicated markup for `EDITORIAL_PORTRAIT`, `OVERLAP_FEATURE`, `MAGAZINE_FEATURE`, and `IMMERSIVE_BANNER`. Each branch consumes only `PageSectionContent`, omits absent optional fields, and avoids empty media containers.

- [ ] **Step 5: Normalize defensively inside the renderer**

Call `normalizePageSectionLayout` before branch selection so manually constructed or stale runtime values fall back to `TEXT` even if they bypass the content mapper.

- [ ] **Step 6: Run renderer and registry tests**

Run: `pnpm test -- src/components/page-sections.test.tsx src/lib/page-section-layouts.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/page-sections.tsx src/components/page-sections.test.tsx
git commit -m "feat: render editorial page section layouts"
```

### Task 4: Responsive, RTL-safe template styling

**Files:**
- Modify: `src/app/page-sections.css`

- [ ] **Step 1: Establish renderer tests as the regression guard**

Run: `pnpm test -- src/components/page-sections.test.tsx`

Expected: PASS before styling; existing DOM/class assertions remain unchanged.

- [ ] **Step 2: Append isolated desktop styles**

Add selectors only for the four new layout classes and their new descendants. Reuse `--forest`, `--cream`, `--peach`, `--ink`, `--pad`, and `--image-radius`; do not edit existing legacy selectors.

- [ ] **Step 3: Add mobile and RTL rules**

At the existing `800px` breakpoint, stack every new template, return overlaps to document flow, constrain media heights, and keep readable fluid headings. Use logical properties and `.arabic` overrides for Kufi line height and zero letter spacing.

- [ ] **Step 4: Verify static checks**

Run: `pnpm typecheck && pnpm lint`

Expected: PASS with no warnings or errors caused by these changes.

- [ ] **Step 5: Commit**

```bash
git add src/app/page-sections.css
git commit -m "style: add responsive section templates"
```

### Task 5: Full verification and browser regression review

**Files:**
- Modify only if verification reveals an in-scope regression.

- [ ] **Step 1: Run the complete automated suite**

Run: `pnpm test`

Expected: all tests PASS.

- [ ] **Step 2: Run TypeScript and ESLint**

Run: `pnpm typecheck && pnpm lint`

Expected: both PASS.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: build completes successfully. If the active development server locks `.next`, report that exact environmental blocker and verify with a separate build directory only if supported by the current Next.js documentation/configuration.

- [ ] **Step 4: Browser-check CMS behavior**

Verify all eight choices appear for sections on each of the ten page tabs, changing a layout preserves the serialized values of every other field, and the descriptions/image guidance update correctly.

- [ ] **Step 5: Browser-check public rendering**

Use temporary local test data without committing database content. Verify the four new templates and four legacy templates at desktop, tablet, and mobile widths in English and Arabic. Confirm legacy DOM/class structure, CTA safety, image-less fallbacks, RTL alignment, no overflow, and no page-specific restrictions.

- [ ] **Step 6: Review the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors, no schema/migration changes, and only approved source, test, plan, and spec files changed. The `.superpowers/` visual-companion directory remains untracked and excluded from commits.
