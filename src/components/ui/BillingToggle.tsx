import { cn } from "@/lib/utils";

type Props = {
  value: "monthly" | "annual";
  onChange: (value: "monthly" | "annual") => void;
  className?: string;
};

export function BillingToggle({ value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[10px] border border-neutral-200/80 bg-neutral-100/70 p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-[8px] px-3 py-1.5 text-xs font-medium transition-all",
          value === "monthly"
            ? "bg-violet-400 text-white"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Mensal
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={cn(
          "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-medium transition-all",
          value === "annual"
            ? "bg-violet-400 text-white"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Anual
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold",
            value === "annual"
              ? "bg-white/25 text-white"
              : "bg-violet-100 text-violet-700",
          )}
        >
          até -30%
        </span>
      </button>
    </div>
  );
}
