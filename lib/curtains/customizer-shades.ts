import type { FabricRecord, FabricVariant } from './catalogue';

const root = '/images/manual-visualizer/atelier-v2/fabrics';
const blackoutTexture = '/images/fabrics/noir/charcoal-digital.webp';

const mainShades = [
  { id: 'navy-blue', name: 'Navy Blue', hex: '#314461', family: 'Blue', filter: 'grayscale(1) sepia(1) saturate(1.7) hue-rotate(170deg)' },
  { id: 'olive-green', name: 'Olive Green', hex: '#626b47', family: 'Green', filter: 'grayscale(1) brightness(1.4) sepia(1) saturate(1.4) hue-rotate(25deg)' },
  { id: 'burgundy', name: 'Burgundy', hex: '#713346', family: 'Red', filter: 'grayscale(1) sepia(1) saturate(2.4) hue-rotate(295deg)' },
];
const sheerShades = [
  { id: 'champagne', name: 'Champagne', hex: '#ecdcbf', family: 'Neutral' },
  { id: 'sage-green', name: 'Sage Green', hex: '#bec9b5', family: 'Green' },
  { id: 'pale-blue', name: 'Pale Blue', hex: '#c1d8e3', family: 'Blue' },
];
const textureDirectories: Partial<Record<string, string>> = {
  sienna: 'main-curtains/pure-linen',
  clay: 'main-curtains/velvet',
  olive: 'main-curtains/textured-polyester-weave',
  'silk-satin-study': 'main-curtains/silk',
  solstice: 'sheers/plain-voile',
  pearl: 'sheers/fine-voile',
};

// These illustrative shades stay in the curtain configuration records.
// The public catalogue retains the original fabric records and stock data.
export function withCustomizerShades(fabric: FabricRecord): FabricRecord {
  const directory = textureDirectories[fabric.id];
  const blackout = fabric.id === 'noir';
  if (fabric.source !== 'demo' || (!directory && !blackout)) return fabric;

  const additions = (fabric.usage.includes('sheer') ? sheerShades : mainShades)
    .filter(shade => !fabric.colors.some(color => color.name === shade.name || color.id === shade.name))
    .map(({ id, name, hex, family }): FabricVariant => {
      const image = blackout ? blackoutTexture : `${root}/${directory}/${id}.webp`;
      return {
        id: name, name, family, hexPreview: hex, available: null,
        colorCode: `DEMO-${fabric.id.toUpperCase()}-${id.toUpperCase()}`,
        digitalPreviewImage: image,
        digitalSwatchImage: image,
      };
    });
  return additions.length ? { ...fabric, colors: [...fabric.colors, ...additions] } : fabric;
}

export function customizerShadeFilter(shade: FabricVariant | undefined): string | undefined {
  if (shade?.digitalPreviewImage !== blackoutTexture || shade.digitalSwatchImage !== blackoutTexture) return;
  return mainShades.find(color => color.name === shade.name)?.filter;
}
