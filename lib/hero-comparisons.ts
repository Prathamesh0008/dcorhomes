export type HeroComparisonSlide = {
  id: string;
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  label?: string;
  roomName?: string;
  curtainCombination?: string;
  sourceImage?: string;
  provenance?: "ai-edited" | "photographed";
};

// Ten reviewed, offline AI-edited concepts derived from public/hero/1.png … 10.png.
// Room names describe the supplied photographs; fabrics are design concepts.
export const heroComparisonSlides: HeroComparisonSlide[] = [
  {
    "id": "hero-01",
    "beforeSrc": "/images/hero/hero-01-before.webp",
    "afterSrc": "/images/hero/hero-01-after.webp",
    "roomName": "Lakeside living room",
    "label": "Lakeside living room",
    "curtainCombination": "White sheer + Warm Beige Linen",
    "sourceImage": "/hero/1.png",
    "provenance": "ai-edited",
    "alt": "Lakeside living room with white sheer + warm beige linen"
  },
  {
    "id": "hero-02",
    "beforeSrc": "/images/hero/hero-02-before.webp",
    "afterSrc": "/images/hero/hero-02-after.webp",
    "roomName": "Sunlit bedroom",
    "label": "Sunlit bedroom",
    "curtainCombination": "Ivory sheer + Champagne Silk",
    "sourceImage": "/hero/2.png",
    "provenance": "ai-edited",
    "alt": "Sunlit bedroom with ivory sheer + champagne silk"
  },
  {
    "id": "hero-03",
    "beforeSrc": "/images/hero/hero-03-before.webp",
    "afterSrc": "/images/hero/hero-03-after.webp",
    "roomName": "Arched window hall",
    "label": "Arched window hall",
    "curtainCombination": "Soft White sheer + Charcoal Velvet",
    "sourceImage": "/hero/3.png",
    "provenance": "ai-edited",
    "alt": "Arched window hall with soft white sheer + charcoal velvet"
  },
  {
    "id": "hero-04",
    "beforeSrc": "/images/hero/hero-04-before.webp",
    "afterSrc": "/images/hero/hero-04-after.webp",
    "roomName": "Family reading room",
    "label": "Family reading room",
    "curtainCombination": "Cream sheer + Olive Green Linen",
    "sourceImage": "/hero/4.png",
    "provenance": "ai-edited",
    "alt": "Family reading room with cream sheer + olive green linen"
  },
  {
    "id": "hero-05",
    "beforeSrc": "/images/hero/hero-05-before.webp",
    "afterSrc": "/images/hero/hero-05-after.webp",
    "roomName": "Master bedroom",
    "label": "Master bedroom",
    "curtainCombination": "Ivory sheer + Taupe Blackout Curtains",
    "sourceImage": "/hero/5.png",
    "provenance": "ai-edited",
    "alt": "Master bedroom with ivory sheer + taupe blackout curtains"
  },
  {
    "id": "hero-06",
    "beforeSrc": "/images/hero/hero-06-before.webp",
    "afterSrc": "/images/hero/hero-06-after.webp",
    "roomName": "Bright lakeside living room",
    "label": "Bright lakeside living room",
    "curtainCombination": "White sheer + Mocha Textured Curtains",
    "sourceImage": "/hero/6.png",
    "provenance": "ai-edited",
    "alt": "Bright lakeside living room with white sheer + mocha textured curtains"
  },
  {
    "id": "hero-07",
    "beforeSrc": "/images/hero/hero-07-before.webp",
    "afterSrc": "/images/hero/hero-07-after.webp",
    "roomName": "Sunset dining and living room",
    "label": "Sunset dining and living room",
    "curtainCombination": "Warm Ivory sheer + Deep Brown Velvet",
    "sourceImage": "/hero/7.png",
    "provenance": "ai-edited",
    "alt": "Sunset dining and living room with warm ivory sheer + deep brown velvet"
  },
  {
    "id": "hero-08",
    "beforeSrc": "/images/hero/hero-08-before.webp",
    "afterSrc": "/images/hero/hero-08-after.webp",
    "roomName": "City apartment sitting room",
    "label": "City apartment sitting room",
    "curtainCombination": "Cream sheer + Sage Green Curtains",
    "sourceImage": "/hero/8.png",
    "provenance": "ai-edited",
    "alt": "City apartment sitting room with cream sheer + sage green curtains"
  },
  {
    "id": "hero-09",
    "beforeSrc": "/images/hero/hero-09-before.webp",
    "afterSrc": "/images/hero/hero-09-after.webp",
    "roomName": "Arched window residence",
    "label": "Arched window residence",
    "curtainCombination": "Pale Grey sheer + Navy Blue Main Curtains",
    "sourceImage": "/hero/9.png",
    "provenance": "ai-edited",
    "alt": "Arched window residence with pale grey sheer + navy blue main curtains"
  },
  {
    "id": "hero-10",
    "beforeSrc": "/images/hero/hero-10-before.webp",
    "afterSrc": "/images/hero/hero-10-after.webp",
    "roomName": "City-view bedroom",
    "label": "City-view bedroom",
    "curtainCombination": "White sheer + Burgundy Velvet",
    "sourceImage": "/hero/10.png",
    "provenance": "ai-edited",
    "alt": "City-view bedroom with white sheer + burgundy velvet"
  }
];
