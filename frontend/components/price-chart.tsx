"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PricePoint } from "@/lib/types";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  price: {
    label: "ETH",
    color: "var(--color-chart-2)",
  },
} as const;

export function PriceChart({ data }: { data: PricePoint[] }) {
  const lastPoint = data[data.length - 1];
  const prices = data.map((point) => point.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const spread = Math.max(maxPrice - minPrice, 0);
  const padding = Math.max(spread * 0.25, Math.max(minPrice * 0.0005, 0.5));
  const yDomain: [number, number] = [
    Math.max(0, minPrice - padding),
    maxPrice + padding,
  ];

  return (
    <ChartContainer
      className="h-[260px] w-full aspect-auto rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:h-[320px] sm:aspect-video lg:h-[420px]"
      config={chartConfig}
    >
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-chart-2)"
              stopOpacity={0.4}
            />
            <stop
              offset="100%"
              stopColor="var(--color-chart-2)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 8" />
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(value) => {
            const timestamp = Number(value);
            if (!Number.isFinite(timestamp)) return "";
            return new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickMargin={10}
          tickCount={5}
        />
        <YAxis
          domain={yDomain}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toFixed(0)}
          width={40}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "4 4" }}
          labelFormatter={(label, payload) => {
            const raw =
              payload?.[0]?.payload?.time !== undefined
                ? payload[0].payload.time
                : label;
            const timestamp = Number(raw);
            if (!Number.isFinite(timestamp)) return "—";
            return new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`] as const}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="var(--color-chart-2)"
          strokeWidth={2.5}
          fill="url(#priceFill)"
          isAnimationActive={false}
          activeDot={{ r: 4, fill: "var(--chart-active-dot)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
