import { comparisonPairs } from "@/lib/assets";
import { databaseReady,row } from "./db";
export async function homepagePair(){const saved=databaseReady()?(await row('settings','hero')):undefined;return saved?JSON.parse(saved.data) as {before:string;after:string;provenance:string}:comparisonPairs[0];}
