import { ChartSkeleton } from "@/components/chart-skeleton";
import { PriceChart } from "@/components/price-chart";
import type { PricePoint } from "@/lib/types";

function formatUsd(value: number | null) {
  if (!value) return "\u2014";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function PriceSection({
  series,
  price,
}: {
  series: PricePoint[];
  price: number | null;
}) {
  return (
    <div className="w-full space-y-4">
      {series.length < 2 ? <ChartSkeleton /> : <PriceChart data={series} />}
      <div className="flex flex-col gap-1 rounded-lg border-2 border-border bg-secondary-background px-4 py-3 text-sm shadow-shadow sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold">Live ETH Price</span>
        <span className="text-lg font-heading sm:text-xl">
          {formatUsd(price)} USD
        </span>
      </div>
    </div>
  );
}
