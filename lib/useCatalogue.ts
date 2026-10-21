"use client";
import { useEffect,useState } from "react";
import { products,type CurtainProduct } from "./catalog";
export function useCatalogue(){const [items,setItems]=useState<CurtainProduct[]>(products);useEffect(()=>{let live=true;fetch('/api/catalogue').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(live&&Array.isArray(data.fabrics))setItems(data.fabrics);}).catch(()=>{});return()=>{live=false;};},[]);return items;}
