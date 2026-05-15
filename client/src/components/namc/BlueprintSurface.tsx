import { cn } from "@/lib/utils";

export function BlueprintSurface({
  children,
  className,
  dark = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { dark?: boolean }) {
  return (
    <div
      className={cn(
        "relative",
        dark && "bg-foreground text-background",
        "blueprint",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
