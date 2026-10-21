import { comparisonPairs } from "@/lib/assets";
import { databaseReady,row } from "./db";
export function homepagePair(){const saved=databaseReady()?row('settings','hero'):undefined;return saved?JSON.parse(saved.data) as {before:string;after:string;provenance:string}:comparisonPairs[0];}
