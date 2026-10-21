import { images } from "./urls";
export type FabricType =
  "Sheer" | "Linen" | "Blackout" | "Velvet" | "Textured" | "Layered";
export type CurtainProduct = {
  id: string;
  name: string;
  subtitle: string;
  category: FabricType;
  description: string;
  image: string;
  imageAlt: string;
  imageNote: string;
  color: string;
  accent: string;
  pricePerMeter: number | null;
};
// Design directions, not verified inventory. Keep IDs stable for saved studio links.
// Stock photographs communicate an aesthetic; they are not Dcorhome SKU photographs.
export const products: CurtainProduct[] = [
  {
    id: "solstice",
    name: "Soft sheers",
    subtitle: "A lighter way to live.",
    category: "Sheer",
    description:
      "Explore translucent drapes and softly filtered daylight. Confirm privacy with a physical sample.",
    image: images.editorial,
    imageAlt:
      "Daylight falling through a real sheer curtain beside an open window",
    imageNote: "Sheer curtain reference",
    color: "#e7dfd1",
    accent: "Warm white",
    pricePerMeter: null,
  },
  {
    id: "sienna",
    name: "Natural linen",
    subtitle: "Texture, quietly expressed.",
    category: "Linen",
    description:
      "Explore a relaxed linen direction with a visible weave and an understated, natural palette.",
    image: "/images/linen-detail.jpg",
    imageAlt: "Close-up photograph of woven beige linen curtain fabric",
    imageNote: "Linen texture reference",
    color: "#baa48e",
    accent: "Sandstone",
    pricePerMeter: null,
  },
  {
    id: "noir",
    name: "A quieter retreat",
    subtitle: "Privacy, considered.",
    category: "Blackout",
    description:
      "Plan for less light in bedrooms and media rooms. Blackout performance depends on the selected cloth, lining and installation.",
    image: "/images/dark-textile.jpg",
    imageAlt: "Close-up of dark textile folds",
    imageNote: "Dark textile reference; blackout performance not demonstrated",
    color: "#615e58",
    accent: "Charcoal",
    pricePerMeter: null,
  },
  {
    id: "olive",
    name: "The textured edit",
    subtitle: "Interest in the details.",
    category: "Textured",
    description:
      "Explore tactile surfaces and a grounded palette. Ask us about available weaves and color options.",
    image: "/images/sheer-detail.jpg",
    imageAlt: "Photograph of a checked curtain with a visible textile pattern",
    imageNote: "Pattern and texture reference",
    color: "#858b72",
    accent: "Sage olive",
    pricePerMeter: null,
  },
  {
    id: "clay",
    name: "Velvet, softly",
    subtitle: "A study in depth.",
    category: "Velvet",
    description:
      "Explore the depth of a velvet pile and the way its surface catches natural light.",
    image: "/images/velvet-detail.jpg",
    imageAlt:
      "Close-up photograph of draped brown velvet and its natural sheen",
    imageNote: "Velvet texture reference",
    color: "#9e735f",
    accent: "Terracotta",
    pricePerMeter: null,
  },
  {
    id: "pearl",
    name: "Window light",
    subtitle: "A gentle frame for the day.",
    category: "Sheer",
    description:
      "A sheer-led direction for softened light. Stock photography is for inspiration, not a confirmed product color.",
    image: "/images/curtain-room.jpg",
    imageAlt: "Sheer curtains at a tall wood-framed window",
    imageNote: "Window styling reference",
    color: "#f4ede4",
    accent: "Pearl",
    pricePerMeter: null,
  },
  {
    id: "dune",
    name: "Layers of light",
    subtitle: "From daylight to evening.",
    category: "Layered",
    description:
      "Pair a sheer inner curtain with an outer drape. The studio opens a base palette; discuss a complete layered specification with us.",
    image: "/images/living-drapery.jpg",
    imageAlt:
      "A residential living room with sheer curtains and mustard outer drapes",
    imageNote: "Layered curtain reference",
    color: "#cbbb9d",
    accent: "Oat",
    pricePerMeter: null,
  },
  {
    id: "midnight",
    name: "A tailored fall",
    subtitle: "Architecture, softened.",
    category: "Blackout",
    description:
      "Explore full-height drapery. This photograph illustrates heading and fall, not verified blackout performance.",
    image: images.hero,
    imageAlt:
      "Tall brown curtains with natural gathered headings in a real apartment",
    imageNote: "Drapery reference; lining to be specified",
    color: "#404c44",
    accent: "Forest",
    pricePerMeter: null,
  },
];
export const categoryNames = [
  "All fabrics",
  "Sheer",
  "Linen",
  "Blackout",
  "Velvet",
  "Textured",
  "Layered",
] as const;
export const formatINR = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
