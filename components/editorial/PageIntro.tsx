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
      <Container className="grid items-center gap-8 py-10 md:grid-cols-[1fr_1fr] md:gap-12 md:py-14 lg:gap-20 lg:py-16">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className={`mb-5 mt-5 ${typography.page}`}>
            {title}
          </h1>
          <p className={`mb-0 max-w-[490px] text-[#626b62] ${typography.body}`}>
            {description}
          </p>
        </div>
        <div className="relative h-[260px] overflow-hidden rounded-t-[100px] bg-sand sm:h-[340px] md:h-[380px] md:rounded-t-[160px]">
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
