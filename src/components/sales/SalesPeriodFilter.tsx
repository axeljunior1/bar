"use client";

import Link from "next/link";

import type { SalesPeriod } from "@/lib/sales/period";
import { cn } from "@/lib/utils/cn";

const periods: Array<{ value: SalesPeriod; label: string }> = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "7 jours" },
  { value: "all", label: "Toutes" },
];

type SalesPeriodFilterProps = {
  activePeriod: SalesPeriod;
};

export function SalesPeriodFilter({ activePeriod }: SalesPeriodFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {periods.map((period) => {
        const isActive = period.value === activePeriod;

        return (
          <Link
            key={period.value}
            href={`/ventes?period=${period.value}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-600 text-white"
                : "border border-border bg-white text-foreground",
            )}
          >
            {period.label}
          </Link>
        );
      })}
    </div>
  );
}
