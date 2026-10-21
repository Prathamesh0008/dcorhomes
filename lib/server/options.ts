import { designOptions } from "@/lib/design-options";
import { databaseReady,row } from "./db";
export function availableOptions(){const setting=databaseReady()?row('settings','design-options'):undefined;return setting?JSON.parse(setting.data) as typeof designOptions:designOptions;}
