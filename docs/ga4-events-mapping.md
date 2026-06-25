# Mapeamento de eventos de analytics (GTM / GA4)

Este documento descreve o catálogo de eventos de conversão e engajamento do
Zapia: site de marketing, dashboard (lojista/vendedor) e vitrine pública
(storefront). O catálogo tipado vive em código — este documento é a
descrição legível dele, não a fonte da verdade.

**Fonte da verdade:** [`src/features/analytics/events.ts`](../src/features/analytics/events.ts)
(nomes e parâmetros de cada evento) e
[`src/features/analytics/track.ts`](../src/features/analytics/track.ts)
(função `track()` que envia o evento). Ao adicionar ou remover um evento,
atualize o catálogo tipado primeiro — o TypeScript vai recusar compilar
qualquer chamada `track(...)` com nome ou parâmetro que não exista lá — e
depois sincronize a tabela abaixo.

## Como funciona

- GTM está instalado em [`index.html`](../index.html) com o container
  `GTM-TXTFF99H`. Ele só carrega depois que o visitante aceita cookies de
  análise (`CookieConsentBanner.tsx`, chave `zapia_cookie_consent` no
  `localStorage`) — exigência de LGPD.
- `track(event, params)` empurra `{ event, ...params }` para
  `window.dataLayer`. Em desenvolvimento (`import.meta.env.DEV`) ele só loga
  no console, nunca envia. Em produção, só envia se houver consentimento.
- Lojas individuais podem ter seu próprio container GTM
  (`stores.gtm_id`, injetado por `GtmScript` em `StoreLayout.tsx`) para que o
  lojista configure seus próprios pixels (Meta, Google Ads) — isso é
  independente do container principal do Zapia.
- Todo evento aceita opcionalmente `store_id` (tipo `BaseParams` em
  `events.ts`) para segmentar relatórios por loja.

## Catálogo de eventos

Status: ✅ instrumentado no código · ⏳ definido no catálogo mas sem
chamada `track()` ainda (feature não existe ou ponto de conversão não
implementado).

### Autenticação

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `sign_up` | `method: "email"` | ✅ | `useSignUp` (`src/features/auth/hooks/useSignUp.ts`) — usado por `SignupPage` e `TrialSignupPage` |
| `login` | `method: "email"` | ✅ | `useSignIn` (`src/features/auth/hooks/useSignIn.ts`) |
| `logout` | — | ✅ | `useSignOut` (`src/features/auth/hooks/useSignOut.ts`) |

### Onboarding

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `onboarding_started` | `step: 1` | ✅ | `OnboardingStep1` (1ª visita, sem sessão de onboarding salva) |
| `onboarding_step_completed` | `step`, `step_name` | ✅ | Submit de cada um dos 4 passos (`OnboardingStep1..4`) |
| `onboarding_completed` | `total_time_seconds` | ✅ | `OnboardingStep4`, calculado a partir de `OnboardingSession.startedAt` |

### Loja

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `store_created` | `store_id`, `store_slug` | ✅ | `OnboardingStep1` (único call site de `createStore` hoje) e `useCreateStore` |
| `store_updated` | `store_id`, `field` | ✅ | `useUpdateStore` (`field` = chaves alteradas, ex. `"name,whatsapp_phone"`) |

### Produtos

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `product_created` | `product_id`, `product_name`, `has_image`, `has_variations` | ✅ | `useCreateProduct` |
| `product_updated` | `product_id` | ✅ | `useUpdateProduct` |
| `product_deleted` | `product_id` | ✅ | `useDeleteProduct` |
| `product_bulk_created` | `product_count` | ⏳ | Sem feature de importação em massa de produtos hoje |

### Vendedores

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `seller_created` | `seller_id`, `has_dashboard_access` | ✅ | `useCreateSellerCatalog` |
| `seller_updated` | `seller_id` | ✅ | `useUpdateSellerCatalog` |
| `seller_deleted` | `seller_id` | ✅ | `useDeleteSellerCatalog` |

### Clientes

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `customer_created` | `customer_id` | ✅ | `useCreateCustomer` |
| `customer_updated` | `customer_id` | ✅ | `useUpdateCustomer` |
| `customer_deleted` | `customer_id` | ✅ | `useDeleteCustomer` |

### Categorias

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `category_created` | `category_id`, `category_name` | ✅ | `useCreateCategory` |
| `category_updated` | `category_id` | ✅ | `useUpdateCategory` |
| `category_deleted` | `category_id` | ✅ | `useDeleteCategory` |

### Cupons

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `coupon_created` | `coupon_id`, `coupon_code`, `discount_type`, `discount_value` | ✅ | `useCreateCoupon` (dashboard) |
| `coupon_updated` | `coupon_id` | ✅ | `useUpdateCoupon` |
| `coupon_deleted` | `coupon_id` | ✅ | `useDeleteCoupon` |
| `coupon_applied` | `coupon_code`, `discount_value` | ✅ | `cartStore.applyCoupon` (vitrine — aplicado pelo cliente final no carrinho) |
| `coupon_removed` | `coupon_code` | ✅ | `cartStore.clearCoupon` |

