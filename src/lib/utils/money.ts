export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function computePackagingPrice(
  unitPrice: number,
  quantity: number,
  optionalPrice: number | null,
): number {
  return optionalPrice ?? unitPrice * quantity;
}
