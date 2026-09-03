import { createBrowserClient } from "@/lib/supabase";
import type { CustomPlanLimits, PlanId } from "@/types/domain";

export async function deleteAdminStore(storeId: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.rpc("admin_delete_store", {
    p_store_id: storeId,
  });
  if (error) throw error;
}

export async function grantComplimentary(
  storeId: string,
  planId: PlanId,
  expiresAt: string,
  notes?: string,
  customLimits?: CustomPlanLimits | null,
): Promise<void> {
  const supabase = createBrowserClient();

  // 1. Tenta a RPC administrativa primeiro
  const { error: rpcError } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: Error | null }>;
    }
  ).rpc("admin_grant_complimentary", {
    p_store_id: storeId,
    p_plan_id: planId,
    p_expires_at: expiresAt,
    p_notes: notes,
    p_custom_limits: customLimits ?? null,
  });

  if (!rpcError) return;

  // 2. Fallback direto caso a RPC ainda não esteja na migration do Supabase remoto
  const payload: Record<string, unknown> = {
    plan_id: planId,
    status: "active",
    current_period_end: new Date(expiresAt).toISOString(),
    trial_ends_at: null,
    custom_limits: customLimits ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("subscriptions")
    .upsert({
      store_id: storeId,
      ...payload,
    });

  if (updateError) throw updateError;
}
