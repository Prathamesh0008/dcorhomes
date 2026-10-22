"use client";
import {useFabricRecords} from '@/components/curtains/FabricCatalogueProvider';
import {readManual,manualSummary} from '@/lib/curtains/manual-config';
import type {ComponentProps} from 'react';
export default function HomeEnquiryLink({children,...props}:ComponentProps<'a'>){const records=useFabricRecords();function update(link:HTMLAnchorElement){const config=readManual(undefined,records);link.href=`/contact?${new URLSearchParams({interest:'Curtain consultation',room:config.room,message:manualSummary(config,records)})}`;}return <a {...props} data-combination-enquiry href="/contact?interest=Curtain%20consultation" onPointerEnter={e=>update(e.currentTarget)} onFocus={e=>update(e.currentTarget)} onClick={e=>update(e.currentTarget)}>{children}</a>;}
