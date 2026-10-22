import type { ReactNode } from 'react';
export const homeHeading='font-sans text-[34px] font-medium leading-[1.1] tracking-[-1.2px] md:text-[48px]';
export const homeEyebrow='mb-4 text-[12px] font-medium uppercase tracking-[2.2px] text-[#927759]';
export const homeAccent='font-serif font-normal text-[#927759]';
export function HomeHeading({children,id,className=''}:{children:ReactNode;id?:string;className?:string}){return <h2 id={id} className={`${homeHeading} ${className}`}>{children}</h2>;}
