import { cn } from "@/lib/utils";

export function Ticker({
  items,
  className,
}: {
  items: React.ReactNode[];
  className?: string;
}) {
  // Duplicate the items so the marquee loops seamlessly
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-foreground text-background border-y border-primary/20",
        className,
      )}
      data-testid="ticker"
    >
      <div className="flex whitespace-nowrap animate-ticker py-2.5">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-6 text-xs font-medium uppercase tracking-wider"
          >
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
