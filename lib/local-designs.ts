import type { DesignSelection } from "./design-options";
export type LocalDesign = { id: string; created: number; selection: DesignSelection; original?: Blob; result?: Blob; status: "direction" | "generated" | "manual"; visualizer?: import('./manual-visualizer/model').VisualizerDesign };
const manualKey = 'dcorhome-saved-manual-designs-v1';
function manualDesigns(): LocalDesign[] {
 const parsed: unknown = JSON.parse(localStorage.getItem(manualKey) || '[]');
 if (!Array.isArray(parsed)) throw Error('Saved designs could not be read. Export a backup before clearing browser storage.');
 return parsed as LocalDesign[];
}
function open(): Promise<IDBDatabase> { return new Promise((resolve,reject)=>{const request=indexedDB.open("dcorhome-designs",1);request.onupgradeneeded=()=>request.result.createObjectStore("designs",{keyPath:"id"});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error("Browser storage is unavailable."));}); }
export async function localDesigns():Promise<LocalDesign[]> {
 const manual=manualDesigns();
 if(typeof indexedDB==='undefined')return manual;
 let db:IDBDatabase;try{db=await open();}catch(error){if(manual.length)return manual;throw error;}try{const legacy=await new Promise<LocalDesign[]>((resolve,reject)=>{const request=db.transaction("designs").objectStore("designs").getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return [...legacy.filter(item=>!manual.some(saved=>saved.id===item.id)),...manual];}finally{db.close();}
}
export async function saveLocalDesign(design:LocalDesign){
 if(design.visualizer){
  const records=manualDesigns();
  if(records.length>=50&&!records.some(item=>item.id===design.id))throw Error('You can keep up to 50 manual designs in this browser.');
  const {id,created,selection,visualizer}=design;
  const value=JSON.stringify({id,created,selection,visualizer,status:'manual'});
  if(value.length>30000||/data:image/i.test(value))throw Error('Store photographs in browser image storage, not design configuration.');
  try{localStorage.setItem(manualKey,JSON.stringify([...records.filter(item=>item.id!==id),JSON.parse(value)]));}catch{throw Error('Could not save. Browser storage may be disabled or full.');}
  return;
 }
 const records=await localDesigns();if(records.length>=10&&!records.some(r=>r.id===design.id))throw Error("You can keep up to 10 designs on this device. Remove one first.");const db=await open();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("designs","readwrite");tx.objectStore("designs").put(design);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error("Could not save. Browser storage may be full."));});}finally{db.close();}}
export async function deleteLocalDesign(id:string){
 const records=manualDesigns(),local=records.some(item=>item.id===id);
 if(local)localStorage.setItem(manualKey,JSON.stringify(records.filter(item=>item.id!==id)));
 if(typeof indexedDB==='undefined'){if(local)return;throw Error('Browser image storage is unavailable.');}
 let db:IDBDatabase;try{db=await open();}catch(error){if(local)return;throw error;}try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("designs","readwrite");tx.objectStore("designs").delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
