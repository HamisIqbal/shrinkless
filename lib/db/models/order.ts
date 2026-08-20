import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

export const ORDER_STATUSES = [
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed',
] as const;

const orderItemSchema = new Schema(
  {
    title: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    sku: { type: String, required: true },
    unitPriceCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imagePublicId: { type: String, default: '' },
  },
  { _id: false },
);

const statusEventSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    actor: { type: String, default: 'system' },
    at: { type: Date, default: () => new Date() },
    note: { type: String, default: '' },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'US' },
    phone: { type: String, default: '' },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotalCents: { type: Number, required: true, min: 0 },
    shippingCents: { type: Number, required: true, min: 0 },
    taxCents: { type: Number, required: true, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: { type: [statusEventSchema], default: [] },
    trackingNumber: { type: String, default: '' },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) ?? model<OrderDoc>('Order', orderSchema);
