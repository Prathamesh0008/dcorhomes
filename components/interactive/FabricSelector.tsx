"use client";
import { typography } from "@/lib/typography";
import Image from "@/components/ui/Photograph";
import { useState } from "react";
import { products } from "@/lib/catalog";
import ActionLink from "@/components/ui/ActionLink";
const choices = [
  products[0],
  products[1],
  products[2],
  products[4],
  products[3],
  products[6],
];
export default function FabricSelector() {
  const [selected, setSelected] = useState(1);
  const fabric = choices[selected];
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
      <div
        className="relative aspect-[5/4] overflow-hidden bg-sand lg:aspect-[4/5]"
        data-testid="fabric-photo"
      >
        <Image
          key={fabric.image}
          src={fabric.image}
          alt={fabric.imageAlt}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <div
          role="group"
          aria-label="Explore fabric types"
          data-testid="fabric-choices"
          className="grid grid-cols-2 gap-x-6 border-t border-solid border-[#d8d5cb]"
        >
          {choices.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              className="flex min-h-16 items-center justify-between gap-3 border-b border-solid border-[#d8d5cb] bg-transparent px-0 text-left text-[13px] text-muted transition-colors hover:text-ink aria-pressed:text-ink"
            >
              <span>{item.category}</span>
              <span aria-hidden="true" className="text-[16px]">
                {selected === i ? "−" : "+"}
              </span>
            </button>
          ))}
        </div>
        <div aria-live="polite" data-testid="fabric-detail" className="pt-10">
          <span className="text-[9px] uppercase tracking-[2px] text-[#97836b]">
            The material edit
          </span>
          <h3 className={`mb-5 mt-4 ${typography.card}`}>
            {fabric.name}
          </h3>
          <p className={`max-w-[370px] text-muted ${typography.body}`}>
            {fabric.description}
          </p>
          <ActionLink
            href={`/studio?fabric=${fabric.id}`}
            variant="text"
            className="mt-3"
          >
            Explore this direction
          </ActionLink>
          <p className="mb-0 mt-7 max-w-[350px] text-[10px] leading-[1.8] text-muted">
            {fabric.imageNote}. Reference photography, not a product sample.
            Confirm composition, color and light performance with us.
          </p>
        </div>
      </div>
    </div>
  );
}
