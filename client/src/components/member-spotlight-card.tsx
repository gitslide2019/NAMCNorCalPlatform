import * as React from "react";
import { cn } from "@/lib/utils";

interface MemberSpotlightCardProps {
  name: string;
  role?: string;
  company?: string;
  photo: string;
  href?: string;
  caption?: string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Full-bleed photo card with a dark gradient overlay and the name set in
 * 36px Fraunces. Editorial replacement for "avatar-in-circle thumbnail".
 */
export function MemberSpotlightCard({
  name,
  role,
  company,
  photo,
  href,
  caption,
  className,
  "data-testid": testId,
}: MemberSpotlightCardProps) {
  const content = (
    <div
      className={cn(
        "group relative aspect-[3/4] overflow-hidden rounded-2xl bg-card shadow-editorial pressable",
        className
      )}
      data-testid={testId}
    >
      <img
        src={photo}
        alt={`${name}${company ? `, ${company}` : ""}`}
        className="absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent transition-[box-shadow] duration-200 group-hover:ring-[hsl(var(--gold-rule)/0.55)]" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
        {caption && (
          <p className="eyebrow text-white/70 mb-2">{caption}</p>
        )}
        <h3 className="font-display text-3xl sm:text-4xl leading-[1.05] tracking-tight">
          {name}
        </h3>
        {(role || company) && (
          <p className="mt-1 text-sm sm:text-base text-white/85 font-medium">
            {[role, company].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="block"
      >
        {content}
      </a>
    );
  }
  return content;
}
