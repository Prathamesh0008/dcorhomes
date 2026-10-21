"use client";
import { typography } from "@/lib/typography";
import PageIntro from "@/components/editorial/PageIntro";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";

import { calculateMeasurements } from "@/lib/measurements";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  ChevronDown,
  Info,
  Ruler,
  Scissors,
} from "lucide-react";
import { formatINR, products } from "@/lib/catalog";
export default function MeasurePage() {
  const [width, setWidth] = useState("180"),
    [height, setHeight] = useState("240"),
    [number, setNumber] = useState("1"),
    [fullness, setFullness] = useState("2"),
    [fabric, setFabric] = useState(products[1].id),
    [rate, setRate] = useState("");
  const [unit,setUnit]=useState<'cm'|'in'>('cm'),[rollWidth,setRollWidth]=useState('140'),[panels,setPanels]=useState('2'),[allowance,setAllowance]=useState('30'),[repeat,setRepeat]=useState('0'),[windowWidth,setWindowWidth]=useState('140'),[windowHeight,setWindowHeight]=useState('200'),[mount,setMount]=useState('Wall mounted');
  const estimate=useMemo(()=>{const result=calculateMeasurements({width:Number(width),drop:Number(height),windows:Number(number),fullness:Number(fullness),rollWidth:Number(rollWidth),panels:Number(panels),allowance:Number(allowance),repeat:Number(repeat),unit});return result?{...result,amount:Number(rate)>0&&Number.isFinite(Number(rate))?Math.round(result.meters*Number(rate)):null}:null;},[width,height,number,fullness,rollWidth,panels,allowance,repeat,unit,rate]);
  const measurementSummary=estimate?`Track ${width} ${unit}; drop ${height} ${unit}; ${number} windows; fullness ${fullness}; ${panels} panels/window; roll ${rollWidth} ${unit}; allowance ${allowance} ${unit}; repeat ${repeat} ${unit}; ${mount}; preliminary ${estimate.meters} m fabric. Professional verification required.`:'';
  return (
    <>
      <PageIntro
        eyebrow="THE MEASUREMENT GUIDE"
        title={
          <>
            The beauty of
            <br />
            <em className="font-serif font-normal text-[#97836b]">a perfect fit.</em>
          </>
        }
        description="A few considered measurements make all the difference. Plan the width, the fall and the fullness before we refine the final details together."
        image="/images/atelier-interior.jpg"
        alt="The gathered heading and natural folds of full-height brown curtains"
      />
      <Container
        as="section"
        className="grid grid-cols-[1.04fr_.96fr] py-20 gap-[95px] max-[1271px]:gap-[50px] max-[981px]:grid-cols-[1fr_1fr] max-[981px]:gap-8 max-[681px]:pt-[75px] max-[681px]:pb-[78px] max-[681px]:block"
      >
        <div>
          <Eyebrow>01 / HOW TO MEASURE</Eyebrow>
          <h2 className={`mt-[22px] mb-[45px] mx-0 max-[981px]:text-[48px] max-[681px]:text-[42px] ${typography.section}`}>
            First, the{" "}
            <em className="font-serif italic font-normal text-[#a58e76]">
              details.
            </em>
          </h2>
          <div className="flex py-[27px] px-0 gap-6 border-t border-solid border-t-[#e3e4da]">
            <span className="font-sans text-[31px] text-[#aa9780] leading-[1]">
              01
            </span>
            <div>
              <h3 className="text-[20px] font-semibold mt-0 mb-[11px] mx-0">
                Measure your track or rod
              </h3>
              <p className={`text-[#788177] max-w-[480px] m-0 ${typography.body}`}>
                For a wall-mounted curtain, measure the full width of the rod or
                track, not just the glass. We recommend extending beyond the
                window where possible.
              </p>
            </div>
          </div>
          <div className="flex py-[27px] px-0 gap-6 border-t border-solid border-t-[#e3e4da]">
            <span className="font-sans text-[31px] text-[#aa9780] leading-[1]">
              02
            </span>
            <div>
              <h3 className="text-[20px] font-semibold mt-0 mb-[11px] mx-0">
                Measure the drop
              </h3>
              <p className={`text-[#788177] max-w-[480px] m-0 ${typography.body}`}>
                Start at the track or hook position and measure down to your
                desired finish. Measure in centimeters.
              </p>
            </div>
          </div>
          <div className="flex py-[27px] px-0 gap-6 border-t border-solid border-t-[#e3e4da]">
            <span className="font-sans text-[31px] text-[#aa9780] leading-[1]">
              03
            </span>
            <div>
              <h3 className="text-[20px] font-semibold mt-0 mb-[11px] mx-0">
                Choose your fullness
              </h3>
              <p className={`text-[#788177] max-w-[480px] m-0 ${typography.body}`}>
                Fullness affects how fabric gathers into soft folds. 2× is a
                common starting point; your heading style and fabric can change
                requirements.
              </p>
            </div>
          </div>
          <div className="flex bg-[#f0f1e9] mt-[18px] text-[#5d6d60] p-[18px] gap-[13px]">
            <Info size={19} />
            <p className="text-[11px] leading-[1.8] m-0">
              These measurements and prices are for planning only. A final quote
              needs fabric confirmation, heading, seams, lining, installation
              and on-site measurements.
            </p>
          </div>
        </div>
        <div className="bg-[#f4f2eb] h-[max-content] p-[42px] max-[681px]:mt-9 max-[681px]:py-[23px] max-[681px]:px-5">
          <div className="flex items-center pb-[30px] gap-[17px] border-b border-solid border-b-[#d9dacd]">
            <Calculator className="text-[#7b8878]" size={22} />
            <div>
              <span className="text-[9px] tracking-[1.8px] font-bold text-[#8b9086]">
                DCORHOME PLANNING TOOL
              </span>
              <h2 className={`mt-[7px] mb-0 mx-0 max-[681px]:text-[40px] ${typography.section}`}>
                Fabric estimate
              </h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4"><label className="text-[12px] text-muted">Units<select aria-label="Measurement units" value={unit} onChange={e=>{const next=e.target.value as 'cm'|'in';const factor=next==='in'?1/2.54:2.54;for(const [value,setter] of [[width,setWidth],[height,setHeight],[rollWidth,setRollWidth],[allowance,setAllowance],[repeat,setRepeat],[windowWidth,setWindowWidth],[windowHeight,setWindowHeight]] as const)setter(String(Math.round(Number(value)*factor*100)/100));setUnit(next);}} className="mt-2 h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3"><option value="cm">Centimeters</option><option value="in">Inches</option></select></label><label className="text-[12px] text-muted">Hanging position<select value={mount} onChange={e=>setMount(e.target.value)} className="mt-2 h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3"><option>Wall mounted</option><option>Ceiling mounted</option></select></label>{[['Window opening width',windowWidth,setWindowWidth],['Window opening height',windowHeight,setWindowHeight],['Fabric roll width',rollWidth,setRollWidth],['Panels per window',panels,setPanels],['Hem/header allowance',allowance,setAllowance],['Vertical pattern repeat',repeat,setRepeat]].map(([label,value,setter])=><label key={String(label)} className="text-[12px] text-muted">{String(label)}{label!=='Panels per window'&&` (${unit})`}<input type="number" min="0" step="any" value={String(value)} onChange={e=>(setter as (v:string)=>void)(e.target.value)} className="mt-2 h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3 text-[13px]"/></label>)}</div><p className="mt-4 text-[12px] leading-relaxed text-muted">Window opening: {windowWidth} ? {windowHeight} {unit}. Hanging position is recorded for your installer; enter the actual track width and finished drop below. No rail extensions are assumed automatically.</p>
          <div className="grid grid-cols-[1fr_1fr] gap-y-[23px] gap-x-4 my-7 mx-0 max-[681px]:gap-y-[18px] max-[681px]:gap-x-3 max-[381px]:grid-cols-[1fr]">
            <label className="block text-[11px] text-[#647163] font-bold">
              Track / rod width{" "}
              <small className="text-[9px] tracking-[1px] text-[#a0a59b]">
                ({unit})
              </small>
              <input
                className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3]"
                min="1"
                max="1500"
                step="any"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </label>
            <label className="block text-[11px] text-[#647163] font-bold">
              Finished drop{" "}
              <small className="text-[9px] tracking-[1px] text-[#a0a59b]">
                ({unit})
              </small>
              <input
                className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3]"
                min="1"
                max="750"
                step="any"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </label>
            <label className="block text-[11px] text-[#647163] font-bold">
              Number of windows
              <input
                className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3]"
                type="number"
                min="1"
                max="30"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </label>
            <label className="block text-[11px] text-[#647163] font-bold">
              Gather / fullness{" "}
              <div className="relative mt-2">
                <select
                  className="appearance-none w-full h-11 bg-[#fffefa] text-[#25342f] pr-8 pl-[13px] [outline:0] text-[12px] py-0 border border-solid border-[#d8dcd3]"
                  value={fullness}
                  onChange={(e) => setFullness(e.target.value)}
                >
                  <option value="1.5">Relaxed — 1.5×</option>
                  <option value="2">Classic — 2×</option>
                  <option value="2.5">Lush — 2.5×</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-[50%] [transform:translateY(-50%)] pointer-events-none text-[#798277]"
                  size={17}
                />
              </div>
            </label>
            <label className="[grid-column:1/-1] block text-[11px] text-[#647163] font-bold">
              Explore fabric{" "}
              <div className="relative mt-2">
                <select
                  className="appearance-none w-full h-11 bg-[#fffefa] text-[#25342f] pr-8 pl-[13px] [outline:0] text-[12px] py-0 border border-solid border-[#d8dcd3]"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.category}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-[50%] [transform:translateY(-50%)] pointer-events-none text-[#798277]"
                  size={17}
                />
              </div>
            </label>
          </div>
          <label className="mb-6 block text-[11px] font-medium text-muted">
            Your quoted fabric rate (INR/m, optional)
            <input
              className="mt-2 block h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3 text-[13px] text-ink"
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Enter a supplier quote to estimate cost"
            />
          </label>
          <div className="bg-[#e8e7db] mb-5 p-7 max-[681px]:p-[22px]">
            <span className="text-[9px] font-bold tracking-[1.6px] text-[#748174]">
              ESTIMATED FABRIC REQUIREMENT
            </span>
            <div className="font-sans font-medium text-[60px] leading-[1.2] mt-[9px]">
              {estimate ? `${estimate.meters} m` : "—"}
            </div>
            <div className="h-px bg-[#caccbf] my-[18px] mx-0" />
            <div className="flex items-center justify-between text-[12px] gap-3">
              <span>Fabric value at your entered rate</span>
              <strong className="text-[22px] font-medium">
                {estimate?.amount != null
                  ? formatINR(estimate.amount)
                  : "Rate on enquiry"}
              </strong>
            </div>
            <p className="text-[10px] leading-[1.7] text-[#7b8677] mt-[19px] mb-0 mx-0">
              Each panel uses a whole number of fabric widths. Cut drops include your hem/header allowance and round up to the entered vertical repeat. Seams, shrinkage, horizontal matching and waste may increase yardage. Preliminary planning only; verify before manufacturing.
            </p>
          </div>
          {estimate&&<p className="text-[12px] leading-relaxed text-muted">Finished width per panel (including fullness): {estimate.finishedPanelWidth.toFixed(1)} cm. Drop: {estimate.finishedDrop.toFixed(1)} cm. {estimate.drops} fabric drops per window, each {estimate.cutDrop.toFixed(1)} cm before installation.</p>}
          <Link
            href={`/contact?${new URLSearchParams({measurements:measurementSummary,interest:fabric})}`}
            className="group/measure1 inline-flex items-center justify-center min-h-14 text-[12px] tracking-[.35px] font-[650] transition-[transform,background,color] duration-250 ease-[ease] whitespace-nowrap text-[white] bg-ink w-full py-0 px-[25px] gap-7 border border-solid border-[transparent] hover:[transform:translateY(-2px)] hover:bg-[#40564a]"
          >
            Request a final consultation{" "}
            <ArrowUpRight
              className="transition-transform duration-250 ease-[ease] group-hover/measure1:[transform:translate(3px,-3px)]"
              size={18}
            />
          </Link>
        </div>
      </Container>
      <Container className="flex items-center justify-center pt-[35px] pb-[85px] text-[#79857a] text-[10px] font-[750] tracking-[1.3px] px-0 gap-[15px] border-t border-solid border-t-[#e2e2d9] max-[681px]:pt-0 max-[681px]:pb-[70px] max-[681px]:flex-wrap max-[681px]:text-center max-[681px]:gap-[13px]">
        <Scissors size={22} />
        <span>THE FINAL FIT DESERVES A HUMAN TOUCH.</span>
        <Link
          className="flex items-center underline [text-underline-offset:5px] text-ink gap-2"
          href="/contact"
        >
          Connect with us <ArrowUpRight size={16} />
        </Link>
      </Container>
    </>
  );
}
