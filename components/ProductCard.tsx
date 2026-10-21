"use client";
import { typography } from "@/lib/typography";
import Image from "@/components/ui/Photograph";
import Link from "next/link";
import { Heart, ArrowUpRight } from "lucide-react";
import { useState,useEffect } from "react";
import type { CurtainProduct } from "@/lib/catalog";
export default function ProductCard({
  product,
}: {
  product: CurtainProduct;
  index?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{try{setLiked(JSON.parse(localStorage.getItem('dcorhome-fabrics')||'[]').includes(product.id));}catch{}},[product.id]);
  function toggleFavorite(){try{const current:string[]=JSON.parse(localStorage.getItem('dcorhome-fabrics')||'[]');localStorage.setItem('dcorhome-fabrics',JSON.stringify(liked?current.filter(id=>id!==product.id):[...new Set([...current,product.id])]));setLiked(!liked);window.dispatchEvent(new Event('dcorhome-favorites'));}catch{setNotice('Browser storage is unavailable.');}}
  return (
    <article className="group/product min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Link
          href={`/collections/${product.id}`}
          className="block h-full"
          aria-label={`View ${product.name} details`}
        >
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 680px) 85vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-opacity duration-300 group-hover/product:opacity-90"
          />
        </Link>
        <button
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center border border-solid border-[#e5e0d5] bg-paper text-ink transition-colors hover:bg-cream aria-pressed:text-[#986c55]"
          aria-pressed={liked}
          type="button"
          aria-label={liked ? `Unsave ${product.name}` : `Save ${product.name}`}
          onClick={toggleFavorite}
        >
          <Heart
            size={16}
            strokeWidth={1.3}
            fill={liked ? "currentColor" : "none"}
          />
        </button>
      </div>
      {notice&&<p role="status" className="mt-2 text-[12px] text-muted">{notice}</p>}
      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <span className="text-[9px] uppercase tracking-[1.8px] text-muted">
            {product.category}
          </span>
          <h3 className={`mb-2 mt-2 ${typography.card}`}>
            {product.name}
          </h3>
        </div>
        <Link
          className="grid h-11 w-11 shrink-0 place-items-center"
          href={`/studio?fabric=${product.id}`}
          aria-label={`Visualize ${product.name}`}
        >
          <ArrowUpRight size={19} strokeWidth={1.2} />
        </Link>
      </div>
      <p className={`mb-3 text-muted ${typography.body}`}>
        {product.subtitle}
      </p>
      <p className="mb-0 border-t border-solid border-[#dedbd2] pt-3 text-[10px] leading-[1.6] text-[#7c8075]">
        {product.imageNote}. Photography for inspiration; request current
        samples and pricing.
      </p>
    </article>
  );
}
