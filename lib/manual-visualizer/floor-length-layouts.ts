import type { FloorLengthDrape, Rect, RoomScene } from './types';

// First-pass trace of the Modern living room screenshot (1024 x 640 scene).
// Recheck against the actual clean base before approving for production.
const modernLiving:FloorLengthDrape = {
  span:{x:205/1024,y:77/640,width:650/1024,height:375/640},
  centerGap:.17,
  pleatsPerPanel:13,
  foreground:{width:1122,height:701,outline:[
    // Left sofa, cushions and arm (coordinates relative to the preview image).
    'M 0 406 Q 58 389 109 392 L 146 386 L 165 391 L 191 386 L 216 390 L 236 386 L 257 386 L 273 402 L 300 408 Q 314 406 314 422 L 314 443 Q 345 437 375 443 Q 414 435 437 448 L 439 530 H 0 Z',
    // Central foreground plant/counter silhouette; most of this lies in the opening.
    'M 413 485 L 426 459 L 431 447 L 441 440 L 438 429 L 453 431 L 451 417 L 461 415 L 463 406 L 474 413 L 484 401 L 489 408 L 500 400 L 506 407 L 519 407 L 527 417 L 544 418 L 543 429 L 559 436 L 551 448 L 536 460 L 520 480 Z',
    // Side table, tabletop plant and armchair in front of the right curtain.
    'M 809 502 L 809 450 Q 807 443 820 439 L 833 435 L 829 425 L 839 419 L 849 419 L 859 424 L 861 432 L 874 434 Q 896 418 923 418 L 969 416 Q 1017 416 1018 457 L 1015 544 H 809 Z',
    // Tip of the tall left plant overlapping the extended left edge.
    'M 203 197 L 218 202 L 220 211 L 230 216 L 225 224 L 235 229 L 227 237 L 239 244 L 230 252 L 235 260 L 225 269 L 232 277 L 222 286 L 210 294 L 221 303 L 209 310 L 203 324 Z',
  ].join(' ')},
};

export function resolveFloorLengthDrape(scene:RoomScene):FloorLengthDrape|undefined {
  // An explicitly measured per-room manifest configuration takes priority.
  const drape=scene.drape ?? (scene.id==='room-01' && scene.width===1024 && scene.height===640 ? modernLiving : undefined);
  if(!drape)return;
  const {x,y,width,height}=drape.span;
  if(![x,y,width,height,drape.centerGap,drape.pleatsPerPanel].every(Number.isFinite)||x<0||y<0||width<=0||height<=0||x+width>1.000001||y+height>1.000001||drape.centerGap<0||drape.centerGap>=1||drape.pleatsPerPanel<1||drape.pleatsPerPanel>100)throw Error('Invalid floor-length curtain geometry for '+scene.name+'.');
  return drape;
}
export function drapePanels(drape:Pick<FloorLengthDrape,'span'|'centerGap'>,layer:'main'|'sheer'):Rect[] {
  const {span,centerGap}=drape;
  if(layer==='sheer')return [{...span}];
  const panelWidth=span.width*(1-centerGap)/2;
  return [{...span,width:panelWidth},{...span,x:span.x+span.width-panelWidth,width:panelWidth}];
}
