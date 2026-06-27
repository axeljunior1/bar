import type { SalesPeriod } from "@/lib/sales/period";
import { getPeriodStart } from "@/lib/sales/period";
import { createClient } from "@/lib/supabase/server";

export type SaleListItem = {
  id: string;
  clientName: string;
  total: number;
  paymentMethodName: string;
  soldAt: string;
  lineCount: number;
  serverName: string | null;
};

export type PaymentBreakdownItem = {
  name: string;
  total: number;
};

export type SalesListData = {
  sales: SaleListItem[];
  summary: {
    total: number;
    count: number;
    breakdown: PaymentBreakdownItem[];
  };
};

export async function loadSalesList(
  barId: string,
  period: SalesPeriod,
): Promise<SalesListData> {
  const supabase = await createClient();
  const periodStart = getPeriodStart(period);

  let salesQuery = supabase
    .from("sales")
    .select("id, total, sold_at, payment_method_id, slate_id, created_by")
    .eq("bar_id", barId)
    .order("sold_at", { ascending: false });

  if (periodStart) {
    salesQuery = salesQuery.gte("sold_at", periodStart);
  }

  const { data: sales } = await salesQuery;

  if (!sales?.length) {
    return {
      sales: [],
      summary: { total: 0, count: 0, breakdown: [] },
    };
  }

  const saleIds = sales.map((sale) => sale.id);
  const slateIds = [
    ...new Set(sales.map((sale) => sale.slate_id).filter(Boolean)),
  ] as string[];
  const serverIds = [
    ...new Set(sales.map((sale) => sale.created_by).filter(Boolean)),
  ] as string[];

  const [{ data: paymentMethods }, { data: slates }, { data: profiles }, { data: lines }] =
    await Promise.all([
      supabase
        .from("payment_methods")
        .select("id, name")
        .eq("bar_id", barId),
      slateIds.length
        ? supabase
            .from("slates")
            .select("id, client_name")
            .eq("bar_id", barId)
            .in("id", slateIds)
        : Promise.resolve({ data: [] as Array<{ id: string; client_name: string }> }),
      serverIds.length
        ? supabase
            .from("profiles")
            .select("id, full_name")
            .eq("bar_id", barId)
            .in("id", serverIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
      supabase.from("sale_lines").select("sale_id").eq("bar_id", barId).in("sale_id", saleIds),
    ]);

  const paymentMethodById = new Map(
    paymentMethods?.map((method) => [method.id, method.name]) ?? [],
  );
  const clientNameBySlateId = new Map(
    slates?.map((slate) => [slate.id, slate.client_name]) ?? [],
  );
  const serverNameById = new Map(
    profiles?.map((profile) => [profile.id, profile.full_name]) ?? [],
  );

  const lineCountBySaleId = new Map<string, number>();
  lines?.forEach((line) => {
    lineCountBySaleId.set(
      line.sale_id,
      (lineCountBySaleId.get(line.sale_id) ?? 0) + 1,
    );
  });

  const breakdownMap = new Map<string, PaymentBreakdownItem>();

  const saleItems: SaleListItem[] = sales.map((sale) => {
    const paymentMethodName =
      paymentMethodById.get(sale.payment_method_id) ?? "—";
    const clientName = sale.slate_id
      ? (clientNameBySlateId.get(sale.slate_id) ?? "Client")
      : "Client";
    const total = Number(sale.total);

    const existing = breakdownMap.get(paymentMethodName);
    if (existing) {
      existing.total += total;
    } else {
      breakdownMap.set(paymentMethodName, {
        name: paymentMethodName,
        total,
      });
    }

    return {
      id: sale.id,
      clientName,
      total,
      paymentMethodName,
      soldAt: sale.sold_at,
      lineCount: lineCountBySaleId.get(sale.id) ?? 0,
      serverName: sale.created_by
        ? (serverNameById.get(sale.created_by) ?? null)
        : null,
    };
  });

  const summaryTotal = saleItems.reduce((sum, sale) => sum + sale.total, 0);

  return {
    sales: saleItems,
    summary: {
      total: summaryTotal,
      count: saleItems.length,
      breakdown: [...breakdownMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    },
  };
}

export type SaleDetail = {
  id: string;
  clientName: string;
  total: number;
  paymentMethodName: string;
  soldAt: string;
  serverName: string | null;
  statusLabel: string;
  lines: Array<{
    id: string;
    productName: string;
    packagingName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export async function loadSaleDetail(
  saleId: string,
  barId: string,
): Promise<SaleDetail | null> {
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("id, total, sold_at, payment_method_id, slate_id, created_by")
    .eq("id", saleId)
    .eq("bar_id", barId)
    .maybeSingle();

  if (!sale) {
    return null;
  }

  const [{ data: lines }, { data: paymentMethod }, slateResult, profileResult] =
    await Promise.all([
      supabase
        .from("sale_lines")
        .select(
          "id, product_name, packaging_name, quantity, unit_price, line_total",
        )
        .eq("sale_id", saleId)
        .eq("bar_id", barId)
        .order("id", { ascending: true }),
      supabase
        .from("payment_methods")
        .select("name")
        .eq("id", sale.payment_method_id)
        .eq("bar_id", barId)
        .maybeSingle(),
      sale.slate_id
        ? supabase
            .from("slates")
            .select("client_name, status")
            .eq("id", sale.slate_id)
            .eq("bar_id", barId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      sale.created_by
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("id", sale.created_by)
            .eq("bar_id", barId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const slate = slateResult.data;

  return {
    id: sale.id,
    clientName: slate?.client_name ?? "Client",
    total: Number(sale.total),
    paymentMethodName: paymentMethod?.name ?? "—",
    soldAt: sale.sold_at,
    serverName: profileResult.data?.full_name ?? null,
    statusLabel: slate?.status === "paid" ? "Encaissée" : "Enregistrée",
    lines:
      lines?.map((line) => ({
        id: line.id,
        productName: line.product_name,
        packagingName: line.packaging_name,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
        lineTotal: Number(line.line_total),
      })) ?? [],
  };
}
