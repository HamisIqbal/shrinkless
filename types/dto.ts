export type ImageDTO = {
  publicId: string;
  width: number;
  height: number;
  alt: string;
};

export type VariantDTO = {
  id: string;
  size: string;
  color: string;
  sku: string;
  priceCents: number;
  stock: number;
  inStock: boolean;
  enabled: boolean;
};

export type ProductDTO = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'draft' | 'published';
  featured: boolean;
  /** Editorial flag drawn on the card. Sold out is derived from stock. */
  badge: 'none' | 'new';
  images: ImageDTO[];
  sizes: string[];
  colors: string[];
  variants: VariantDTO[];
  minPriceCents: number;
};

export type CartLineDTO = {
  variantId: string;
  productTitle: string;
  productSlug: string;
  size: string;
  color: string;
  imagePublicId: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  availableStock: number;
};

export type CartViewDTO = {
  id: string;
  lines: CartLineDTO[];
  subtotalCents: number;
  itemCount: number;
};

export type AdminProductRowDTO = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  featured: boolean;
  imagePublicId: string;
  variantCount: number;
  totalStock: number;
};

export type SettingsDTO = {
  storeEmail: string;
  announcement: string;
  shippingZones: { name: string; states: string[]; rateCents: number }[];
  freeShippingThresholdCents: number | null;
  taxMode: 'none' | 'flat' | 'stripe';
  flatTaxRateBasisPoints: number;
};

export type OrderStatus =
  | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';

export type ShippingAddressDTO = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type OrderItemDTO = {
  title: string;
  size: string;
  color: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imagePublicId: string;
};

export type StatusEventDTO = {
  status: OrderStatus;
  actor: string;
  at: string;
  note: string;
};

export type OrderRowDTO = {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  totalCents: number;
  itemCount: number;
  createdAt: string;
};

export type OrderDTO = OrderRowDTO & {
  userId: string | null;
  items: OrderItemDTO[];
  shippingAddress: ShippingAddressDTO;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  trackingNumber: string;
  statusHistory: StatusEventDTO[];
};

export type CustomerRowDTO = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: string;
  orderCount: number;
  lifetimeCents: number;
};

export type LowStockRowDTO = {
  sku: string;
  title: string;
  size: string;
  color: string;
  stock: number;
};

export type AdminStatsDTO = {
  ordersToday: number;
  revenueWeekCents: number;
  lowStock: LowStockRowDTO[];
};
