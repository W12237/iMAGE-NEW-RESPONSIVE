# Madinet Masr homepage reference map

Study date: 8 October 2026. The live English and Arabic routes were reviewed as interaction references at desktop, tablet, and narrow mobile viewport classes. This document records behavior, not proprietary assets or implementation.

## Opening sequence

**Reference:** A near-white full-screen loader establishes the brand before the homepage. **Behavior:** a restrained centered mark resolves before the curtain exits vertically into full-screen media. **Scroll:** locked only during the short entry. **Motion:** opacity, tracking, progress and a full-height curtain transform. **Desktop:** generous empty field. **Mobile:** same idea with shorter copy and tighter scale. **RTL:** centered composition is direction-neutral. **Image Developments:** cream curtain, Image wordmark/headline, optional cinematic media, then vertical reveal. **CMS:** enabled flag, EN/AR headline, desktop/mobile video and poster.

## Header and fullscreen navigation

**Reference:** the logo floats over the hero; compact utility actions and a circular menu control sit opposite. Navigation is an immersive layer, not a drawer. **Behavior:** controls maintain strong contrast and the menu occupies the viewport with oversized links and supporting media. **Scroll:** header remains visually light over media; section content takes priority. **Motion:** clipped panel entrance and staggered links. **Desktop:** split navigation/media composition. **Mobile:** stacked media and links with a large close target. **RTL:** edge placement, reveal direction and reading order mirror. **Image Developments:** forest/cream/peach palette and current CMS navigation. **CMS:** navigation labels/URLs, contact data and menu image.

## Hero

**Reference:** edge-to-edge moving media is the first content surface; headline and small support controls sit directly on the image with layered gradients. **Behavior:** typography is editorial and sparse rather than a card. **Scroll:** the first wheel/touch movement hands off directly into the next large composition. **Motion:** slow media scale, clipped line reveal, subtle cue. **Desktop:** headline sits low and wide with secondary copy at the opposite edge. **Mobile:** portrait crop, smaller copy and simplified cue. **RTL:** title anchors to the right and keeps Arabic line-height generous. **Image Developments:** existing campaign language over CMS media. **CMS:** desktop/mobile video, desktop/mobile image, poster, EN/AR text, alt and discover label.

## Brand story

**Reference:** pale editorial fields create relief after the hero, mixing very large type, a tall image, small numbering and concise body copy. **Scroll:** elements reveal at different moments across a section taller than the viewport. **Motion:** masked text/media rise with restrained easing. **Desktop:** asymmetric four-column composition. **Mobile:** deliberate vertical reorder with an offset portrait image. **RTL:** grid alignment mirrors without reversing semantic content. **Image Developments:** cream story canvas and current story copy/media. **CMS:** eyebrow, title, body, image, alt and link.

## Developments / launches

**Reference:** project discovery occupies the viewport and advances as a cinematic sequence. **Behavior:** imagery fills the frame while location, name, counter and action remain legible over a controlled dark grade. **Scroll:** desktop pins the viewport and crossfades/scales projects across a long scroll range. **Motion:** image scale and crossfade; counters and active content change with progress. **Desktop:** three viewport lengths for three featured items. **Mobile:** separate full-height stacked project panels to avoid scroll hijacking. **RTL:** text edge, counters and transition direction mirror. **Image Developments:** published featured projects remain database-driven. **CMS:** featured/order, name, location, description, cover, alt, logo and CTA.

## Full-viewport lifestyle, statistics and journal

**Reference:** high-impact media alternates with quiet numeric/editorial surfaces. **Behavior:** full-bleed media resets visual energy; large statistics and news cards introduce density later. **Scroll:** normal flow with staged reveals and image scale on hover. **Motion:** viewport reveal, image zoom and typography masks. **Desktop:** broad two-column arrangements. **Mobile:** single-column narrative and touch-safe cards. **RTL:** column alignment and type treatment are tuned; numerals remain readable. **Image Developments:** current lifestyle, statistics and featured news records. **CMS:** all text, image, alt, visibility and ordering data.

## Closing and footer

**Reference:** a strong color field closes the narrative before a dark information-rich footer. **Behavior:** oversized invitation plus circular action; footer arrives as the final tonal anchor. **Scroll:** no pinned footer; clean hand-off. **Motion:** reveal and hover rotation/color inversion. **Desktop:** horizontal call-to-action balance. **Mobile:** stacked CTA with the orbit shifted to the trailing edge. **RTL:** alignment and social/navigation order mirror. **Image Developments:** peach CTA and forest footer. **CMS:** EN/AR CTA, URL, navigation, contact, socials and copyright.

## Motion architecture and accessibility

Framer Motion owns component/overlay transitions and scroll progress; CSS owns long-running media scale, masks, hover states and reduced-motion fallbacks. There is no destructive scroll hijacking. `prefers-reduced-motion` removes the loader and collapses animation durations while preserving every section and control. Native semantic navigation, dialog labeling, Escape close, focus transfer, alt text and high-contrast focus rings remain required.
