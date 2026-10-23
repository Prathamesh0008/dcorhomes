# Supplier swatch import

Use `supplier-swatch-template.csv` in Excel or another spreadsheet, then export UTF-8 CSV. One row represents one shade; repeat identical parent fields for every shade of a fabric. Keep stable `Fabric ID`/`Shade ID` values. This is a template with headers only, not invented inventory.

Run:

```powershell
node scripts/import-swatch-csv.cjs supplier.csv new-import.json
```

This creates a new file without overwriting an existing output. It does not import into the database. Sign into the existing administrator interface, choose **Import validated supplier records**, and submit the JSON. Create-only batches reject existing fabric IDs, duplicate product/variant SKUs across the catalogue, conflicting repeated parent values, invalid rows and missing/unsafe assets before writing anything. The entire accepted batch is transactional. Updates require the explicit existing **update** action on a fabric record; no automatic overwriting or deletion occurs.

Existing two-file imports remain supported with `node scripts/import-supplier-csv.cjs fabrics.csv shades.csv output.json`. Flat-file errors identify CSV rows/fabric IDs. The admin performs the final category, image, date, PDF and existing-record validation.

## Fields and units

- Required identity values: Fabric ID, Fabric Name, Fabric SKU, Category, Category ID, Usage, Shade ID, Shade Name, Shade Code, Variant SKU and Colour Family. IDs are stable lowercase URL slugs for fabrics; shade IDs are unique within their parent. SKUs are globally unique without regard to case.
- The template includes all requested composition, width, weight, pattern, repeat, care, collection, availability, image and shade columns. Leave unconfirmed technical cells blank; a blank does not become zero. Parent values repeated across rows must agree exactly. No category/brand/colour is inferred from a filename or an image.
- `Usage`: `main`, `sheer`, or `main|sheer`, only when confirmed by the supplier. `Applications`: optional supplier descriptions separated by `|`, such as Drapery or decorative curtain use. They become actual filter choices. Enter exact supplier pattern/style and colour-family metadata; the app does not assign verified technical classifications to demo references.
- `Width CM`: fabric roll width in centimetres. `Weight GSM`: grams per square metre. `Linear Weight GM`: grams per linear metre. These remain separate fields; no unit conversion is silently inferred.
- Both repeat dimensions are centimetres; provide both or leave both blank. `Rub Count` is the numeric abrasion test result, only if supplied. Unrated fabrics do not match a numeric abrasion range. `Stock Metres` is optional confirmed stock, not a promise of availability.
- `Available`: `true`, `false`, or `unknown`. `Availability` is supplier-confirmed descriptive text. Blank availability remains unknown. Prices require a currency. `Published At` is an actual ISO timestamp, not the import time. Sorting by publication is hidden when dates are absent.
- `Shade Image`, `Additional Images`, `Images`: existing authorized `/images/...` or admin-uploaded `/api/catalogue/images/...` paths. Separate additional paths using `|`. The image uploader already exists in protected administration. No external image URL is downloaded automatically.
- `Image Rights Confirmed` must equal `true` for every input row. This is an operator attestation; it cannot establish legal ownership automatically.
- `Technical Sheet`: an existing authorized PDF in `/documents/...`. `Heading Styles`: `|`-separated supported styles only where confirmed. Blank stays empty and does not enable the Design Studio handoff for that fabric.
- `Active`/`Shade Active`: optional `true`/`false`. Inactive products/shades are removed from discovery; existing account references can still be removed by their owner.

Physical swatches, fulfilled delivery, stock, price, lead time, countries, specifications and manufacturer shade photos require real supplier/business data. None is synthesized by this importer.
