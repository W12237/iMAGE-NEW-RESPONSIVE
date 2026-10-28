# Handoff — Image Developments site (branch `reo/page-builder`)

Built on `main` @ a6b8719 (last commit by the previous developer). Two new commits:

1. **Page builder** — every public page is an ordered list of blocks in `PageSection`
   (`kind` = `CUSTOM` or a built-in key). CMS → *Page builder* can add, remove, hide and
   reorder built-in and custom sections anywhere on the page.
   Registry: `src/lib/page-blocks.ts` · renderer: `src/components/page-blocks.tsx` ·
   validation: `src/lib/page-blocks-input.ts`.
2. **Per-section style** — `PageSection.settings` (JSON): heading size desktop/mobile, body
   size, label size, and label text override for the projects section. Applied through CSS
   variables on a `display:contents` wrapper (`.pb-block` in `globals.css`).
   Logic: `src/lib/block-settings.ts`. The old Typography screen is now "Global font defaults".

## Run
- macOS: double-click `RUN_PROJECT_MAC.command` · Windows: `RUN_PROJECT.bat`
- Manual: `npm install && npm run db:generate && npx prisma migrate deploy && npm run dev`
- Site `http://localhost:3000` · CMS `/admin` (login in `.env`: ADMIN_EMAIL / ADMIN_PASSWORD)

## Database notes
- `prisma/dev.db` in this zip is Reo's current local database (content + all 18 migrations
  applied cleanly). The copy committed on `main` has a broken migration history
  (`20261014230000_terms_contact_pages` marked failed; two migrations applied but unrecorded),
  which makes `migrate deploy` fail with P3009 on fresh clones.
- Recommended: stop committing `dev.db` and `.env`; give each environment its own database.

## Checks
`npm test` (DB-backed `team-partners.test.ts` needs a working Prisma engine), `npm run typecheck`,
`npm run lint` (3 pre-existing errors in `partners-editor.tsx`), `npm run build` — all pass otherwise.

## Open items for review before production
- `npm audit`: 10 high-severity advisories.
- Admin password in `.env` is a weak local default; production needs its own credentials.
