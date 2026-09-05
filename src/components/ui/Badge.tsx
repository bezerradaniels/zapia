import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        green: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
        emerald: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
        sky: "bg-sky-50 text-sky-800 border border-sky-200/80",
        violet: "bg-violet-50 text-violet-800 border border-violet-200/80",
        purple: "bg-purple-50 text-purple-800 border border-purple-200/80",
        lime: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
        lilac: "bg-violet-50 text-violet-800 border border-violet-200/80",
        neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200/80",
        amber: "bg-amber-50 text-amber-800 border border-amber-200/80",
        rose: "bg-rose-50 text-rose-800 border border-rose-200/80",
        ink: "bg-neutral-900 text-white",
        outline: "border border-neutral-200/80 bg-transparent text-neutral-600",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
