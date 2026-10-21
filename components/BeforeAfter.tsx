import CurtainComparison from "@/components/interactive/CurtainComparison";
import { comparisonPairs } from "@/lib/assets";
export default function BeforeAfter(){return <CurtainComparison before={comparisonPairs[0].before} after={comparisonPairs[0].after} caption={comparisonPairs[0].provenance}/>;}
