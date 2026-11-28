import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import HomeFabricCollectionList from './HomeFabricCollectionList';
import styles from './HomeFabricCollection.module.css';

const fabrics = [
  {
    name: 'Sheer Fabric',
    image: '/images/2.png',
    imagePosition: '50% 18%',
    alt: 'DCOR HOME sheer fabric poster with softly lit cream folds',
    description: 'Bring soft natural light into your home with sheer curtain fabrics. Explore colours, textures and designs that make windows feel elegant and rooms welcoming.',
    label: 'Explore Sheer',
    href: '/collections?category=sheer',
  },
  {
    name: 'Linen Fabric',
    image: '/images/3.png',
    imagePosition: '50% 19%',
    alt: 'DCOR HOME linen fabric poster with natural beige folds',
    description: 'Give your windows a fresh, natural look with linen curtain fabrics. Discover relaxed textures and colours for modern and traditional interiors.',
    label: 'Explore Linen',
    href: '/collections?category=linen',
  },
  {
    name: 'Silk Fabric',
    image: '/images/4.png',
    imagePosition: '50% 5%',
    alt: 'DCOR HOME silk fabric poster with lustrous burgundy folds',
    description: 'Add a touch of elegance with silk curtain fabric. Its soft sheen and graceful drape bring a refined finish to your windows.',
    label: 'Explore Silk',
    href: '/collections?category=silk',
  },
  {
    name: 'Textured Fabric',
    image: '/images/11.png',
    imagePosition: '50% 1%',
    alt: 'DCOR HOME textured fabric poster with a close-up of a brown weave',
    description: 'Bring depth and character to your interiors with distinctive weaves, subtle patterns and colours for curtains and soft furnishings.',
    label: 'Explore Textured',
    href: '/collections?category=textured',
  },
  {
    name: 'Velvet Fabric',
    image: '/images/6.png',
    imagePosition: '50% 4%',
    alt: 'DCOR HOME velvet fabric poster with plush forest-green folds',
    description: 'Discover the rich colour and plush texture of velvet. Explore a statement fabric that brings warmth and depth to your space.',
    label: 'Explore Velvet',
    href: '/collections?category=velvet',
  },
  {
    name: 'Other Curtain Fabrics',
    image: '/images/7.png',
    imagePosition: '50% 0%',
    alt: 'DCOR HOME other curtain fabrics poster with layered colours and patterns',
    description: 'Find more ways to style your windows with our range of curtain fabrics. Explore patterns, colours and finishes for your home or commercial space.',
    label: 'Explore More',
    href: '/collections',
  },
];

const imageSizes = '(max-width: 572px) 252px, (max-width: 639px) calc(50vw - 34px), (max-width: 744px) 220px, (max-width: 1023px) 29vw, (max-width: 1557px) 296px, (max-width: 1684px) 19vw, 320px';

export default function HomeFabricCollection() {
  return (
    <section className={styles.section} aria-labelledby="home-fabric-collections">
      <Container className={styles.container}>
        <h2 id="home-fabric-collections" className={styles.heading}>
          Our Curtain Fabric Collections
        </h2>
        <HomeFabricCollectionList>
          {fabrics.map(fabric => (
            <li key={fabric.href} className={styles.card}>
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e7ddcd]">
                <Image
                  className={styles.image}
                  src={fabric.image}
                  alt={fabric.alt}
                  fill
                  sizes={imageSizes}
                  style={{ objectPosition: fabric.imagePosition }}
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="m-0 font-serif text-[20px] leading-tight font-semibold">{fabric.name}</h3>
                <p className={styles.description}>{fabric.description}</p>
                <div className={styles.actions}>
                  <Link
                    className={styles.explore}
                    href={fabric.href}
                    aria-label={fabric.href === '/collections' ? 'Explore More Curtain Fabrics' : undefined}
                  >
                    {fabric.label}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </HomeFabricCollectionList>
      </Container>
    </section>
  );
}
