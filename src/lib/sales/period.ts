export type SalesPeriod = "today" | "week" | "all";

export function parseSalesPeriod(value: string | undefined): SalesPeriod {
  if (value === "week" || value === "all") {
    return value;
  }

  return "today";
}

export function getPeriodLabel(period: SalesPeriod): string {
  switch (period) {
    case "today":
      return "Aujourd'hui";
    case "week":
      return "7 derniers jours";
    case "all":
      return "Toutes les ventes";
  }
}

export function getPeriodStart(period: SalesPeriod): string | null {
  if (period === "all") {
    return null;
  }

  const date = new Date();

  if (period === "today") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

export function formatDateTimeFr(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTimeFr(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