### Pedidos

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `order_created` | `order_id`, `total_value`, `item_count`, `has_coupon` | ✅ | `useCreateManualOrder` (pedido criado manualmente pelo lojista/vendedor no dashboard) |
| `order_status_changed` | `order_id`, `old_status`, `new_status` | ✅ | `useUpdateOrderStatus` (`OrdersPage`) |

### Vitrine pública / e-commerce

Nomes alinhados às recomendações de e-commerce do GA4 para os relatórios
funcionarem sem configuração extra.

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `view_item` | `item_id`, `item_name` | ✅ | `ProductPage` (ao carregar o produto) |
| `add_to_cart` | `item_id`, `item_name`, `quantity`, `price` | ✅ | `cartStore.addItem` (cobre `StorePage`, `ProductPage` e relacionados) |
| `remove_from_cart` | `item_id`, `quantity` | ✅ | `cartStore.removeItem` |
| `begin_checkout` | `item_count`, `value` | ✅ | `CartPage`, clique em "Fechar pedido" (desktop e CTA fixo mobile) |
| `order_submitted` | `order_id`, `value`, `item_count`, `has_coupon` | ✅ | `useCreateOrder` — pedido do cliente final, enviado via WhatsApp (equivalente a `purchase`) |

### Engajamento

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `share_link_copied` | `link_type: "store"\|"product"\|"seller"`, `item_id` | ✅ | `StoreLayout` (botão compartilhar da vitrine), `SellersPage` (copiar link do vendedor), `CatalogPage` (copiar link da loja) |
| `search_performed` | `search_term`, `result_count` | ✅ | `StorePage`, debounced (600ms) enquanto o cliente digita na busca do catálogo |

### Faturamento (assinatura do lojista)

| Evento | Parâmetros | Status | Onde |
|---|---|---|---|
| `pricing_page_viewed` | — | ✅ | `PricingPage` (marketing) |
| `free_plan_started` | `plan_tier` | ✅ | `OnboardingStep1`, junto com `store_created` — o plano gratuito (plano `basico`, 10 produtos, sem cartão) é criado por trigger no banco no insert da loja (`supabase/migrations/20260625182002_free_plan_no_trial.sql`); o evento é disparado no cliente no mesmo instante por ser o sinal de conversão mais próximo disponível |
| `subscription_started` | `plan_tier` | ✅ | `BillingPage`, ao retornar do Stripe Checkout com `?checkout=success`. O plano é lido de `sessionStorage` (gravado por `useStartCheckout` antes do redirect, já que a `success_url` do Stripe não carrega o plano). **O estado real da assinatura continua vindo exclusivamente do webhook do Stripe** (`stripe-webhook`) — este evento é só telemetria de funil, nunca fonte de verdade de billing (ver `CLAUDE.md` §13) |

## Adicionando um novo evento

1. Adicione o nome e os parâmetros em `AnalyticsEventMap`
   (`src/features/analytics/events.ts`).
2. Chame `track('nome_do_evento', { ... })` no ponto de conversão real —
   preferencialmente no `onSuccess` do hook de mutation (React Query) ou,
   quando a ação não passa por uma mutation (ex. carrinho via Zustand,
   navegação), no handler mais próximo da ação do usuário.
3. Atualize a tabela correspondente neste documento.
4. Nunca envie dados sensíveis (senha, token, e-mail, telefone bruto,
   CPF/CNPJ) como parâmetro de evento.

## Configurando o GA4 a partir do GTM

O container `GTM-TXTFF99H` já está instalado. Falta configurar, dentro do
próprio Google Tag Manager (não requer mudança de código):

1. **Tag de configuração do GA4** — acionador "All Pages", com o
   Measurement ID da propriedade GA4.
2. **Variável de Data Layer** `event_name` → variável de Data Layer `event`.
3. **Uma tag de evento GA4 por linha das tabelas acima** — acionador
   "Custom Event" com o nome do evento, parâmetros mapeados a partir das
   variáveis de Data Layer correspondentes.
4. **Marcar como conversão** no GA4 (Configurar → Eventos) pelo menos:
   `sign_up`, `onboarding_completed`, `trial_started`, `subscription_started`,
   `order_submitted`.
5. Validar no **DebugView** do GA4 e no **Tag Assistant** antes de publicar.

## Boas práticas

1. Nomes de evento e parâmetros em `snake_case`, sempre em inglês.
2. Não duplique eventos: se uma ação já é coberta por um hook compartilhado
   (ex. `cartStore.addItem`), não instrumente de novo em cada chamador.
3. Eventos derivados de mutations do React Query disparam no `onSuccess`,
   nunca antes da confirmação do servidor.
4. `import.meta.env.DEV` sempre loga no console em vez de enviar — use isso
   para validar localmente antes de publicar.
