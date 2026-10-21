import { typography } from "@/lib/typography";
import Image from "@/components/ui/Photograph";
import type { ReactNode } from "react";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
export default function PageIntro({
  eyebrow,
  title,
  description,
  image,
  alt,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image: string;
  alt: string;
}) {
  return (
    <section className="border-b border-solid border-[#dedbd2] bg-cream">
      <Container className="grid items-center gap-8 py-10 md:grid-cols-[1.2fr_.8fr] md:gap-16 md:py-14">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className={`mb-5 mt-5 ${typography.page}`}>
            {title}
          </h1>
          <p className={`mb-0 max-w-[490px] text-muted ${typography.body}`}>
            {description}
          </p>
        </div>
        <div className="relative h-[210px] overflow-hidden bg-sand md:h-[310px]">
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 767px) 100vw, 40vw"
            className="object-cover"
            priority
          />
        </div>
      </Container>
    </section>
  );
}
