import type { VisualizerConfiguration, LayerSelection } from './types';
export type ConfigurationAction =
 | {type:'restore';design:VisualizerConfiguration}
 | {type:'scene';id:string}
 | {type:'layer';layer:'main'|'sheer';value:LayerSelection};
export function configurationReducer(state:VisualizerConfiguration,action:ConfigurationAction):VisualizerConfiguration{
 if(action.type==='restore')return action.design;
 if(action.type==='scene')return {...state,sceneId:action.id};
 return {...state,[action.layer]:action.value};
}
