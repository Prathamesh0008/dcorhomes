import CurtainConfigurator from "@/components/curtains/CurtainConfigurator";
import Container from "@/components/ui/Container";
import { typography } from "@/lib/typography";
export default function DesignComposer(){return <section className="bg-ink py-14 text-paper md:py-20"><Container><p className="text-[10px] uppercase tracking-[2px] text-[#c8b99d]">Your curtain configurator</p><h2 className={`mb-5 ${typography.section}`}>Choose the details.<br/><em className="font-serif font-normal text-[#c8b99d]">See the whole look.</em></h2><p className="mb-8 max-w-2xl text-[15px] leading-[1.8] text-[#c6cdbf]">Explore independent sheer and main curtain layers, then bring your choices into your own room.</p><CurtainConfigurator/></Container></section>;}
