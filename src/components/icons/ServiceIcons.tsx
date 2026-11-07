import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

function IconShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconErp(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconShell>
  );
}

export function IconCrm(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c1.2-3 3.4-4.5 5.5-4.5S13.3 16 14.5 19" />
      <path d="M14 14.5c1.1-.7 2.4-1 3.5-1 1.6 0 3 .7 4 2.5" />
    </IconShell>
  );
}

export function IconWebsite(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8.7" cy="7" r="0.7" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function IconMobile(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </IconShell>
  );
}

export function IconCustom(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 4h8l2 4-6 11L6 8l2-4z" />
      <path d="M6 8h12" />
    </IconShell>
  );
}

export function IconAutomation(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </IconShell>
  );
}

export function IconEcommerce(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 6h2l2.2 9.2a2 2 0 0 0 2 1.5h6.6a2 2 0 0 0 2-1.5L20 9H8" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </IconShell>
  );
}

export function IconAi(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M12 3v3M12 18v3" />
      <rect x="6" y="7" width="12" height="10" rx="3" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function IconUiux(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="M4 10h16" />
      <path d="M9 14h6" />
    </IconShell>
  );
}

const map = {
  erp: IconErp,
  crm: IconCrm,
  website: IconWebsite,
  mobile: IconMobile,
  custom: IconCustom,
  automation: IconAutomation,
  ecommerce: IconEcommerce,
  ai: IconAi,
  uiux: IconUiux,
} as const;

export function ServiceIcon({
  name,
  className,
}: {
  name: keyof typeof map;
  className?: string;
}) {
  const Comp = map[name];
  return <Comp className={className} />;
}
