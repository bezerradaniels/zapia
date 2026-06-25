# Checklist de configuração do GTM (container GTM-TXTFF99H)

Guia para configurar, dentro do próprio Google Tag Manager, o envio dos
eventos já instrumentados no código para o GA4. Nenhum passo aqui exige
alteração de código — é tudo na interface web do GTM.

Referência do que cada evento significa e onde é disparado:
[`docs/ga4-events-mapping.md`](./ga4-events-mapping.md).

## 1. Variáveis de Data Layer

Variáveis → Nova → **Variável de Data Layer**. Nome da variável = nome do
campo no Data Layer (facilita não se perder).

- [ ] `store_id`
- [ ] `method`
- [ ] `step`
- [ ] `step_name`
- [ ] `total_time_seconds`
- [ ] `store_slug`
- [ ] `field`
- [ ] `product_id`
- [ ] `product_name`
- [ ] `has_image`
- [ ] `has_variations`
- [ ] `product_count`
- [ ] `seller_id`
- [ ] `has_dashboard_access`
- [ ] `customer_id`
- [ ] `category_id`
- [ ] `category_name`
- [ ] `coupon_id`
- [ ] `coupon_code`
- [ ] `discount_type`
- [ ] `discount_value`
- [ ] `order_id`
- [ ] `total_value`
- [ ] `item_count`
- [ ] `has_coupon`
- [ ] `old_status`
- [ ] `new_status`
- [ ] `item_id`
- [ ] `item_name`
- [ ] `quantity`
- [ ] `price`
- [ ] `value`
- [ ] `link_type`
- [ ] `search_term`
- [ ] `result_count`
- [ ] `plan_tier`

## 2. Tag de configuração do GA4 (uma única vez)

- [ ] Tags → Nova → **Google Analytics: GA4 Configuration**
- [ ] Measurement ID da propriedade GA4 (`G-XXXXXXXXXX`)
- [ ] Acionador: **All Pages**

## 3. Acionador + tag de evento, um par por evento

Para cada linha: criar um **acionador** (tipo "Evento personalizado", nome
exatamente igual ao da coluna Evento) e uma **tag** ("Google Analytics: GA4
Event", usando a Configuration Tag do passo 2, com o mesmo nome de evento e
os parâmetros mapeados às variáveis do passo 1). Vale incluir `store_id` em
todas, para segmentar relatórios por loja.

### Autenticação

- [ ] `sign_up` — method
- [ ] `login` — method
- [ ] `logout` — (sem parâmetros)

### Onboarding

- [ ] `onboarding_started` — step
- [ ] `onboarding_step_completed` — step, step_name
- [ ] `onboarding_completed` — total_time_seconds

### Loja

- [ ] `store_created` — store_id, store_slug
- [ ] `store_updated` — store_id, field

### Produtos

- [ ] `product_created` — product_id, product_name, has_image, has_variations
- [ ] `product_updated` — product_id
- [ ] `product_deleted` — product_id

### Vendedores

- [ ] `seller_created` — seller_id, has_dashboard_access
- [ ] `seller_updated` — seller_id
- [ ] `seller_deleted` — seller_id

### Clientes

- [ ] `customer_created` — customer_id
- [ ] `customer_updated` — customer_id
- [ ] `customer_deleted` — customer_id

### Categorias

- [ ] `category_created` — category_id, category_name
- [ ] `category_updated` — category_id
- [ ] `category_deleted` — category_id

### Cupons

- [ ] `coupon_created` — coupon_id, coupon_code, discount_type, discount_value
- [ ] `coupon_updated` — coupon_id
- [ ] `coupon_deleted` — coupon_id
- [ ] `coupon_applied` — coupon_code, discount_value
- [ ] `coupon_removed` — coupon_code

### Pedidos

- [ ] `order_created` — order_id, total_value, item_count, has_coupon
- [ ] `order_status_changed` — order_id, old_status, new_status

### Vitrine pública / e-commerce

- [ ] `view_item` — item_id, item_name
- [ ] `add_to_cart` — item_id, item_name, quantity, price
- [ ] `remove_from_cart` — item_id, quantity
- [ ] `begin_checkout` — item_count, value
- [ ] `order_submitted` — order_id, value, item_count, has_coupon

### Engajamento

- [ ] `share_link_copied` — link_type, item_id
- [ ] `search_performed` — search_term, result_count

### Faturamento

- [ ] `pricing_page_viewed` — (sem parâmetros)
- [ ] `free_plan_started` — plan_tier
- [ ] `subscription_started` — plan_tier

## 4. Marcar conversões no GA4

GA4 → Administrador → Eventos → marcar como conversão pelo menos:

- [ ] `sign_up`
- [ ] `free_plan_started`
- [ ] `subscription_started`
- [ ] `order_submitted`
- [ ] `onboarding_completed`

## 5. Testar antes de publicar

- [ ] Build de produção ou `npm run preview` (em `npm run dev` os eventos só
      logam no console, não chegam no GTM)
- [ ] Aceitar o cookie de consentimento no site testado (sem isso o GTM nem
      carrega — ver `zapia_cookie_consent` no `localStorage`)
- [ ] Ativar o **Preview Mode** do GTM e percorrer os fluxos principais
      (cadastro, onboarding completo, navegação na vitrine, carrinho,
      checkout)
- [ ] Confirmar no **DebugView** do GA4 que cada evento chega com os
      parâmetros certos
- [ ] **Enviar → Publicar** no GTM
