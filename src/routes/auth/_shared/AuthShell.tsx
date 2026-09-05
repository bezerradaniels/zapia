import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  width?: number;
  contentClassName?: string;
}

export function AuthShell({
  children,
  title,
  subtitle,
  width = 420,
  contentClassName,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4 sm:p-6 text-neutral-900">
      <div
        className={cn(
          "w-full rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm",
          contentClassName,
        )}
        style={{ maxWidth: width }}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to={ROUTES.home} aria-label="Início" className="transition-opacity hover:opacity-90">
            <Logo size="md" />
          </Link>
          <h1 className="mt-4 text-lg sm:text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 font-normal">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
