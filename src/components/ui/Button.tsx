import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 hover:opacity-90",
  {
    variants: {
      variant: {
        primary: "bg-violet-500 text-white font-medium hover:bg-violet-600 shadow-xs",
        emerald: "bg-violet-500 text-white font-medium hover:bg-violet-600 shadow-xs",
        violet: "bg-violet-500 text-white font-medium hover:bg-violet-600 shadow-xs",
        sky: "bg-sky-400 text-neutral-950 font-semibold hover:bg-sky-300 shadow-xs",
        lime: "bg-violet-500 text-white font-medium hover:bg-violet-600 shadow-xs",
        ghost: "bg-transparent text-[rgb(24,24,26)] hover:bg-neutral-100/70",
        outline: "bg-transparent text-[rgb(24,24,26)] border border-neutral-300 hover:bg-violet-50/60",
        outlineW: "bg-transparent text-white border-[1.5px] border-white/50",
        whatsapp: "bg-[#25d366] text-white",
        ink: "bg-neutral-900 text-white",
        store: "bg-store-primary text-store-primary-fg",
        link: "bg-transparent text-[rgb(24,24,26)] hover:text-violet-600 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
