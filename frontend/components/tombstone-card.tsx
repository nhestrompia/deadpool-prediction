import { Badge } from "@/components/ui/badge";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function TombstoneCard({
  address,
  index,
}: {
  address: string;
  index: number;
}) {
  const delay = Math.min(index * 60, 600);

  return (
    <div
      className="group relative flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow transition-transform hover:-translate-y-1 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl select-none" aria-hidden>
        {"\u2620\uFE0F"}
      </div>

      <p className="font-mono text-sm tracking-wide">
        {truncateAddress(address)}
      </p>

      <Badge className="bg-red-600 text-white border-red-800">DEAD</Badge>

      <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-main text-xs font-heading text-main-foreground">
        {"\u2717"}
      </div>
    </div>
  );
}
