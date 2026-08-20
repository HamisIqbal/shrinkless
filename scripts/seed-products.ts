import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/connection';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';

const SIZES = ['s', 'm', 'l', 'xl'];

const CATALOGUE = [
  { title: 'Field Shirt', slug: 'field-shirt', category: 'shirts', colors: ['sand', 'black'], priceCents: 8500 },
  { title: 'Shop Tee', slug: 'shop-tee', category: 'shirts', colors: ['bone'], priceCents: 4500 },
  { title: 'Press Overshirt', slug: 'press-overshirt', category: 'shirts', colors: ['navy', 'sand'], priceCents: 12500 },
];

async function main() {
  await connectToDatabase();

  await Variant.deleteMany({});
  await Product.deleteMany({});

  for (const entry of CATALOGUE) {
    const product = await Product.create({
      title: entry.title,
      slug: entry.slug,
      description: `${entry.title} — heavyweight cotton, cut for everyday wear.`,
      category: entry.category,
      status: 'published',
      optionSets: { sizes: SIZES, colors: entry.colors },
    });

    for (const color of entry.colors) {
      for (const size of SIZES) {
        await Variant.create({
          productId: product._id,
          size,
          color,
          sku: `${entry.slug.toUpperCase()}-${color.toUpperCase()}-${size.toUpperCase()}`,
          priceCents: entry.priceCents,
          stock: size === 'xl' ? 0 : 10,
        });
      }
    }

    console.log(`seeded ${entry.slug} (${entry.colors.length * SIZES.length} variants)`);
  }

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectFromDatabase();
  process.exit(1);
});
