const ivory=['Soft Ivory','Ivory'];
const white=['Pure White','White','Soft White'];
const beige=['Golden Beige','Light Beige','Warm Beige','Beige'];
const grey=['Light Grey','Pale Grey','Warm Grey'];
const cream=['Cream','Warm Cream','Warm White','Soft White'];
const sand=['Light Sand','Sand','Warm Beige','Light Beige'];
const champagne=['Champagne Gold','Champagne'];
export const studioSheerShadeNames:Readonly<Record<string,string>>={
 'pure-white':'Pure White',
 'soft-ivory':'Soft Ivory',
 champagne:'Champagne Gold',
 'light-beige':'Golden Beige',
 blush:'Blush Pink',
 'sage-green':'Sage Green',
 'pale-blue':'Sky Blue',
 lavender:'Lavender',
 'warm-grey':'Warm Grey',
 cream:'Cream',
 sand:'Light Sand',
};
export const lavenderSheerHex='#cec0e3';
const palettes=[
 {family:/burgundy|wine|maroon/i,shades:[beige,champagne,ivory]},
 {family:/navy|blue|slate|charcoal/i,shades:[white,ivory,grey]},
 {family:/olive|green|sage/i,shades:[cream,sand,champagne]},
 {family:/mocha|brown|taupe/i,shades:[beige,ivory,cream]},
];

export function recommendedSheerColors<T extends {name:string;disabled?:boolean;available?:boolean|null}>(
 colors:T[],
 mainShade?:string,
):T[]{
 if(!mainShade)return [];
 const shades=palettes.find(({family})=>family.test(mainShade))?.shades??[ivory,champagne,white];
 const available=colors.filter(color=>!color.disabled&&color.available!==false);
 const recommended:T[]=[];
 for(const alternatives of shades){
  for(const name of alternatives){
   const color=available.find(color=>color.name.toLowerCase()===name.toLowerCase()&&!recommended.includes(color));
   if(color){recommended.push(color);break;}
  }
 }
 return recommended;
}
