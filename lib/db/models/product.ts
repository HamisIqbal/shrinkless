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
