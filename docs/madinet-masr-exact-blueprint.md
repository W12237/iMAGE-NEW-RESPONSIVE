# Madinet Masr homepage — exact experience blueprint

Audited live on 8 October 2026 at `1440 × 900` and `390 × 844`. Measurements are approximate and describe observable behavior, not source implementation.

## 01 — white media-strip loader

**REFERENCE STRUCTURE** — The viewport begins white. Seven narrow portrait media strips appear across desktop; mobile resolves to three tall strips with the central strip dominant and the outer strips washed back.

**HEIGHT** — Fixed to the viewport for roughly the first 2–3 seconds.

**BACKGROUND** — Pure white; media is inset rather than full bleed.

**TYPOGRAPHY** — No spinner and no loading percentage. The logo briefly participates in the opening on desktop.

**MEDIA** — Portrait crops reveal in staggered vertical masks. Mobile uses approximately 25% / 42% / 25% columns separated by white gutters.

**SCROLL ENTRY / PROGRESS / EXIT** — Scroll is effectively locked. The strips expand/recede, then the whole loader clips upward to expose the hero.

**STICKY/PINNED** — Fixed above the page until completion.

**MOTION** — Staggered scale from 1.12 to 1, opacity ramp, then an upward `clip-path` handoff.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — A fixed `EntryCurtain` with three CSS-masked CMS media panels, central emphasis, staggered reveal and an upward curtain exit. Reduced-motion users bypass it.

**CMS SOURCE** — Opening enabled, desktop/mobile video and poster; poster/hero media supplies fallback strips.

## 02 — floating header over hero

**REFERENCE STRUCTURE** — Logo at top-left. At top-right: search/utility icons, WhatsApp, outlined “Need Help”, then a white circular burgundy menu trigger.

**HEIGHT** — About 72–88 px visual band, positioned over the hero.

**BACKGROUND** — Transparent until menu opens; controls use translucent/outlined pills.

**TYPOGRAPHY** — Compact 11–13 px utility labels.

**MEDIA** — No separate header media.

**SCROLL ENTRY / PROGRESS / EXIT** — Arrives after loader; stays legible over media and tightens after scrolling.

**STICKY/PINNED** — Fixed to the viewport.

**MOTION** — Header translates down after loader; background and control contrast transition on scroll.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — Fixed Image logo, language pill, contact pill and circular menu trigger. A `data-scrolled` state adds a compact cream glass surface.

**CMS SOURCE** — Global navigation, contact and locale switch.

## 03 — hero / first frame

**REFERENCE STRUCTURE** — Full-bleed family media. Copy sits in the lower-left quadrant on desktop and lower third on mobile. Kicker, very large two-line headline, round play control plus outlined CTA, and a centered double-chevron at the bottom.

**HEIGHT** — Desktop observed at ~704 px inside a 900 px viewport; mobile occupies the full 844 px viewport.

**BACKGROUND** — Cover media with a strong black gradient at bottom and soft vignette.

**TYPOGRAPHY** — Desktop headline ~62 px; mobile ~52 px with tight leading. Kicker ~14 px.

**MEDIA** — Desktop landscape crop, mobile portrait crop with the subject held near centre.

**SCROLL ENTRY** — Revealed by the loader’s upward mask.

**SCROLL PROGRESS** — Media drifts/scales subtly; copy separates from the image as the next white stage rises.

**SCROLL EXIT** — Hard color handoff from dark media to white; circular continuation marker straddles the boundary.

**STICKY/PINNED** — Not pinned on current mobile; the media itself occupies one viewport.

**MOTION** — Slow scale-down, line-by-line text rise, CTA fade, down-chevron pulse.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — CMS video/picture, lower-left editorial copy, circular media control motif and boundary marker. Hero responds to scroll with image scale and copy translation.

**CMS SOURCE** — Hero desktop/mobile image or video, poster, eyebrow, title, note and CTA.

