import { cn } from "@/lib/utils";

export function MemberSpotlightCard({
  name,
  company,
  imageSrc,
  quote,
  href,
  className,
}: {
  name: string;
  company: string;
  imageSrc: string;
  quote?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl edge-card press group",
        "aspect-[4/5] sm:aspect-[3/4]",
        className,
      )}
      data-testid={`spotlight-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <img
        src={imageSrc}
        alt={`${name} – ${company}`}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-2">
        <span className="eyebrow text-primary">Member Spotlight</span>
        <h3 className="font-display text-2xl sm:text-3xl leading-tight">{name}</h3>
        <p className="text-sm text-white/80">{company}</p>
        {quote && (
          <p className="text-sm text-white/90 italic border-l-2 border-primary pl-3 mt-3 line-clamp-3">
            "{quote}"
          </p>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}
