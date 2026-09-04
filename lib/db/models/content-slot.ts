import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * One piece of storefront copy the admin has changed.
 *
 * The same shape the media slots use, and for the same reason: rows exist only
 * for fields that have actually been overridden, and everything else falls
 * through to the defaults declared in `lib/services/site-content.ts`. A fresh
 * database renders the site exactly as it ships, and "restore original" is a
 * delete rather than a second copy of the shipped wording that could drift.
 *
 * The set of keys is a property of the pages, not of this collection — the
 * registry in the service owns it and refuses anything outside it. That is
 * what stops a form inventing a field the site never renders.
 */
const contentSlotSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    /** Not trimmed: a paragraph's leading or trailing space is the admin's to
     *  decide, and the registry bounds the length instead. */
    value: { type: String, required: true },
  },
  { timestamps: true },
);

export type ContentSlotDoc = InferSchemaType<typeof contentSlotSchema>;

export const ContentSlot: Model<ContentSlotDoc> =
  (models.ContentSlot as Model<ContentSlotDoc>) ??
  model<ContentSlotDoc>('ContentSlot', contentSlotSchema);
