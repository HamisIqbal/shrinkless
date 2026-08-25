import { connectToDatabase, disconnectFromDatabase } from '@/lib/db/connection';
import { Product } from '@/lib/db/models/product';
import { Variant } from '@/lib/db/models/variant';

/**
 * Puts the two card flags onto an already-seeded catalogue.
 *
 * `seed:shrinkless` sets both, but it starts by deleting every product and
 * variant in the database — which is right for a fresh environment and wrong
 * for one with carts and orders in it. This script only writes the two fields
 * the flags read, so it is safe to run against a live store, and running it
 * twice does the same thing as running it once.
 *
 *   npm run demo:flags          apply
 *   npm run demo:flags -- undo  put both back
 *
 * What it changes:
 *   mens-long-sleeve-tee   badge -> 'new'   (draws "New arrival")
 *   womens-boxy-tee        stock -> 0       (draws "Sold out")
 *
 * The undo restores stock to STOCK_LEVEL, which is what the seed writes. If
 * the real stock for that style was ever something else, set it in the admin
 * rather than here.
 */

const NEW_ARRIVAL = 'mens-long-sleeve-tee';
const SOLD_OUT = 'womens-boxy-tee';

/** Matches the seed. */
const STOCK_LEVEL = 18;

async function idFor(slug: string) {
  const product = await Product.findOne({ slug }).select('_id').lean();
  if (!product) throw new Error(`No product with slug "${slug}" — seed the catalogue first`);
  return product._id;
}

async function main() {
  const undo = process.argv.includes('undo');

  await connectToDatabase();

  const badge = undo ? 'none' : 'new';
  await Product.updateOne({ slug: NEW_ARRIVAL }, { $set: { badge } });
  console.log(`  ${NEW_ARRIVAL.padEnd(24)} badge -> ${badge}`);

  const soldOutId = await idFor(SOLD_OUT);
  const stock = undo ? STOCK_LEVEL : 0;
  const result = await Variant.updateMany({ productId: soldOutId }, { $set: { stock } });
  console.log(`  ${SOLD_OUT.padEnd(24)} stock -> ${stock} on ${result.modifiedCount} variants`);

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectFromDatabase();
  process.exit(1);
});
