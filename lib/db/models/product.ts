import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const imageSchema = new Schema(
  {
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    alt: { type: String, default: '' },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    // Editorially chosen, not computed. The store has no sales history to rank
    // by, so "featured" is something an admin decides rather than something a
    // best-seller query invents.
    featured: { type: Boolean, default: false, index: true },
    // Editorial, like `featured`, and for the same reason: "new" is a decision
    // about what to promote, not a fact about a timestamp. Every product in a
    // freshly seeded catalogue was created in the same second, so deriving
    // this from `createdAt` would either badge all of them or none.
    badge: { type: String, enum: ['none', 'new'], default: 'none' },
    // Out of 5, to one decimal. Zero means "not rated yet" and draws nothing,
    // which is the honest state for a product nobody has reviewed — a card
    // showing 0.0 would read as a terrible rating rather than as no rating.
    // There is no review collection yet; this is the number an admin sets.
    rating: { type: Number, default: 0, min: 0, max: 5 },
    images: { type: [imageSchema], default: [] },
    optionSets: {
      sizes: { type: [String], default: [] },
      colors: { type: [String], default: [] },
    },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ?? model<ProductDoc>('Product', productSchema);
