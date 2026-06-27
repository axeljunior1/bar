export type SellablePackaging = {
  id: string;
  typeName: string;
  quantity: number;
  optionalPrice: number | null;
};

export type SellableVariant = {
  id: string;
  size: string | null;
  color: string | null;
  unitPrice: number | null;
};

export type SellableProduct = {
  id: string;
  name: string;
  categoryId: string;
  unitPrice: number;
  variants: SellableVariant[];
  packagings: SellablePackaging[];
};

export type SellableCategory = {
  id: string;
  name: string;
};

export type SlateLineItem = {
  id: string;
  productPackagingId: string;
  productVariantId: string | null;
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
  packagingName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PaymentMethodOption = {
  id: string;
  name: string;
};
