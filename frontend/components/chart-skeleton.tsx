export function ChartSkeleton() {
  return (
    <div className="h-[260px] w-full rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:h-[320px] lg:h-[420px]">
      <div className="relative flex h-full flex-col">
        {/* Grid lines */}
        <div className="flex flex-1 flex-col justify-between py-4 pl-12 pr-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-px w-full border-t border-dashed border-border/40" />
          ))}
        </div>

        {/* Animated area fill */}
        <div className="absolute inset-0 top-[30%] bottom-10 left-12 right-4 overflow-hidden">
          <div className="h-full w-full animate-pulse rounded-sm bg-border/10" />
        </div>

        {/* X-axis tick placeholders */}
        <div className="flex justify-between pl-12 pr-4 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-12 animate-pulse rounded-sm bg-border/20" />
          ))}
        </div>

        {/* Y-axis tick placeholders */}
        <div className="absolute left-0 top-4 bottom-10 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-9 animate-pulse rounded-sm bg-border/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
