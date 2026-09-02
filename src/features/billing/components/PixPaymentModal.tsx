import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  Tick02Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useSubscription } from "../hooks/useSubscription";
import { createBrowserClient } from "@/lib/supabase";
import type { PixPaymentResponse } from "../api/mutations";

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  pixData: PixPaymentResponse | null;
  isLoading: boolean;
  onSuccess?: () => void;
}

export function PixPaymentModal({
  open,
  onClose,
  storeId,
  pixData,
  isLoading,
  onSuccess,
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const subscription = useSubscription(storeId);

  // Check if subscription becomes active
  useEffect(() => {
    if (subscription.data?.status === "active" && !isLoading && pixData) {
      setIsApproved(true);
      if (onSuccess) onSuccess();
    }
  }, [subscription.data?.status, isLoading, pixData, onSuccess]);

  // Realtime subscription listener
  useEffect(() => {
    if (!open || !storeId) return;

    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`subscription-pix-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `store_id=eq.${storeId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "active") {
            setIsApproved(true);
            subscription.refetch();
            if (onSuccess) onSuccess();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, storeId, subscription, onSuccess]);

  if (!open) return null;

  const handleCopy = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrCodeImgSrc = pixData?.qrCodeBase64
    ? pixData.qrCodeBase64.startsWith("data:")
      ? pixData.qrCodeBase64
      : `data:image/png;base64,${pixData.qrCodeBase64}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-zinc-100 hover:text-z-text transition-colors"
          aria-label="Fechar"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} />
        </button>

        {isApproved ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in-50 duration-300">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={36} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-z-text">
                Pagamento Confirmado!
              </h3>
              <p className="mt-1 text-sm text-z-text-muted">
                Sua assinatura do plano <strong>{pixData?.planName}</strong> foi
                ativada com sucesso.
              </p>
            </div>
            <Button
              type="button"
              fullWidth
              className="mt-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={onClose}
            >
              Concluir
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <HugeiconsIcon
              icon={Loading03Icon}
              size={36}
              className="animate-spin text-slate-900"
            />
            <p className="text-sm font-medium text-z-text-muted">
              Gerando código PIX no Mercado Pago...
            </p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-bold text-z-text">
                Pague com PIX para ativar
              </h3>
              <p className="text-xs text-z-text-muted">
                Plano {pixData?.planName} ·{" "}
                <strong>{formatMoney(pixData?.amountInCents ?? 0)}</strong>
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-z-border bg-[#fafafa] p-4">
              {qrCodeImgSrc ? (
                <img
                  src={qrCodeImgSrc}
                  alt="QR Code PIX"
                  className="h-48 w-48 rounded-lg shadow-sm bg-white p-2 border border-z-border"
                />
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-lg bg-zinc-100 text-z-text-muted">
                  <HugeiconsIcon icon={QrCodeIcon} size={48} />
                  <span className="text-xs">QR Code indisponível</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Aguardando confirmação do pagamento...
              </div>
            </div>

            {/* Copia e Cola */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-z-text">
                Código PIX Copia e Cola
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={pixData?.qrCode || ""}
                  className="h-10 flex-1 rounded-xl border border-z-border bg-zinc-50 px-3 font-mono text-xs text-z-text focus:outline-none select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="h-10 shrink-0 gap-1.5 rounded-xl px-4 text-xs font-semibold"
                >
                  <HugeiconsIcon
                    icon={copied ? Tick02Icon : Copy01Icon}
                    size={14}
                  />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-xl bg-zinc-50 p-3 text-xs text-z-text-muted border border-z-border/60">
              <p className="font-semibold text-z-text mb-1">Como pagar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra o aplicativo do seu banco</li>
                <li>Escolha pagar via PIX com QR Code ou Copia e Cola</li>
                <li>Cole o código acima ou escaneie a imagem</li>
                <li>Assim que pagar, a liberação é imediata!</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
