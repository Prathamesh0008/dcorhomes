# Signature navigation redesign

Rebuilt the shared header as one horizontal row: 80px on mobile and 84px from tablet upwards, plus a 1px divider. No header height changes on scroll.

## Composition

- At 1440px and above: unchanged approved Brand on the left; Home, Fabrics, Design Studio, Explore, About Us and Contact Us in the centre; Login, Sign Up and the forest-green Studio CTA on the right.
- At 1280–1439px: the same navigation with guest account actions in an Account disclosure.
- At 1024–1279px: Home, Fabrics, Design Studio and Explore remain visible; About/Contact join Size Guide, Inspiration and FAQ inside Explore. No routes are removed.
- Below 1024px: menu button opens a native modal drawer. Tablet also shows the Studio CTA. Mobile presents the approved logo and menu button only, with all routes, auth actions and CTA inside the drawer.
- Signed-in customers receive My Account, Saved Designs and the existing working Logout action. Device/account ownership and authentication backend behavior are unchanged.

Warm ivory, forest green, a fine champagne route underline and a restrained vertical separator use the existing fonts and palette. All styling is Tailwind in TSX. No dependencies or global CSS changes.

Desktop disclosures support Enter/Space, Tab, arrow keys, Home/End, Escape with focus return, link selection, and outside-pointer dismissal. The mobile dialog provides native modal focus containment, initial close-button focus, Escape, backdrop/close/link dismissal, scroll locking and return focus. Scroll applies subtle translucency and blur; existing reduced-motion settings remain effective. A root scroll-padding utility keeps anchor destinations below the sticky header.

## Files

Modified:

- `components/SiteHeader.tsx`: new single-row composition and sticky/mobile state.
- `components/account/AccountNavigation.tsx`: responsive guest/account controls, existing logout integration.
- `app/layout.tsx`: root anchor scroll padding only.
- `scripts/browser-check.cjs`: opt-in focused navigation scenario.

Created:

- `components/navigation/Brand.tsx`: original approved Brand implementation moved intact; re-exported from SiteHeader for existing consumers.
- `components/navigation/DesktopNavigation.tsx`: responsive routes and Explore grouping.
- `components/navigation/NavigationDropdown.tsx`: shared accessible disclosure behavior and navigation typography.
- `components/navigation/MobileNavigation.tsx`: native modal drawer.
- `components/navigation/StudioLink.tsx`: shared primary CTA.
- `scripts/navigation-browser.cjs`: focused local browser verification.
- This report.

## Verification — passed

- `npm run lint` and `npm run build`.
- Actual Chrome renders at 390, 768, 1024, 1280, 1440 and 1920px, plus 360, 430 and 1080px edge cases.
- Header height, one-row layout, no collisions, no viewport clipping, navigation containment and loaded images at every width.
- Sticky top position, consistent height and scrolled appearance.
- Explore keyboard navigation, Escape/focus return, laptop secondary routes, guest Account actions and outside dismissal.
- Mobile dialog links, focus containment, initial focus, scroll lock, Escape/focus return, backdrop dismissal and same-route link dismissal at mobile/tablet sizes.
- Real isolated customer signup, authenticated header and Saved Designs destination, followed by the existing Logout action and logged-out header. No live account data or email used.
- Reduced-motion transition suppression; no captured browser runtime exceptions.
- Reviewed actual desktop, laptop, mobile and drawer screenshots, saved under the temporary directory as `dcorhome-navigation-*.png`.
- Byte-for-byte preservation checks passed for the homepage, existing homepage sections, Studio, Contact, auth backend, footer and global CSS. Original Brand function matches the approved implementation exactly. Catalogue/product code was not edited.
- Existing comparison assets and manual configurator checks passed during prebuild.

No deployment. No real emails, paid AI requests, environment-secret changes or production database migration.
