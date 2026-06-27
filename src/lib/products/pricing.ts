import { computePackagingPrice } from "@/lib/utils/money";

type PackagingPricing = {
  quantity: number;
  optionalPrice: number | null;
};

export function getEffectiveUnitPrice(
  productUnitPrice: number,
  variantUnitPrice?: number | null,
): number {
  return variantUnitPrice ?? productUnitPrice;
}

export function getPackagingSellPrice(
  productUnitPrice: number,
  packaging: PackagingPricing,
  variantUnitPrice?: number | null,
): number {
  return computePackagingPrice(
    getEffectiveUnitPrice(productUnitPrice, variantUnitPrice),
    packaging.quantity,
    packaging.optionalPrice,
  );
}
