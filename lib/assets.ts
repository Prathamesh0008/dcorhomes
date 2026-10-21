export const comparisonPairs = [{ id: "hero", before: "/images/hero-room-before.webp", after: "/images/hero-room-after.webp", provenance: "Warm ivory linen — original AI-created room illustration." }];
export const assetManifest = [
  { file: "atelier-interior", source: "https://www.pexels.com/photo/view-of-brown-curtains-hanging-in-a-room-17767778/", photographer: "Paulina Lazauskaite" },
  { file: "residential-room", source: "https://www.pexels.com/photo/modern-living-room-with-elegant-decor-34538289/", photographer: "HONG SON" },
  { file: "living-drapery", source: "https://www.pexels.com/photo/brown-couch-in-the-living-room-7786781/", photographer: "Furkan Tumer" },
  { file: "curtain-room", source: "https://www.pexels.com/photo/curtain-on-windows-16045145/", photographer: "hello aesthe" },
  { file: "sheer-window", source: "https://www.pexels.com/photo/opened-white-window-with-sheer-curtain-3255244/", photographer: "Jonathan Borba" },
  { file: "linen-detail", source: "https://www.pexels.com/photo/beige-wrinkled-fabric-15679399/", photographer: "Lisett Kruusimäe" },
  { file: "velvet-detail", source: "https://www.pexels.com/photo/brown-velvet-fabric-16975989/", photographer: "Eugenia Remark" },
  { file: "dark-textile", source: "https://www.pexels.com/photo/close-up-photo-of-black-textile-1487821/", photographer: "Engin Akyurt" },
  { file: "sheer-detail", source: "https://www.pexels.com/photo/checkered-curtain-near-glass-window-10624309/", photographer: "See source" },
].map(asset => ({ ...asset, path: `/images/${asset.file}.jpg`, license: "https://www.pexels.com/license/", usage: "Editorial reference, not verified Dcorhome inventory" }));
