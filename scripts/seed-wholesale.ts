import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/connection';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import { WHOLESALE_CATALOGUE, WHOLESALE_TAG } from '@/lib/wholesale/catalogue';

/**
 * Puts the ten wholesale styles into the catalogue.
 *
 * Unlike `seed:shrinkless`, this deletes nothing. It is an INSERT-ONLY script:
 * a style that already exists is left exactly as it is, including its
 * category. That matters more than it sounds — the genders below are a
 * placeholder split that the store owner is expected to correct in the
 * product editor, and a seed that reset them on every run would quietly undo
 * that work the next time anyone ran it.
 *
 * Each style is built from a retail product that must already be in the
 * database: copy, photography, colourways, sizes and the price the wholesale
 * ladder is struck from all come from there. Seed the retail catalogue first.
 *
 *   npm run dev:db          # in its own terminal, if Atlas is unreachable
 *   npm run seed:shrinkless
 *   npm run seed:wholesale
 */

function skuFor(slug: string, color: string, size: string): string {
  return `SL-WS-${slug.replace(/^wholesale-/, '')}-${color}-${size}`.toUpperCase();
}

async function main() {
  await connectToDatabase();

  const sourceSlugs = [...new Set(WHOLESALE_CATALOGUE.map((entry) => entry.source))];
  const sources = await Product.find({ slug: { $in: sourceSlugs } }).lean();
  const bySlug = new Map(sources.map((product) => [product.slug, product]));

  const missing = sourceSlugs.filter((slug) => !bySlug.has(slug));

  if (missing.length) {
    throw new Error(
      `The retail catalogue is missing ${missing.join(', ')}. ` +
        'Run `npm run seed:shrinkless` first — wholesale styles are built from it.',
    );
  }

  // One query for every source's variants rather than one per style.
  const sourceVariants = await Variant.find({
    productId: { $in: sources.map((product) => product._id) },
  }).lean();

  const priceBySource = new Map<string, number>();

  for (const variant of sourceVariants) {
    if (!variant.enabled) continue;

    const key = String(variant.productId);
    const lowest = priceBySource.get(key);
    if (lowest === undefined || variant.priceCents < lowest) {
      priceBySource.set(key, variant.priceCents);
    }
  }

  let created = 0;
  let skipped = 0;
  let variantCount = 0;

  for (const entry of WHOLESALE_CATALOGUE) {
    // Checked above.
    const source = bySlug.get(entry.source)!;
    const priceCents = priceBySource.get(String(source._id)) ?? 0;

    const existing = await Product.findOne({ slug: entry.slug });

    if (existing) {
      skipped += 1;
      console.log(`  skip    ${entry.slug.padEnd(28)} already in the catalogue`);
      continue;
    }

    const colors = source.optionSets?.colors ?? [];
    const sizes = source.optionSets?.sizes ?? [];

    const product = await Product.create({
      title: entry.title,
      slug: entry.slug,
      description: source.description,
      category: entry.category,
      status: 'published',
      // The tag is load-bearing: it is what keeps these off the retail
      // storefront. See `lib/services/products.ts`.
      tags: [WHOLESALE_TAG],
      images: source.images,
      optionSets: { sizes, colors },
      // Wholesale is made to order and quoted by the tier, so the retail
      // quantity rule means nothing here. Left at its default rather than
      // set to a tier, because nothing prices a wholesale style through it.
      seo: {
        title: `${entry.title} — Wholesale`,
        description: `Trade pricing for the ${entry.title}, from 150 units.`,
      },
    });

    for (const color of colors) {
      for (const size of sizes) {
        await Variant.create({
          productId: product._id,
          size,
          color,
          sku: skuFor(entry.slug, color, size),
          priceCents,
          // Made to order: there is no shelf to draw down, and nothing on the
          // wholesale page consults stock. Zero is the honest figure.
          stock: 0,
        });
        variantCount += 1;
      }
    }

    created += 1;
    console.log(
      `  create  ${entry.slug.padEnd(28)} ${entry.category.padEnd(5)} ` +
        `${colors.length}x${sizes.length} @ $${(priceCents / 100).toFixed(2)} retail basis`,
    );
  }

  console.log(
    `\n${created} wholesale styles created (${variantCount} variants), ${skipped} left alone`,
  );

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await disconnectFromDatabase().catch(() => {});
  process.exit(1);
});
