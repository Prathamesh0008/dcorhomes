import { Suspense } from 'react';
import ManualCurtainStudio from '@/components/curtains/manual-visualizer/ManualCurtainStudio';
export default function StudioPage(){
 return <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-[13px] text-muted">Opening your curtain studio...</div>}><ManualCurtainStudio/></Suspense>;
}
