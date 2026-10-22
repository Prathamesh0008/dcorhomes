"use client";
import { createContext, useContext } from 'react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { fabrics } from '@/lib/curtains/manual-config';
const Context=createContext<FabricRecord[]>(fabrics);
const WhatsAppContext=createContext<string|undefined>(undefined);
export function useShowroomWhatsApp(){return useContext(WhatsAppContext);}
export function useFabricRecords(){return useContext(Context);}
export default function FabricCatalogueProvider({records,children,whatsappNumber}:{records:FabricRecord[];children:React.ReactNode;whatsappNumber?:string}) {return <Context.Provider value={records}><WhatsAppContext.Provider value={whatsappNumber}>{children}</WhatsAppContext.Provider></Context.Provider>;}
