import { createBrowserClient } from "@/lib/supabase";
import type { Order, OrderItem, OrderWithItems } from "@/types/domain";

export async function listOrdersForStore(storeId: string): Promise<Order[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { items, ...order } = data;

  return {
    ...(order as unknown as Order),
    items: (items as unknown as OrderItem[]) ?? [],
  };
}