## 04 — latest launches introduction

**REFERENCE STRUCTURE** — White full-viewport stage. Small “Our signature” label and large “Latest Launches” heading at upper-left. A three-option pill filter aligns right. Launch media and commercial details fill the remaining stage.

**HEIGHT** — Exactly ~900 px on desktop; taller flowing cards on mobile.

**BACKGROUND** — White.

**TYPOGRAPHY** — Heading ~44–54 px; project title becomes the dominant display type.

**MEDIA** — Large landscape project media, not thumbnails or boxed cards.

**SCROLL ENTRY** — Heading enters first, followed by the project media and metadata.

**SCROLL PROGRESS** — Project state changes while the visual stage remains stable; copy and imagery crossfade/translate.

**SCROLL EXIT** — White stage yields to the next high-contrast, media-led composition.

**STICKY/PINNED** — Desktop presentation behaves as a viewport-scale stage; project content is held while state changes.

**MOTION** — Image clip expansion, soft crossfade, small horizontal progress movement.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — A 300vh section with a 100vh sticky canvas. CMS projects crossfade and scale behind a large active title, location, description, counter and CTA. Mobile uses one tall snap-like project frame per record.

**CMS SOURCE** — Featured project order, name, location, description, cover, logo and CTA.

## 05 — subsidiaries / brand constellation

**REFERENCE STRUCTURE** — “Our subsidiaries / innovation labs” headline with three large brand-led media experiences rather than a feature-card grid.

**HEIGHT** — One desktop viewport (~900 px).

**BACKGROUND** — Alternating brand/media surfaces.

**TYPOGRAPHY** — Large statement type with sparse support copy.

**MEDIA** — Several dominant crops layered in one composition.

**SCROLL ENTRY / PROGRESS / EXIT** — Media clips open; active label and image emphasis move together; composition hands into a longer pinned product story.

**STICKY/PINNED** — Viewport-contained.

**MOTION** — Layered image scale, mask reveals and lateral label movement.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — Image’s philosophy becomes an off-centre editorial constellation: oversized statement, one tall primary image and one offset detail panel, avoiding cards.

**CMS SOURCE** — Story title/body/media/link plus lifestyle media as the secondary crop.

## 06 — long pinned product story

**REFERENCE STRUCTURE** — A 2700 px section at desktop (three viewports). A central story remains pinned while four peripheral square crops frame it; the centre logo, headline, body and app CTAs change with scroll.

**HEIGHT** — ~300vh desktop.

**BACKGROUND** — White.

**TYPOGRAPHY** — Centred display headline ~58–72 px with narrow paragraph below.

**MEDIA** — Four cropped squares float near the corners around the centre narrative.

**SCROLL ENTRY** — Peripheral images rise in and the central mark settles.

**SCROLL PROGRESS** — Pinned centre copy changes; corner media translate at different rates.

**SCROLL EXIT** — The final state releases into a short data strip.

**STICKY/PINNED** — Centre is pinned for approximately two viewport lengths.

**MOTION** — Parallax translate, opacity state changes, restrained scale.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — Image’s “life within places” and statistics become a 260vh sticky brand story. Four media crops use available CMS media; statistics replace product/app claims and change emphasis with scroll.

**CMS SOURCE** — Lifestyle eyebrow/title/media and homepage statistics.

## 07 — compact result / credibility strip

**REFERENCE STRUCTURE** — A shallow information strip with small heading and dense market figures.

**HEIGHT** — ~311 px desktop.

**BACKGROUND** — Light neutral.

**TYPOGRAPHY** — Small labels paired with larger figures.

**MEDIA** — None.

**SCROLL ENTRY / PROGRESS / EXIT** — Simple reveal; acts as a breathing interval before news.

**STICKY/PINNED** — None.

**MOTION** — Horizontal line expansion and number rise.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — CMS development statistics arranged as an oversized single-row ticker with ruled separators.

