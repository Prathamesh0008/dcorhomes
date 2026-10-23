import { DatabaseSync } from "node:sqlite";
import { mkdirSync, realpathSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { AsyncLocalStorage } from "node:async_hooks";
export type RecordRow={kind:string;id:string;owner:string;data:string;created:number};
type Value=string|number|null;
type Executor=(query:string,values?:Value[])=>Promise<RecordRow[]>;
const context=new AsyncLocalStorage<Executor>();
let local:DatabaseSync|undefined,remote:ReturnType<typeof postgres>|undefined,initialization:Promise<void>|undefined;
let localTail:Promise<unknown>=Promise.resolve();
export function databaseReady(){return Boolean(process.env.SESSION_SECRET&&process.env.SESSION_SECRET.length>=32&&(process.env.DCORHOME_DATABASE_URL||(!process.env.VERCEL&&process.env.DCORHOME_DATA_DIR)));}
export function dataDirectory(){
 if(process.env.VERCEL)throw Error('Local persistence is disabled on Vercel. Configure PostgreSQL and private object storage.');
 if(!process.env.DCORHOME_DATA_DIR)throw Error('Private directory is unavailable.');
 const directory=path.resolve(process.env.DCORHOME_DATA_DIR);mkdirSync(directory,{recursive:true,mode:0o700});
 const actual=realpathSync(directory).toLowerCase(),publicDir=realpathSync(path.resolve('public')).toLowerCase();
 if(actual===publicDir||actual.startsWith(publicDir+path.sep))throw Error('Private storage must be outside public.');return directory;
}
function sqlite(){
 if(!local){local=new DatabaseSync(path.join(dataDirectory(),'dcorhome.sqlite'));local.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,owner TEXT NOT NULL,data TEXT NOT NULL,created REAL NOT NULL,PRIMARY KEY(kind,id));
 CREATE INDEX IF NOT EXISTS records_owner ON records(kind,owner);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires REAL NOT NULL);`);}return local;
}
function pg(){return remote||=postgres(process.env.DCORHOME_DATABASE_URL!,{max:3,prepare:false,connect_timeout:10,idle_timeout:20});}
async function initialize(){
 if(!databaseReady())throw Error('Durable metadata storage is unavailable.');
 if(!process.env.DCORHOME_DATABASE_URL){sqlite();return;}
 await (initialization||=(async()=>{await pg().unsafe('CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,owner TEXT NOT NULL,data TEXT NOT NULL,created DOUBLE PRECISION NOT NULL,PRIMARY KEY(kind,id))');await pg().unsafe('CREATE INDEX IF NOT EXISTS records_owner ON records(kind,owner)');await pg().unsafe('CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires DOUBLE PRECISION NOT NULL)');})().catch(error=>{initialization=undefined;throw error;}));
}
const remoteQuery=(client:ReturnType<typeof postgres>):Executor=>async(query,values=[])=>{let n=0;return await client.unsafe(query.replace(/\?/g,()=>'$'+(++n)),values) as unknown as RecordRow[];};
const localQuery:Executor=async(query,values=[])=>sqlite().prepare(query).all(...values) as RecordRow[];
async function execute(query:string,values:Value[]=[]){
 const tx=context.getStore();if(tx)return tx(query,values);await initialize();
 if(process.env.DCORHOME_DATABASE_URL)return remoteQuery(pg())(query,values);
 const pending=localTail.then(()=>localQuery(query,values));localTail=pending.catch(()=>{});return pending;
}
export async function transaction<T>(action:()=>Promise<T>):Promise<T>{
 if(context.getStore())return action();await initialize();
 if(process.env.DCORHOME_DATABASE_URL)return await pg().begin(async client=>{await client.unsafe('SELECT pg_advisory_xact_lock(5732301)');return context.run(remoteQuery(client as unknown as ReturnType<typeof postgres>),action);}) as T;
 const pending=localTail.then(async()=>{sqlite().exec('BEGIN IMMEDIATE');try{const result=await context.run(localQuery,action);sqlite().exec('COMMIT');return result;}catch(error){sqlite().exec('ROLLBACK');throw error;}});localTail=pending.catch(()=>{});return pending;
}
export async function allRecords(kind:string,owner?:string){return owner?execute('SELECT * FROM records WHERE kind=? AND owner=? ORDER BY created DESC',[kind,owner]):execute('SELECT * FROM records WHERE kind=? ORDER BY created DESC',[kind]);}
// Internal parameterized queries for normalized catalogue projections in this same database.
export async function catalogueSql<T extends object>(query:string,values:Value[]=[]):Promise<T[]>{return await execute(query,values) as unknown as T[];}
export async function rows(kind:string,owner?:string){return (await allRecords(kind,owner)).slice(0,owner?100:200);}
export async function row(kind:string,id:string){return (await execute('SELECT * FROM records WHERE kind=? AND id=?',[kind,id]))[0] as RecordRow|undefined;}
export async function expiredRows(kind:string,before:number){return execute('SELECT * FROM records WHERE kind=? AND created<? ORDER BY created LIMIT 200',[kind,before]);}
export async function put(kind:string,id:string,owner:string,data:unknown){await execute('INSERT INTO records(kind,id,owner,data,created) VALUES (?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data',[kind,id,owner,JSON.stringify(data),Date.now()]);}
export async function remove(kind:string,id:string){await execute('DELETE FROM records WHERE kind=? AND id=?',[kind,id]);}
export async function consume(key:string,limit:number,windowMs:number){
 if(!Number.isInteger(limit)||limit<1)throw Error('Usage is unavailable.');
 await transaction(async()=>{const now=Date.now();await execute('DELETE FROM limits WHERE expires<?',[now]);const result=await execute('INSERT INTO limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 WHERE limits.count<? RETURNING count',[key,now+windowMs,limit]);if(!result.length)throw Error('Request limit reached. Please try again later.');});
}
