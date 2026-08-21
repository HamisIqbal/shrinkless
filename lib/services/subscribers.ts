import { connectToDatabase } from '@/lib/db/connection';
import { Subscriber } from '@/lib/db/models/subscriber';

/**
 * The footer sign-up actually stores the address. A newsletter field that
 * quietly discards what people type is worse than no field at all.
 */
export async function subscribe(email: string, source = 'footer'): Promise<void> {
  await connectToDatabase();

  // Signing up twice is not an error the visitor should ever see.
  await Subscriber.updateOne(
    { email },
    { $setOnInsert: { email, source } },
    { upsert: true },
  );
}

export async function countSubscribers(): Promise<number> {
  await connectToDatabase();
  return Subscriber.countDocuments({});
}
