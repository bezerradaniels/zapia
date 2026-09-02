import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  subtitle?: string;
  badge?: string;
  color?: "green" | "blue" | "purple" | "amber" | "rose" | "default";
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  badge,
}: Props) {
  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.06)] transition-all hover:border-[#bdc1c6] hover:shadow-[0_1px_3px_1px_rgba(60,64,67,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#5f6368]">
            {label}
          </span>
        </div>
        {badge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-medium text-[#137333]">
            <svg
              className="h-3 w-3 fill-current"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {badge}
          </span>
        ) : icon ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f8f9fa] text-[#5f6368] transition-colors group-hover:bg-[#e8f0fe] group-hover:text-[#1a73e8]">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-[#202124] sm:text-3xl">
            {value}
          </p>
          {trend && (
            <span className="text-xs font-medium text-[#137333]">
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-[#5f6368]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
