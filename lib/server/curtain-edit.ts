import sharp from "sharp";
import { areaPixels, type WindowArea } from "@/lib/visualizer-area";

export async function windowMask(area: WindowArea, width: number, height: number) {
  const rect = areaPixels(area,width,height);
  // PNG alpha=0 is editable. Everything else is opaque/protected.
  return sharp({create:{width,height,channels:4,background:{r:255,g:255,b:255,alpha:1}}}).composite([{input:await sharp({create:{width:rect.width,height:rect.height,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer(),left:rect.left,top:rect.top,blend:"dest-out"}]).png().toBuffer();
}
export async function constrainEdit(original: Buffer, generated: Buffer, area: WindowArea, width: number, height: number) {
  const rect = areaPixels(area,width,height);
  const patch = await sharp(generated,{limitInputPixels:24000000}).rotate().resize(width,height,{fit:"fill"}).extract(rect).removeAlpha().png().toBuffer();
  // A provider mask is guidance. Composite only its selected region so that
  // returned furniture/wall edits outside the rectangle can never leak through.
  return sharp(original).composite([{input:patch,left:rect.left,top:rect.top}]).webp({lossless:true}).toBuffer();
}
export function curtainEditPrompt(options: Record<string,unknown>, area?: WindowArea) {
  return `TASK: Edit the supplied room photograph by adding realistic premium curtains, not by redesigning the room.
EDIT REGION: ${area ? JSON.stringify(area) + ' in normalized photo coordinates. Only the transparent mask region may be changed.' : 'The existing window and immediate curtain hanging area only.'}
PRESERVE: Keep camera, perspective, architecture, window position, furniture, walls, flooring, ceiling, objects and lighting unchanged. Do not add furniture, people, logos or text. Do not recolor the room to simulate curtain colors.
CURTAIN CONFIGURATION: ${JSON.stringify(options)}
Main curtains: ${options.mainEnabled==='true' ? `include ${options.fabricName} / ${options.material} in ${options.color}, with ${options.heading} heading.` : 'do not add a main curtain layer.'}
Sheers: ${options.sheerEnabled==='true' ? `include a separate translucent ${options.sheerMaterial} layer in ${options.sheerColor}, behind the main drape, with ${options.sheerHeading} heading.` : 'do not add sheers.'}
Respect aesthetic style ${options.style}, pattern ${options.pattern}, requested length ${options.curtainLength} and fullness ${options.fullness}. Maintain believable textile folds, fabric weight, hanging position, rails, perspective, daylight transmission and cast shadows. Room type is context, not permission to alter furnishings.
Fit all curtain additions inside the selected area. Preserve original aspect ratio and composition. These are illustrative fabric directions, not exact supplier swatch or stock guarantees.`;
}
