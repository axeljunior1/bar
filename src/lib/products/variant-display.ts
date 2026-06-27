type VariantParts = {
  variantSize: string | null;
  variantColor: string | null;
};

export function formatVariantLabel(
  size: string | null | undefined,
  color: string | null | undefined,
): string | null {
  const parts = [color, size]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(" · ") : null;
}

export function getSlateLinePrimaryLabel(
  line: VariantParts & { productName: string },
): string {
  const variantLabel = formatVariantLabel(line.variantSize, line.variantColor);

  if (variantLabel) {
    return variantLabel;
  }

  return line.productName;
}

export function getSlateLineSecondaryLabel(
  line: VariantParts & { productName: string; packagingName: string },
): string {
  const variantLabel = formatVariantLabel(line.variantSize, line.variantColor);

  if (variantLabel) {
    return line.productName;
  }

  return line.packagingName;
}

export function getKitchenItemPrimaryLabel(item: {
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
}): string {
  return getSlateLinePrimaryLabel({
    productName: item.productName,
    variantSize: item.variantSize,
    variantColor: item.variantColor,
  });
}
