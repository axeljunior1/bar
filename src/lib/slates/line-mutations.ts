import type {
  SellableProduct,
  SlateLineItem,
} from "@/components/slates/types";
import { getPackagingSellPrice } from "@/lib/products/pricing";

export type RpcSlateLinePayload = {
  id: string;
  product_packaging_id: string;
  product_variant_id?: string | null;
  product_name: string;
  variant_size?: string | null;
  variant_color?: string | null;
  packaging_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type RpcLineMutationPayload = {
  line?: RpcSlateLinePayload;
  slate_total: number;
  kitchen_created?: boolean;
  deleted_line_id?: string;
};

export function slateLineMergeKey(
  line: Pick<SlateLineItem, "productPackagingId" | "productVariantId">,
): string {
  return `${line.productPackagingId}:${line.productVariantId ?? ""}`;
}

export function mapRpcLineToItem(line: RpcSlateLinePayload): SlateLineItem {
  return {
    id: line.id,
    productPackagingId: line.product_packaging_id,
    productVariantId: line.product_variant_id ?? null,
    productName: line.product_name,
    variantSize: line.variant_size ?? null,
    variantColor: line.variant_color ?? null,
    packagingName: line.packaging_name,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unit_price),
    lineTotal: Number(line.line_total),
  };
}

export function mergeSlateLine(
  lines: SlateLineItem[],
  line: SlateLineItem,
): SlateLineItem[] {
  const mergeKey = slateLineMergeKey(line);
  const index = lines.findIndex((item) => slateLineMergeKey(item) === mergeKey);

  if (index === -1) {
    return [...lines, line];
  }

  const next = [...lines];
  next[index] = line;
  return next;
}

export function sumLineTotals(lines: SlateLineItem[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

type CatalogPackaging = {
  id: string;
  typeName: string;
  price: number;
  productName: string;
  productVariantId: string | null;
  variantSize: string | null;
  variantColor: string | null;
};

export function findCatalogPackaging(
  products: SellableProduct[],
  packagingId: string,
  variantId?: string | null,
): CatalogPackaging | null {
  for (const product of products) {
    const packaging = product.packagings.find((item) => item.id === packagingId);
    if (!packaging) {
      continue;
    }

    if (product.variants.length > 0) {
      if (!variantId) {
        return null;
      }

      const variant = product.variants.find((item) => item.id === variantId);
      if (!variant) {
        return null;
      }

      return {
        id: packaging.id,
        typeName: packaging.typeName,
        price: getPackagingSellPrice(
          product.unitPrice,
          packaging,
          variant.unitPrice,
        ),
        productName: product.name,
        productVariantId: variant.id,
        variantSize: variant.size,
        variantColor: variant.color,
      };
    }

    if (variantId) {
      return null;
    }

    return {
      id: packaging.id,
      typeName: packaging.typeName,
      price: getPackagingSellPrice(product.unitPrice, packaging),
      productName: product.name,
      productVariantId: null,
      variantSize: null,
      variantColor: null,
    };
  }

  return null;
}

export function applyOptimisticAdd(
  lines: SlateLineItem[],
  products: SellableProduct[],
  packagingId: string,
  variantId?: string | null,
  lineTotal?: number,
): SlateLineItem[] | null {
  const catalog = findCatalogPackaging(products, packagingId, variantId);
  if (!catalog) {
    return null;
  }

  const mergeKey = `${packagingId}:${catalog.productVariantId ?? ""}`;
  const existing = lines.find(
    (line) => slateLineMergeKey(line) === mergeKey,
  );

  if (existing) {
    const quantity = existing.quantity + 1;
    return mergeSlateLine(lines, {
      ...existing,
      quantity,
      lineTotal: existing.unitPrice * quantity,
    });
  }

  const resolvedLineTotal = lineTotal ?? catalog.price;
  const resolvedUnitPrice = resolvedLineTotal;

  return mergeSlateLine(lines, {
    id: `pending-${mergeKey}`,
    productPackagingId: packagingId,
    productVariantId: catalog.productVariantId,
    productName: catalog.productName,
    variantSize: catalog.variantSize,
    variantColor: catalog.variantColor,
    packagingName: catalog.typeName,
    quantity: 1,
    unitPrice: resolvedUnitPrice,
    lineTotal: resolvedLineTotal,
  });
}

export function applyOptimisticLineTotal(
  lines: SlateLineItem[],
  lineId: string,
  lineTotal: number,
): SlateLineItem[] {
  return lines.map((line) =>
    line.id === lineId
      ? {
          ...line,
          lineTotal,
          unitPrice: lineTotal / line.quantity,
        }
      : line,
  );
}

export function applyOptimisticQuantity(
  lines: SlateLineItem[],
  lineId: string,
  quantity: number,
): SlateLineItem[] {
  return lines.map((line) =>
    line.id === lineId
      ? { ...line, quantity, lineTotal: line.unitPrice * quantity }
      : line,
  );
}

export function applyOptimisticRemove(
  lines: SlateLineItem[],
  lineId: string,
): SlateLineItem[] {
  return lines.filter((line) => line.id !== lineId);
}

export function revertOptimisticAdd(
  lines: SlateLineItem[],
  packagingId: string,
  variantId: string | null,
): SlateLineItem[] {
  const mergeKey = slateLineMergeKey({
    productPackagingId: packagingId,
    productVariantId: variantId,
  });
  const index = lines.findIndex((line) => slateLineMergeKey(line) === mergeKey);

  if (index === -1) {
    return lines;
  }

  const line = lines[index];

  if (line.quantity <= 1) {
    return lines.filter((_, itemIndex) => itemIndex !== index);
  }

  const quantity = line.quantity - 1;
  const next = [...lines];
  next[index] = {
    ...line,
    quantity,
    lineTotal: line.unitPrice * quantity,
  };
  return next;
}

export function reconcileLineFromServer(
  lines: SlateLineItem[],
  line: SlateLineItem,
): SlateLineItem[] {
  const mergeKey = slateLineMergeKey(line);
  const withoutMatch = lines.filter(
    (item) => slateLineMergeKey(item) !== mergeKey,
  );
  return mergeSlateLine(withoutMatch, line);
}
