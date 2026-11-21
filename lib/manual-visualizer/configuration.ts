import type { FabricRecord } from '../curtains/catalogue';
import { defaultDesign, mainPreviewSelection, matchSheerToMain } from './model';
import { studioPhotoScenes } from './manifest';
import type { VisualizerConfiguration, LayerSelection } from './types';
export type ConfigurationAction =
 | {type:'restore';design:VisualizerConfiguration}
 | {type:'scene';id:string}
 | {type:'layer';layer:'main'|'sheer';value:LayerSelection;sheerColorMode?:VisualizerConfiguration['sheerColorMode']};

export function restoreStudioVisit(last:VisualizerConfiguration):VisualizerConfiguration{
 const {sheer,sheerOptOut}=last;
 const sceneId=studioPhotoScenes.some(scene=>scene.id===last.sceneId)?last.sceneId:defaultDesign.sceneId;
 // Old drafts stored the toggle alone. Retain a tracked opt-out and recover the
 // default for unmarked drafts. Explicitly opened designs keep their settings.
 const legacyDefault=sheer.materialId===defaultDesign.sheer.materialId
  &&(sheer.variantId==='soft-ivory'||sheer.variantId===defaultDesign.sheer.variantId);
 const sheerColorMode=last.sheerColorMode??(legacyDefault?'auto':'manual');
 return {...defaultDesign,sceneId,sheer:{...sheer,enabled:!sheerOptOut},sheerColorMode,...(sheerOptOut?{sheerOptOut}:{}),...(last.photoCustomized?{photoCustomized:true}:{})};
}

export function configurationReducer(state:VisualizerConfiguration,action:ConfigurationAction,records:FabricRecord[]=[]):VisualizerConfiguration{
 if(action.type==='restore')return matchSheerToMain(action.design,records);
 if(action.type==='scene')return {...state,sceneId:action.id};
 const next={...state,[action.layer]:action.value};
 if(action.layer==='sheer'){
  if(action.value.enabled){
   delete next.sheerOptOut;
   next.photoCustomized=true;
  }
  else next.sheerOptOut=true;
  if(action.sheerColorMode)next.sheerColorMode=action.sheerColorMode;
 }else if(mainPreviewSelection(next.main)&&!next.sheer.enabled&&!next.sheerOptOut){
  next.sheer={...next.sheer,enabled:true};
 }
 return matchSheerToMain(next,records);
}
