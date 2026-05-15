import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  number,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { number?: string }) {
  return (
    <div className={cn("eyebrow text-muted-foreground flex items-center gap-2", className)} {...props}>
      {number && <span className="text-primary font-numeral text-base leading-none">{number}</span>}
      {number && <span className="h-px w-6 bg-primary/60" aria-hidden />}
      <span>{children}</span>
    </div>
  );
}
