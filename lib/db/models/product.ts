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
