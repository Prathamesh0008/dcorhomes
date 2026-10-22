# Guided curtain configurator

The existing configurator now uses three customer steps: main fabric and shade, optional sheers, then a review with edit actions and an enquiry. It retains the existing `ManualConfig`, compatibility normalization, storage key, URL transfer and consultation process.

## Files changed in this phase

- `components/curtains/CurtainConfigurator.tsx`: guided steps, photographic fabric buttons, large named swatches, six featured shades with access to every shade, optional sheers, review, advanced settings and enquiry actions.
- `components/curtains/ManualPreview.tsx`: selected-shade photographic palette, image crossfade, explicit missing-photo states and concise accuracy disclosure. The existing photographic canvas layers remain available as an optional reference room color study.
- `app/studio/page.tsx`: simpler entry, no competing sample/AI tabs or technical step bar, explicit Try in My Room handoff, retained upload/render/save functionality, collapsed advanced upload settings and selection-aware consultation link.
- `components/interactive/DesignComposer.tsx`: homepage integration with the same guided component.
- `components/curtains/FabricCatalogueProvider.tsx`, `app/layout.tsx`: provide the configured public business WhatsApp number to the guided flow. No number is invented.
- `scripts/manual-browser-scenarios.cjs`: end-to-end guided journey, state and preview checks, enquiry handoff and responsive screenshots.
- `scripts/catalogue-browser-scenarios.cjs`: update Studio assertions for photographic fabric selection buttons.
- `scripts/browser-check.cjs`: wait for the restored image set to settle before checking asset failures.

No configuration fields were added or removed. Fullness labels map to the existing values: Standard = 1.5, Full = 2, Extra Full = 2.5. Main and sheer enablement, fabrics, shades, separate headings, room, pattern, panels and length remain available. Lining is discussed through consultation because the existing model does not contain selectable verified lining products.

## Preview accuracy and assets

The current catalogue has no verified fabric-specific layered combination renders. The default preview therefore shows the selected main and sheer shade photographs together rather than substituting a generic curtain design. Existing digital shade images are labelled. A shade without a suitable image produces a sample-request message.

Advanced Customization offers an explicitly approximate room color study using the existing photographed layers. Their shading and sheer alpha are preserved. Its room and panel controls work; fabric construction, heading, pattern, length and fullness are retained for enquiry rather than falsely rendered. No paid AI requests occur during fabric, shade or step changes. Uploaded-room generation remains an explicit action.

## Verification

- TypeScript, production build, catalogue logic and fabric-image checks.
- Browser/API integration using isolated synthetic records, private test storage, a synthetic WhatsApp number and disabled notification delivery.
- Main and sheer photographic updates remain independent; switching fabric selects a compatible shade.
- All catalogue shades are reachable, including those beyond the featured six.
- Sheer removal hides its controls and preview; re-enabling restores the previous selection.
- Review, edit, back, URL refresh, local persistence, catalogue-to-Studio transfer and room-upload round trips retain selections.
- Supplied shared-design state initializes the first preview rather than flashing the default palette before restoration.
- Advanced heading, length, panel, fullness and room choices remain in the enquiry together with variant codes. Contact form prefill and configured WhatsApp text are verified.
- Optional room-study canvas pixels change independently. Removing sheers hides only their layer. No swatch-triggered AI POST occurs.
- Full-page screenshots of all three steps at 360, 390, 768 and 1440 pixels; no horizontal overflow or broken images. Files are `%TEMP%/dcorhome-guided-{width}-step-{1,2,3}.png`.

The normal local environment has no WhatsApp number or email delivery credentials configured. Consultation storage works locally. Supplier shade photographs, verified product specifications and exact layered combination assets remain external data requirements. No deployment or external messages were performed.
