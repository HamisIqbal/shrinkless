import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

/**
 * One storefront section whose height the admin has set.
 *
 * The same override pattern the media slots and the content slots use, and for
 * the same reason: a row exists only for a section that has actually been
 * changed, everything else falls through to the height the design gives it,
 * and "put it back" is a delete rather than a second copy of the original that
 * could drift.
 *
 * One height per section, not one per device. A section is a band across the
 * page and the admin edits it from whichever preview is to hand, so a phone
 * and a desk reading different numbers would be two settings pretending to be
 * one — see `HOME_SECTIONS` in `lib/services/site-media.ts`, which owns the
 * set of ids and where each one lands.
 */
const sectionLayoutSchema = new Schema(
  {
    sectionId: { type: String, required: true, unique: true, trim: true },
    /** Pixels. Bounded in `lib/validation/media.ts`, which is the only door in. */
    height: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export type SectionLayoutDoc = InferSchemaType<typeof sectionLayoutSchema>;

export const SectionLayout: Model<SectionLayoutDoc> =
  (models.SectionLayout as Model<SectionLayoutDoc>) ??
  model<SectionLayoutDoc>('SectionLayout', sectionLayoutSchema);
