import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { adminClient } from "../_shared/auth.ts";

const PLAN_LIMITS: Record<string, number | null> = {
  basico: 10,
  avancado: 100,
  pro: 100,
  full: null,
  premium: null,
};

serve(async (req) => {
  // Mercado Pago webhooks can send IPN (query params) or Webhook events (JSON body)
  const url = new URL(req.url);
  const _topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const idFromQuery = url.searchParams.get("id") || url.searchParams.get("data.id");

  let paymentId = idFromQuery;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body?.data?.id) {
        paymentId = String(body.data.id);
      } else if (body?.id) {
        paymentId = String(body.id);
      }
    } catch {
      // Body may be empty or not JSON for some notifications
    }
  }

  if (!paymentId) {
    // Not a payment notification or test ping
    return new Response(JSON.stringify({ status: "ignored" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const mpAccessToken =
    Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ||
    Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ||
    Deno.env.get("MP_ACCESS_TOKEN");
  if (!mpAccessToken) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN not configured in Supabase secrets");
    return new Response("Missing secret", { status: 500 });
  }

  try {
    // 1. Verify payment status directly with Mercado Pago API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!mpRes.ok) {
      console.error(`Failed to fetch payment ${paymentId} from Mercado Pago:`, await mpRes.text());
      return new Response("Payment not found", { status: 200 }); // Return 200 so MP doesn't retry indefinitely
    }

    const payment = await mpRes.json();
    console.log(`Mercado Pago Payment ${paymentId} status: ${payment.status}`);

    if (payment.status !== "approved") {
      // Payment not yet approved (pending, rejected, in_process, etc.)
      return new Response(JSON.stringify({ status: payment.status }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = adminClient();

    // 2. Locate the invoice and store
    let storeId: string | null = null;
    let planId: string = "basico";
    let billingPeriod: string = "monthly";

    if (payment.external_reference) {
      const parts = payment.external_reference.split(":");
      if (parts.length >= 2) {
        storeId = parts[0];
        planId = parts[1];
        if (parts[2]) billingPeriod = parts[2];
      }
    }

    if (!storeId) {
      // Fallback: search by mp_payment_id in invoices
      const { data: inv } = await admin
        .from("invoices")
        .select("store_id, plan_id, billing_period")
        .eq("mp_payment_id", String(paymentId))
        .maybeSingle();

      if (inv) {
        storeId = inv.store_id;
        planId = inv.plan_id || "basico";
        billingPeriod = inv.billing_period || "monthly";
      }
    }

    if (!storeId) {
      console.error(`Could not associate payment ${paymentId} with a store`);
      return new Response("Store not found", { status: 200 });
    }

    // 3. Mark invoice as paid
    const now = new Date();
    await admin
      .from("invoices")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
      })
      .or(`mp_payment_id.eq.${paymentId},and(store_id.eq.${storeId},status.eq.pending)`);

    // 4. Calculate period end
    const periodDays = billingPeriod === "annual" ? 365 : 30;
    const currentPeriodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // 5. Update subscription to active
    const { error: subError } = await admin
      .from("subscriptions")
      .upsert({
        store_id: storeId,
        plan_id: planId as never,
        status: "active",
        gateway: "mercadopago",
        mp_payment_id: String(paymentId),
        current_period_end: currentPeriodEnd.toISOString(),
        trial_ends_at: null,
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      });

    if (subError) {
      console.error("Error updating subscription:", subError);
    } else {
      console.log(`Store ${storeId} subscription updated to active (${planId}) until ${currentPeriodEnd.toISOString()}`);
    }

    // 6. Apply product limits if lojista selected a plan with a limit
    const maxProducts = PLAN_LIMITS[planId];
    if (maxProducts !== null && maxProducts !== undefined) {
      const { error: rpcError } = await admin.rpc("apply_plan_product_limits", {
        target_store: storeId,
        max_allowed: maxProducts,
      });
      if (rpcError) {
        console.error("Error applying product limits:", rpcError);
      }
    }

    return new Response(JSON.stringify({ status: "success", storeId, planId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
