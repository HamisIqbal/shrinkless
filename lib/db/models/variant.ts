import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const variantSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: String, required: true, lowercase: true, trim: true },
    color: { type: String, required: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

variantSchema.index({ productId: 1, size: 1, color: 1 }, { unique: true });

export type VariantDoc = InferSchemaType<typeof variantSchema>;

export const Variant: Model<VariantDoc> =
  (models.Variant as Model<VariantDoc>) ?? model<VariantDoc>('Variant', variantSchema);
