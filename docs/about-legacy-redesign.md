# About Dcorhome — 20 years and the online chapter

Redesigned `/about` using the supplied, confirmed business facts: 20 years of experience, an established offline curtain/window-dressing business now expanding online, official email and Navi Mumbai office address. No founding year, founder, awards, customer counts, opening hours, phone number or showroom claims were added.

The page contains seven editorial sections:

1. “Two decades of trust. A new way to discover.” with real architectural curtain photography.
2. The journey, with a restrained typographic “20 Years” composition.
3. The digital chapter, with working collection and manual Studio links.
4. Five fabric categories in an asymmetric photographic edit.
5. A personal approach to texture, light, privacy and curtain selection.
6. Navi Mumbai office, official email, Google Maps address search and Contact link.
7. A dark forest-green closing invitation with Fabrics and Contact actions.

Existing DM Sans and Cormorant Garamond, forest green, warm ivory and champagne accents are retained. Styling is Tailwind in TSX; no dependencies, font changes, global styles or AI imagery were added. Existing locally hosted photographic assets are reused with responsive derivatives and meaningful alt text. Photography is presented as inspiration, not a claim about Dcorhome installations or inventory.

## Confirmed contact information

`lib/business.ts` is the shared source for the official email, experience and exact address:

Office no-2, 1st Floor, Wadhwa PBR, Sector 4, Palm Beach Rd, above The Bread Bar, Nerul West, Nerul, Navi Mumbai, Maharashtra 400706.

`sales@dcorhome.com`

The shared OfficeDetails component appears on About, Contact and the footer. Get Directions uses `https://www.google.com/maps/search/?api=1&query=` with that complete URL-encoded address. No third-party listing is embedded or represented as Dcorhome. External links identify their new-tab behavior and use safe rel attributes.

## Catalogue integrity

`lib/about-content.ts` derives category destinations from active category/fabric records. All five current categories link to nonempty catalogue results. Supplier descriptions are used only for supplier records; demo-only categories invite exploration of design directions and confirmation of material details/availability. If a category has no active content, its action opens the general fabric library rather than a fabricated product or empty category. No inventory or performance guarantees are inferred from editorial images.

## SEO

- Exact absolute title: **About Dcorhome | 20 Years of Curtain Experience**.
- Supplied meta description and `/about` canonical.
- Page-specific photographic Open Graph image.
- One H1, semantic section headings and descriptive image alternatives.

## Files changed

Modified:

- `app/about/page.tsx` — complete story redesign and metadata.
- `app/contact/page.tsx` — shared office details beneath existing email information; form workflow preserved.
- `components/SiteFooter.tsx` — shared office address and directions.
- `lib/business.ts` — confirmed experience/address and shared Maps URL.
- `scripts/browser-check.cjs` — opt-in focused About scenario.

Created:

- `components/editorial/OfficeDetails.tsx` — reusable office/address/directions presentation.
- `lib/about-content.ts` — catalogue-aware editorial category selections.
- `scripts/about-story-browser.cjs` — focused rendering/link checks.
- This report.

## Verification — passed

- TypeScript: `npm run lint`.
- Production: `npm run build`, including comparison-asset and manual configurator prebuild checks.
- Chrome: About and Contact at 360, 390, 768, 1024 and 1440px; no horizontal overflow, broken images or captured runtime exceptions.
- All seven story sections, exact H1, title and canonical.
- Exact office text and Maps query on both pages and their footers; working mailto address.
- All five category actions resolve to nonempty catalogue results. Collection, Studio and Contact routes return 200.
- Existing mobile menu still exposes About and closes with Escape. Contact required-field validation remains effective; no forms were submitted.
- Actual mobile/desktop screenshots reviewed, including the hero, full-page composition and fabric edit. Files are in the OS temporary directory as `dcorhome-about-story-*.png`.
- Preservation hashes confirm homepage, homepage sections, comparison, navigation/logo, Studio, AI status, catalogue page, auth backend and global CSS were unchanged.

No deployment, paid generation, email sending, secret changes or production data changes. The existing authentication/email configuration requirements remain unchanged by this task.
