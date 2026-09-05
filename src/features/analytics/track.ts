import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsEventParams,
} from "./events";

/**
 * Mesma chave usada pelo banner de consentimento (`CookieConsentBanner.tsx`) e
 * pelo carregador do GTM no `index.html`. Eventos só vão para a `dataLayer`
 * depois que o visitante aceita os cookies de análise (LGPD).
 */
const COOKIE_CONSENT_KEY = "zapia_cookie_consent";

function hasAnalyticsConsent(): boolean {
  try {
    const match = document.cookie.match(/(^|; )zapia_cookie_consent=([^;]+)/);
    if (match && match[2] === "accepted") return true;
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

/**
 * Empurra um payload bruto para a `dataLayer` do GTM. A `dataLayer` já é
 * inicializada no `index.html` antes de qualquer script, então o push é seguro
 * mesmo que o container do GTM ainda não tenha carregado — o GTM reprocessa a
 * fila ao subir.
 */
function pushToDataLayer(payload: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/**
 * Dispara um evento de analytics de forma tipada.
 *
 * - Eventos sem parâmetros (ex.: `logout`) são chamados sem o segundo argumento.
 * - Em desenvolvimento, loga no console em vez de enviar (facilita depuração).
 * - Em produção, só envia se houver consentimento de análise.
 *
 * @example
 *   track('product_created', { product_id, product_name, has_image, has_variations })
 *   track('logout')
 */
export function track<E extends AnalyticsEventName>(
  ...args: AnalyticsEventMap[E] extends Record<string, never>
    ? [event: E]
    : [event: E, params: AnalyticsEventParams<E>]
): void {
  const [event, params] = args as [E, AnalyticsEventParams<E>?];

  if (typeof window === "undefined") return;

  if (import.meta.env.DEV) {
    console.log("[analytics]", event, params ?? {});
    return;
  }

  if (!hasAnalyticsConsent()) return;

  pushToDataLayer({ event, ...(params ?? {}) });
}

export interface SubscriptionPurchaseParams {
  transactionId: string;
  planId: string;
  planName: string;
  value: number; // Valor em reais, ex: 14.90 ou 149.00
  billingPeriod?: "monthly" | "annual" | string;
  storeId?: string;
  paymentMethod?: "pix" | "stripe" | "card";
}

/**
 * Registra formalmente a compra confirmada de uma assinatura no padrão E-commerce do GA4 (`purchase`).
 * Inclui:
 * - Deduplicação automática via `sessionStorage` para não inflar métricas em caso de recarregamento
 * - Limpeza prévia do objeto `ecommerce` no dataLayer (`ecommerce: null`)
 * - Payload padronizado com `transaction_id`, `value`, `currency: 'BRL'` e array de `items`
 */
export function trackSubscriptionPurchase(
  params: SubscriptionPurchaseParams,
): boolean {
  if (typeof window === "undefined") return false;

  const dedupKey = `zapia_purchase_tracked_${params.transactionId}`;
  try {
    if (sessionStorage.getItem(dedupKey)) {
      if (import.meta.env.DEV) {
        console.log(
          "[analytics:purchase] Ignorado: compra já registrada nesta sessão:",
          params.transactionId,
        );
      }
      return false;
    }
    sessionStorage.setItem(dedupKey, "1");
  } catch {
    // sessionStorage pode falhar em modo anônimo estrito
  }

  const items = [
    {
      item_id: params.planId,
      item_name: params.planName,
      item_category: "subscription",
      item_variant: params.billingPeriod ?? "monthly",
      price: params.value,
      quantity: 1,
    },
  ];

  const ecommerce = {
    transaction_id: params.transactionId,
    value: params.value,
    currency: "BRL",
    tax: 0,
    shipping: 0,
    items,
  };

  if (import.meta.env.DEV) {
    console.log("[analytics:ecommerce] purchase (assinatura confirmada):", {
      event: "purchase",
      ecommerce,
      plan_tier: params.planId,
      billing_period: params.billingPeriod,
      payment_method: params.paymentMethod,
      store_id: params.storeId,
    });
    return true;
  }

  if (!hasAnalyticsConsent()) return false;

  pushToDataLayer({ ecommerce: null });
  pushToDataLayer({
    event: "purchase",
    ecommerce,
    transaction_id: params.transactionId,
    value: params.value,
    currency: "BRL",
    plan_tier: params.planId,
    billing_period: params.billingPeriod,
    payment_method: params.paymentMethod,
    store_id: params.storeId,
  });

  return true;
}