**CMS SOURCE** — Statistics records.

## 08 — media & news field

**REFERENCE STRUCTURE** — “What’s happening / Media & News” heading followed by a broad horizontal editorial region with article image, type/date, title and summary.

**HEIGHT** — ~978 px desktop.

**BACKGROUND** — White.

**TYPOGRAPHY** — Display section title; articles use medium titles and compact metadata.

**MEDIA** — Feature image is large and editorial; secondary items are rows, not equal cards.

**SCROLL ENTRY / PROGRESS / EXIT** — Heading reveals, feature image unmasks, secondary stories stagger; the footer color pushes upward at exit.

**STICKY/PINNED** — No long pin.

**MOTION** — Image mask/scale and text rise.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — One dominant CMS news story at left, remaining stories as ruled rows at right; asymmetric desktop and single-flow mobile.

**CMS SOURCE** — Featured news content/media/order.

## 09 — contact transition and footer

**REFERENCE STRUCTURE** — A large “get in touch / Talk To Us” gateway leads into a deep footer with brand statement, grouped links and legal/social information.

**HEIGHT** — ~875 px desktop; long stacked mobile footer.

**BACKGROUND** — Strong brand color.

**TYPOGRAPHY** — Contact headline is the largest footer element, approximately 90–120 px desktop.

**MEDIA** — Minimal; identity and type dominate.

**SCROLL ENTRY / PROGRESS / EXIT** — Footer color rises behind the contact title; link groups appear after the title.

**STICKY/PINNED** — None.

**MOTION** — Oversized title reveal and subtle CTA orbit/arrow motion.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — Peach contact gateway followed by forest footer, oversized Image title, CMS nav/contact/socials, and a circular CTA.

**CMS SOURCE** — Closing copy/CTA and global navigation/contact/socials/copyright.

## 10 — fullscreen menu

**REFERENCE STRUCTURE** — Mobile: a white rounded panel inset ~12 px from every edge, over a darkened live page. Currency pill at upper-left, burgundy round close at upper-right, numbered navigation in a single tall column, utilities along the bottom. Desktop follows the same overlay logic at a wider scale.

**HEIGHT** — Nearly 100svh with 12–16 px outer reveal.

**BACKGROUND** — White/cream panel over a dark scrim.

**TYPOGRAPHY** — Navigation ~25 px mobile with two-digit numbers; inactive/secondary items are muted.

**MEDIA** — No dominant menu image in the current mobile state.

**SCROLL ENTRY / PROGRESS / EXIT** — Body scroll locks; panel clips from the trigger corner; page remains visible around rounded edges.

**STICKY/PINNED** — Fixed.

**MOTION** — Rounded panel scale/clip, sequential link rise, reverse close.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — Inset cream dialog with numbered CMS navigation, close circle, language control, contact details and staggered entries. RTL keeps reading order deliberate rather than mechanically reversing transforms.

**CMS SOURCE** — Navigation, locale switch, email, phone, address and socials.

## 11 — Arabic / RTL adaptation

**REFERENCE STRUCTURE** — The Arabic site keeps the same macro stages, reverses text alignment and menu reading order, while media crops and vertical choreography remain compositionally stable.

**HEIGHT / BACKGROUND / MEDIA** — Same stage dimensions and assets as English.

**TYPOGRAPHY** — Arabic requires taller leading and slightly smaller display size for equivalent block depth.

**SCROLL ENTRY / PROGRESS / EXIT** — Vertical motion stays vertical. Directional arrows and inline progress reverse; image scaling does not.

**STICKY/PINNED** — Same durations as English.

**MOTION** — Only semantic horizontal movement reverses.

**IMAGE DEVELOPMENTS IMPLEMENTATION** — `dir=rtl`, Noto Kufi Arabic, explicit RTL grid alignment, reversed inline arrows/counters and unchanged scale/mask motion.

**CMS SOURCE** — Existing EN/AR fields.
