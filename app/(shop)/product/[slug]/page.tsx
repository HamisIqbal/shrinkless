import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublishedProductBySlug } from '@/lib/services/products';
import { imageUrl } from '@/lib/images';
import { VariantPicker } from '@/components/shop/VariantPicker';

// Native <details> so the accordions work without JavaScript and are keyboard
// accessible by default. Factual claims are [TBC] until confirmed — spec §11.2.
const SECTIONS = [
  {
    title: "Why it doesn't shrink",
    body:
      'The fabric is pre-shrunk and the finished garment is dyed at temperature ' +
      'before it is ever sold, so the shrinking happens in our facility rather ' +
      'than in your machine. Expected residual shrinkage: [TBC]%.',
  },
  {
    title: 'Fabric & construction',
    body:
      '[TBC]oz organic cotton, [TBC] knit, with a ribbed collar and ' +
      'shoulder-to-shoulder taping. Certification: [TBC].',
  },
  {
    title: 'Made in USA',
    body:
      'Cut and sewn in the United States. Mill and factory locations: [TBC].',
  },
  {
    title: 'Care',
    body:
      'Machine wash cold with like colours, tumble dry low. Garment dyed cotton ' +
      'keeps its character best out of high heat. Full care instructions: [TBC].',
  },
  {
    title: 'Shipping & returns',
    body:
      'Shipping options and delivery estimates: [TBC]. Returns accepted within ' +
      '[TBC] days on unworn items.',
  },
];

export default async function ProductPage(props: PageProps<'/product/[slug]'>) {
  const [{ slug }, search] = await Promise.all([props.params, props.searchParams]);
  const product = await getPublishedProductBySlug(slug);

  if (!product) notFound();

  const requestedColor = typeof search?.color === 'string' ? search.color : undefined;

  // Lead with the colourway the visitor clicked, if they clicked one.
  const gallery = [...product.images].sort((a, b) => {
    if (!requestedColor) return 0;
    const aMatch = a.alt.toLowerCase().includes(requestedColor.toLowerCase()) ? -1 : 0;
    const bMatch = b.alt.toLowerCase().includes(requestedColor.toLowerCase()) ? -1 : 0;
    return aMatch - bMatch;
  });

  return (
    <article className="band band--tight pdp">
      <div className="wrap pdp__grid">
        <div className="pdp__gallery">
          {gallery.length ? (
            gallery.map((image, index) => (
              <div key={image.publicId} className="frame frame--45 pdp__shot">
                <Image
                  src={imageUrl(image.publicId, 'c_fill,w_1200,h_1500,q_auto,f_auto')}
                  alt={image.alt || product.title}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 56.25rem) 55vw, 100vw"
                />
              </div>
            ))
          ) : (
            <div className="frame frame--45 pdp__shot" aria-hidden="true" />
          )}
        </div>

        <div className="pdp__info">
          <div className="pdp__sticky">
            <p className="eyebrow">Shrinkless</p>
            <h1 className="head pdp__title">{product.title}</h1>

            <VariantPicker
              sizes={product.sizes}
              colors={product.colors}
              variants={product.variants}
              initialColor={requestedColor}
            />

            {product.description ? (
              <p className="pdp__description">{product.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="wrap pdp__detail">
        <ul className="accordion">
          {SECTIONS.map((section) => (
            <li key={section.title}>
              <details className="accordion__item">
                <summary className="accordion__summary">
                  <span>{section.title}</span>
                  <span className="accordion__mark" aria-hidden="true" />
                </summary>
                <p className="accordion__body">{section.body}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
