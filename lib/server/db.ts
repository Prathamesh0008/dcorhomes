import 'server-only';
// Compatibility signatures for retired modules/tooling. No MongoDB import or write path.
export type RecordRow={kind:string;id:string;owner:string;data:string;created:number};
import { DatabaseUnavailable } from './database-diagnostics';
export { DatabaseUnavailable } from './database-diagnostics';
const retired=():never=>{throw new DatabaseUnavailable();};
export function databaseReady(){return false;}
export async function initializeApplicationDatabase():Promise<void>{retired();}
export async function transaction<T>(_action:()=>Promise<T>):Promise<T>{return retired();}
export async function allRecords(_kind:string,_owner?:string):Promise<RecordRow[]>{return retired();}
export async function rows(_kind:string,_owner?:string):Promise<RecordRow[]>{return retired();}
export async function row(_kind:string,_id:string):Promise<RecordRow|undefined>{return retired();}
export async function expiredRows(_kind:string,_before:number):Promise<RecordRow[]>{return retired();}
export async function put(_kind:string,_id:string,_owner:string,_data:unknown):Promise<void>{retired();}
export async function remove(_kind:string,_id:string):Promise<void>{retired();}
export async function consume(_key:string,_limit:number,_windowMs:number):Promise<void>{retired();}
