import type { FabricRecord } from "@/lib/curtains/catalogue";
import { categoryId, type FabricCategory } from "@/lib/curtains/categories";

const selections = [
  { id: "sheer", title: "Sheer Curtains", image: "/images/curtain-room.jpg", alt: "Daylight filtering through sheer curtains at a tall window" },
  { id: "silk", title: "Silk Curtains", image: "/images/living-drapery.jpg", alt: "Soft curtain layers framing a warm living room, an editorial style reference" },
  { id: "velvet", title: "Velvet Curtains", image: "/images/velvet-detail.jpg", alt: "Close-up photograph of brown velvet folds and surface texture" },
  { id: "linen", title: "Linen Curtains", image: "/images/linen-detail.jpg", alt: "Close-up photograph of the natural weave and folds of linen" },
  { id: "textured", title: "Textured and Specialty Fabrics", image: "/images/sheer-detail.jpg", alt: "Woven patterned curtain photographed beside a window" },
];

export function aboutFabricSelections(records: FabricRecord[], categories: FabricCategory[]) {
  return selections.map(selection => {
    const category = categories.find(item => item.id === selection.id && item.active !== false);
    const matches = category ? records.filter(record => record.active !== false && categoryId(record) === selection.id && record.colors.some(color => color.active !== false)) : [];
    const verified = matches.find(record => record.source === "supplier");
    return {
      ...selection,
      href: matches.length ? `/collections?category=${selection.id}` : "/collections",
      description: verified?.description || (matches.length ? `Explore ${category!.name.toLowerCase()} design directions in our library. Confirm fabric details and availability with our team.` : "Ask our team about this fabric direction, or explore the current fabric library."),
      action: matches.length ? (verified ? "Explore fabrics" : "Explore design directions") : "Explore the fabric library",
    };
  });
}
