import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

export type InsightVariant = "warning" | "success" | "info" | "tip";

type Props = {
  variant: InsightVariant;
  title: string;
  body: string;
  cta?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  children?: ReactNode;
};

const CONFIG: Record<InsightVariant, {
  Icon: typeof AlertTriangle;
  bg: string;
  border: string;
  iconColor: string;
  badgeBg: string;
}> = {
  warning: {
    Icon: AlertTriangle,
    bg: "bg-destructive/5 dark:bg-destructive/10",
    border: "border-destructive/25",
    iconColor: "text-destructive",
    badgeBg: "bg-destructive/10",
  },
  success: {
    Icon: CheckCircle2,
    bg: "bg-success/5 dark:bg-success/10",
    border: "border-success/25",
    iconColor: "text-success",
    badgeBg: "bg-success/10",
  },
  info: {
    Icon: Info,
    bg: "bg-primary/5 dark:bg-primary/10",
    border: "border-primary/25",
    iconColor: "text-primary",
    badgeBg: "bg-primary/10",
  },
  tip: {
    Icon: Lightbulb,
    bg: "bg-accent/5 dark:bg-accent/10",
    border: "border-accent/25",
    iconColor: "text-accent-foreground",
    badgeBg: "bg-accent/15",
  },
};

export function CoachInsightCard({ variant, title, body, cta, ctaHref, onCtaClick, children }: Props) {
  const { Icon, bg, border, iconColor, badgeBg } = CONFIG[variant];

  return (
    <div className={`rounded-2xl border p-4 transition-all ${bg} ${border}`}>
      <div className="flex gap-3">
        <div className={`mt-0.5 flex-shrink-0 grid h-8 w-8 place-items-center rounded-lg ${badgeBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
          {children && <div className="mt-2">{children}</div>}
          {(cta && ctaHref) && (
            <Button asChild size="sm" variant="ghost" className="mt-2 -ml-1 h-7 text-xs font-semibold px-2">
              <Link to={ctaHref}>
                {cta} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
          {(cta && onCtaClick) && (
            <Button size="sm" variant="ghost" onClick={onCtaClick} className="mt-2 -ml-1 h-7 text-xs font-semibold px-2">
              {cta} <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
