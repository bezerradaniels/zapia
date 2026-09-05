import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrderById } from "./queries";
import * as supabaseModule from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  createBrowserClient: vi.fn(),
}));

describe("getOrderById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns OrderWithItems combining order fields and items from a single query", async () => {
    const mockOrderData = {
      id: "ord-1",
      store_id: "store-1",
      status: "confirmed",
      customer_name: "Cliente Teste",
      customer_phone: "+5511999999999",
      total_in_cents: 5000,
      items: [
        {
          id: "item-1",
          order_id: "ord-1",
          product_name: "Camiseta",
          price_in_cents: 5000,
          quantity: 1,
        },
      ],
    };

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockOrderData, error: null });
    const orderMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabaseModule.createBrowserClient).mockReturnValue({
      from: fromMock,
    } as never);

    const result = await getOrderById("ord-1");

    expect(fromMock).toHaveBeenCalledWith("orders");
    expect(selectMock).toHaveBeenCalledWith("*, items:order_items(*)");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("ord-1");
    expect(result?.customer_name).toBe("Cliente Teste");
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0].product_name).toBe("Camiseta");
  });

  it("returns null if order is not found", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const orderMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabaseModule.createBrowserClient).mockReturnValue({
      from: fromMock,
    } as never);

    const result = await getOrderById("ord-nonexistent");
    expect(result).toBeNull();
  });
});
