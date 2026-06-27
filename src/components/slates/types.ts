export type SellablePackaging = {
  id: string;
  typeName: string;
  quantity: number;
  price: number;
};

export type SellableProduct = {
  id: string;
  name: string;
  categoryId: string;
  packagings: SellablePackaging[];
};

export type SellableCategory = {
  id: string;
  name: string;
};

export type SlateLineItem = {
  id: string;
  productName: string;
  packagingName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PaymentMethodOption = {
  id: string;
  name: string;
};
