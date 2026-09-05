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
    <div className="group relative flex flex-col justify-between rounded-xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 shadow-sm transition-all hover:border-neutral-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-medium text-neutral-500">
            {label}
          </span>
        </div>
        {badge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200/60 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
            {badge}
          </span>
        ) : icon ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 transition-colors">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 leading-none">
            {value}
          </p>
          {trend && (
            <span className="text-[10.5px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-full">
              {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-neutral-400 font-normal">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
