import { Component, type ErrorInfo, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { track } from "@/features/analytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);

    const msg = error?.message || "";

    // Track unhandled UI crash for observability
    try {
      track("client_error_captured", {
        error_message: msg.slice(0, 500) || "Unknown render error",
        component_stack: errorInfo.componentStack
          ? errorInfo.componentStack.slice(0, 1000)
          : undefined,
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
        fatal: true,
      });
    } catch {
      // Telemetry failure should never crash the error boundary
    }

    // Auto-reload once on deployment chunk hash mismatch
    const isChunkError =
      msg.includes("dynamically imported module") ||
      msg.includes("Loading chunk") ||
      msg.includes("Failed to fetch") ||
      error?.name === "ChunkLoadError";

    if (isChunkError) {
      const storageKey = "zapia_chunk_reload";
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fafafa] p-6 text-center text-neutral-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            <HugeiconsIcon icon={AlertCircleIcon} size={22} />
          </div>
          <h1 className="text-base font-semibold text-neutral-900">Algo deu errado</h1>
          <p className="max-w-md text-xs text-neutral-500 font-normal">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Recarregar página
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-800">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
