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
