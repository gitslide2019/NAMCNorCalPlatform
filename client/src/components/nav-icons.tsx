import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (props: Props) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: props.size ?? 24,
  height: props.size ?? 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

/** Hard-hat → Home */
export function IconHardHat(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg {...base(props)} {...rest}>
      <path d="M4 17h16v2H4z" />
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M12 6v4" />
      <path d="M9 10c0-2 .8-4 3-4s3 2 3 4" />
    </svg>
  );
}

/** Blueprint → Directory */
export function IconBlueprint(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg {...base(props)} {...rest}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18" />
      <path d="M9 9v11" />
      <path d="M14 13h3" />
      <path d="M14 16h3" />
    </svg>
  );
}

/** Calendar with a pennant flag → Calendar */
export function IconCalendarFlag(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg {...base(props)} {...rest}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M16 14l3-1.4-3-1.4" />
    </svg>
  );
}

/** Chat bubble with a corner tail → Messages */
export function IconChatCorner(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg {...base(props)} {...rest}>
      <path d="M4 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M7 10h8" />
      <path d="M7 13h5" />
    </svg>
  );
}

/** Three stacked dots → More */
export function IconStackedDots(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg {...base(props)} {...rest}>
      <circle cx="12" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** NAMC monogram (N · M letterform) for the FAB. */
export function IconNamcMonogram(props: Props) {
  const { size: _s, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size ?? 28}
      height={props.size ?? 28}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M5 18V6l7 9V6" />
      <path d="M14.5 18V6l3 5 3-5v12" />
    </svg>
  );
}
