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
    <div className={cn("flex items-baseline gap-3 mb-5", className)}>
      <span
        className="font-numeral text-5xl sm:text-7xl text-primary leading-[0.85]"
        aria-hidden="true"
      >
        №{number}
      </span>
      {label && (
        <>
          <span className="h-px w-6 bg-primary/60 shrink-0 self-center" aria-hidden="true" />
          <span className="eyebrow text-foreground/80">{label}</span>
        </>
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
      <span className="font-numeral text-4xl sm:text-5xl lg:text-6xl text-primary leading-[0.85]">
        {value}
      </span>
      <span className="eyebrow mt-1">{label}</span>
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

/**
 * Editorial page header — gold-rule underline, eyebrow, Fraunces/Plus Jakarta
 * display title, optional description, and right-aligned actions slot.
 *
 * Title accepts a string (rendered as the standard <h1>) or a ReactNode for
 * pages that need extras inline with the title (badges, etc.).
 */
export function PageHeader({
  eyebrow,
  title,
  titleTestId,
  titleClassName,
  description,
  actions,
  children,
  className,
  "data-testid": testId,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  titleTestId?: string;
  titleClassName?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}) {
  const hasActions = !!actions;
  return (
    <header
      data-testid={testId}
      className={cn(
        "border-b-2 border-foreground/80 pb-6 mb-8",
        hasActions && "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {typeof title === "string" ? (
          <h1
            className={cn(
              "font-display text-4xl sm:text-5xl tracking-tight leading-[0.95]",
              titleClassName,
            )}
            data-testid={titleTestId}
          >
            {title}
          </h1>
        ) : (
          title
        )}
        {description && (
          <p className="text-muted-foreground max-w-lg text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>
      {hasActions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
      {children}
    </header>
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
