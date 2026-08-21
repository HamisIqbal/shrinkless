import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/connection';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';
import { PRODUCT_IMAGES } from '@/lib/brand/images';

/**
 * The Shrinkless catalogue: one product, made extremely well.
 *
 * Three colourways x five sizes. Product images are stored as absolute URLs
 * rather than Cloudinary public IDs — `lib/images.ts` passes those through
 * untouched, so real uploads replace them without a code change.
 *
 * PRICE IS AN ASSUMPTION (spec §11.1). Overwrite PRICE_CENTS with the real one.
 */

const PRICE_CENTS = 4800;
const SIZES = ['s', 'm', 'l', 'xl', 'xxl'];
const COLORS = ['black', 'white', 'charcoal'];

const DESCRIPTION =
  'Garment dyed organic cotton, cut for everyday wear and built to hold its ' +
  'shape wash after wash. Made in USA.';

// Not every size of every colour is in stock — a catalogue that is uniformly
// available is a catalogue nobody believes.
const OUT_OF_STOCK = new Set(['white:xxl', 'charcoal:s']);

async function main() {
  await connectToDatabase();

  await Variant.deleteMany({});
  await Product.deleteMany({});

  const product = await Product.create({
    title: 'Organic Tee',
    slug: 'organic-tee',
    description: DESCRIPTION,
    category: 'tees',
    status: 'published',
    images: COLORS.map((color) => ({
      publicId: PRODUCT_IMAGES[color].url,
      width: 1400,
      height: 1750,
      alt: PRODUCT_IMAGES[color].alt,
    })),
    optionSets: { sizes: SIZES, colors: COLORS },
  });

  for (const color of COLORS) {
    for (const size of SIZES) {
      await Variant.create({
        productId: product._id,
        size,
        color,
        sku: `SL-TEE-${color.toUpperCase()}-${size.toUpperCase()}`,
        priceCents: PRICE_CENTS,
        stock: OUT_OF_STOCK.has(`${color}:${size}`) ? 0 : 24,
      });
    }
  }

  console.log(
    `seeded organic-tee — ${COLORS.length} colourways x ${SIZES.length} sizes ` +
      `= ${COLORS.length * SIZES.length} variants at $${(PRICE_CENTS / 100).toFixed(2)}`,
  );

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectFromDatabase();
  process.exit(1);
});
