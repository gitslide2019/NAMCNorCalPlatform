import * as React from "react";
import { cn } from "@/lib/utils";

/** Small uppercase tracking-wide label that sits above section titles. */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
  "data-testid": testId,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
  "data-testid"?: string;
}) {
  return (
    <Tag className={cn("eyebrow", className)} data-testid={testId}>
      {children}
    </Tag>
  );
}

/** Oversized magazine-style section numeral, e.g. "01 / Why join". */
export function SectionNumeral({
  number,
  label,
  className,
}: {
  number: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 mb-4", className)}>
      <span
        className="font-display font-display-tnum text-5xl sm:text-6xl text-primary leading-none"
        aria-hidden="true"
      >
        {number}
      </span>
      {label && (
        <span className="eyebrow text-foreground/80">/&nbsp;{label}</span>
      )}
    </div>
  );
}

/** Editorial stat block with oversized Fraunces tabular numeral. */
export function Stat({
  value,
  label,
  className,
  align = "left",
  "data-testid": testId,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
  align?: "left" | "center";
  "data-testid"?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "center" && "items-center text-center",
        className
      )}
      data-testid={testId}
    >
      <span className="font-display font-display-tnum text-4xl sm:text-5xl lg:text-6xl text-primary leading-none">
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}

/** Sticky inline ticker — gold-ruled, marquee scroll. */
export function Ticker({
  items,
  className,
  "data-testid": testId,
}: {
  items: (string | React.ReactNode)[];
  className?: string;
  "data-testid"?: string;
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border-y bg-background py-2",
        "border-y-[hsl(var(--gold-rule)/0.4)]",
        className
      )}
      data-testid={testId}
    >
      <div className="animate-ticker flex w-max gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="eyebrow flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-foreground/80 normal-case tracking-normal text-xs font-medium">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** RevealOnScroll: tiny IntersectionObserver wrapper that toggles a data attribute. */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "header" | "article" | "li" | "p";
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const Component: React.ElementType = Tag;
  return (
    <Component
      ref={ref as React.Ref<any>}
      data-reveal={visible ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </Component>
  );
}

/** Dark blueprint surface wrapper. Use as `<BlueprintSurface as="section">…</BlueprintSurface>`. */
export function BlueprintSurface({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
} & React.HTMLAttributes<HTMLElement>) {
  const Component: React.ElementType = Tag;
  return (
    <Component className={cn("blueprint-surface", className)} {...rest}>
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
