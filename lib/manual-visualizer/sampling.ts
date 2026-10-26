// Resolution-independent cloth sampling. No generated geometry or paid services.
export const linear = (value:number) => {const n=value/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);};
export const srgb = (value:number) => Math.round(255*(value<=.0031308?12.92*value:1.055*Math.pow(value,1/2.4)-.055));
export const clamp = (value:number,min=0,max=1) => Math.min(max,Math.max(min,value));

// Mirrored repeats meet at the same edge pixel, avoiding the old wrap seam.
export function mirroredCoordinate(value:number,size=256){
 const period=2*size,position=((Math.floor(value)%period)+period)%period;
 return position<size?position:period-position-1;
}

// A local average removes lighting baked into an illustrated swatch. Its fine
// structure can then be lit by the actual neutral drape instead of fighting it.
export function textileLuminance(rgba:Uint8ClampedArray,size=256){
 const stride=size+1,integral=new Float64Array(stride*stride),light=new Float32Array(size*size);
 for(let y=0;y<size;y++){
  let row=0;
  for(let x=0;x<size;x++){
   const i=(y*size+x)*4,lum=.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];
   light[y*size+x]=lum;row+=lum;integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;
  }
 }
 const detail=new Float32Array(size*size),radius=12;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const x0=Math.max(0,x-radius),x1=Math.min(size,x+radius+1),y0=Math.max(0,y-radius),y1=Math.min(size,y+radius+1);
  const mean=(integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0])/((x1-x0)*(y1-y0));
  detail[y*size+x]=clamp(light[y*size+x]/Math.max(8,mean),.45,1.55);
 }
 return detail;
}

export function clothLighting(fold:number,sheen:number){
 const value=clamp(fold),diffuse=.10+.90*Math.pow(value,1.7);
 return diffuse+sheen*Math.pow(clamp((value-.58)/.42),3)*.18;
}
