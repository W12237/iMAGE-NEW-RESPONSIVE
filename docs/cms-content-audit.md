# CMS content audit

## Scope inspected

The implemented public site consists of `/en`, `/ar`, the fullscreen header/menu, six content sections after the hero, and a footer. Content originally came from `src/content/home.ts`, direct literals in `src/app/[locale]/page.tsx`, `src/components/site-header.tsx`, and `src/app/layout.tsx`. No public project detail or news index/detail pages currently exist.

## Inventory and ownership

| Existing area | Content found | Original source | CMS model | Frontend remains responsible for |
|---|---|---|---|---|
| Header/menu | EN/AR menu labels and anchors; language/contact labels; menu image/alt; email; address | static module and component literals | `NavigationItem`, `GlobalSettings` | overlay composition, focus behavior, animation, numbering |
| Hero | eyebrow, multiline title, note, discover label, image/alt | static module, media constants, literal alt | `Homepage` | full-height composition, image treatment, motion |
| Story | eyebrow, heading, body, image/alt, supporting link | static module and literals | `Homepage` | section number, grid, typography, reveal |
| Featured projects | heading/explore label; names, locations, promises, images | static arrays | `Homepage`, `Project` | sticky choreography and mobile card design |
| Lifestyle | eyebrow, heading, image/alt | static module and literals | `Homepage` | full-bleed visual treatment |
| Statistics | heading; values and labels | page literal and static module | `Homepage`, `Stat` | row layout and section number |
| Journal preview | eyebrow, heading; dates, titles, images/alts | static module | `Homepage`, `NewsArticle` | lead/list composition; no new public pages |
| Closing CTA | eyebrow, heading, CTA label/URL | static module and hardcoded email | `Homepage` | circular CTA presentation |
| Footer | nav, note, email, phone, copyright, socials | mixed static and literals | `NavigationItem`, `GlobalSettings`, `Homepage` | brand and column composition |
| SEO | default English title/description | root layout | `GlobalSettings` EN/AR | Next.js metadata rendering |

## Architecture decisions

Semantic content uses explicit `En` and `Ar` columns in a zero-setup local SQLite database. Admin fields are paired, with RTL Arabic inputs. The validated `sectionOrder` contains only `story`, `projects`, `lifestyle`, `stats`, `journal`, and `closing`; hero and footer remain fixed. This is deliberately not a page builder.

Every public media reference and alt text is modeled. Local uploads are MIME/size validated and tracked in `MediaAsset`. URLs keep a future S3/Cloudinary migration independent of the content model. Physical files are not automatically deleted, preventing removal while a URL may still be associated.

## Intentionally frontend-controlled

CSS variables, spacing, grids, breakpoints, typography, colors, image crops, responsive/RTL behavior, section numbers, animation durations/easing, reveal/sticky behavior, and menu transitions remain in the frontend. The featured-project renderer reads at most three records because the current scroll choreography has three timing stages.

## Content still requiring source-code changes

- Brand mark artwork and generic admin interface labels.
- The locale set (`en`, `ar`) and allowed homepage section types.
- Visual section numbers (`01`–`04`), which are presentation devices.
- Raising the current three-project animation limit; selection, content, visibility, and order are CMS-managed.
- Adding a new public page type or additional social-network types.
