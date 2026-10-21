"use client";
import { useEffect,useState } from "react";
import { designOptions } from "./design-options";
export function useDesignOptions(){const [options,setOptions]=useState(designOptions);useEffect(()=>{let live=true;fetch('/api/options').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(live&&Object.keys(designOptions).every(key=>Array.isArray(data[key])&&data[key].length))setOptions(data);}).catch(()=>{});return()=>{live=false;};},[]);return options;}
