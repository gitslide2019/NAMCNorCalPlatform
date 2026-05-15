import { cn } from "@/lib/utils";

export function SectionNumeral({
  number,
  label,
  className,
}: {
  number: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 mb-4", className)}>
      <span className="font-numeral text-primary text-4xl md:text-5xl">{number}</span>
      <span className="eyebrow text-muted-foreground">{label}</span>
    </div>
  );
}
