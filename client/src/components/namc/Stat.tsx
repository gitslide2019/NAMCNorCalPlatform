import { cn } from "@/lib/utils";

export function Stat({
  value,
  label,
  hint,
  className,
}: {
  value: string | number;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-numeral text-foreground text-5xl sm:text-6xl">{value}</span>
      <div className="flex flex-col">
        <span className="eyebrow text-muted-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground/80 mt-1">{hint}</span>}
      </div>
    </div>
  );
}
