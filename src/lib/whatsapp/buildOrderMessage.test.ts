import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsAppLink } from "./index";
import { formatMoney } from "@/lib/format";
import type { CartItem } from "@/stores/cartStore";
import type { Product } from "@/types/domain";

describe("WhatsApp order messaging", () => {
  const mockProduct = {
    id: "prod-1",
    store_id: "store-1",
    name: "Camiseta Dry Fit",
    slug: "camiseta-dry-fit",
    description: null,
    price_in_cents: 8990,
    promo_price_in_cents: null,
    installment_count: null,
    installment_total_in_cents: null,
    cost_in_cents: null,
    stock: 10,
    sku: null,
    barcode: null,
    category: null,
    subcategory: null,
    brand: null,
    unit: null,
    is_active: true,
    is_featured: false,
    images: [],
    variations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Product;

  it("builds a formatted WhatsApp order message without coupon", () => {
    const items: CartItem[] = [
      {
        product: mockProduct,
        quantity: 2,
        selectedVariation: "Tamanho G",
        cartKey: "prod-1::Tamanho G",
      },
    ];

    const message = buildOrderMessage({
      store: { name: "Moda Esportiva", slug: "modaesportiva" },
      items,
      customer: { name: "Marcos Lima", phone: "(11) 98888-7777" },
      totalInCents: 17980,
    });

    expect(message).toContain("🛍️ *Novo pedido recebido!*");
    expect(message).toContain("🏬 *Loja:* Moda Esportiva");
    expect(message).toContain("👤 *Cliente:* Marcos Lima");
    expect(message).toContain("📞 *Telefone:* (11) 98888-7777");
    expect(message).toContain("▫️ 2x Camiseta Dry Fit (Tamanho G)");
    expect(message).toContain(`💰 *Total: ${formatMoney(17980)}*`);
    expect(message).toContain("modaesportiva");
  });

  it("builds an order message including coupon discounts and customer notes", () => {
    const items: CartItem[] = [
      {
        product: mockProduct,
        quantity: 1,
        selectedVariation: null,
        cartKey: "prod-1::",
      },
    ];

    const message = buildOrderMessage({
      store: { name: "Moda Esportiva", slug: "modaesportiva" },
      items,
      customer: {
        name: "Ana Clara",
        notes: "Por favor deixar na portaria do condomínio.",
      },
      totalInCents: 7990,
      coupon: { code: "DESCONTO10", discountInCents: 1000 },
    });

    expect(message).toContain(`Subtotal: ${formatMoney(8990)}`);
    expect(message).toContain(`🎟️ Cupom (DESCONTO10): −${formatMoney(1000)}`);
    expect(message).toContain(`💰 *Total: ${formatMoney(7990)}*`);
    expect(message).toContain("📝 *Observações:* Por favor deixar na portaria do condomínio.");
  });

  it("builds valid wa.me URLs with properly encoded text", () => {
    const link = buildWhatsAppLink("11987654321", "Olá, tenho uma dúvida!");
    expect(link).toContain("https://wa.me/5511987654321?text=");
    expect(link).toContain(encodeURIComponent("Olá, tenho uma dúvida!"));
  });

  it("handles numbers that already include country code 55", () => {
    const link = buildWhatsAppLink("+55 (21) 97777-6666", "Teste");
    expect(link).toBe(`https://wa.me/5521977776666?text=${encodeURIComponent("Teste")}`);
  });
});
