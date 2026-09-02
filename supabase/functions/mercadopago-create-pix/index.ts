import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getCorsHeaders, preflight, jsonResponse } from "../_shared/cors.ts";
import { adminClient, requireStoreMember } from "../_shared/auth.ts";

const PLAN_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  basico: { monthly: 990, annual: 8990, name: "Básico" },
  avancado: { monthly: 1490, annual: 13990, name: "Avançado" },
  pro: { monthly: 1490, annual: 13990, name: "Avançado" },
  full: { monthly: 2990, annual: 19990, name: "Full" },
  premium: { monthly: 2990, annual: 19990, name: "Full" },
};

serve(async (req) => {
  const p = preflight(req);
  if (p) return p;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, req });
  }

  try {
    const { storeId, planId, billingPeriod = "monthly" } = await req.json();

    if (!storeId || !planId) {
      return jsonResponse(
        { error: "missing_fields", detail: "storeId e planId são obrigatórios" },
        { status: 400, req },
      );
    }

    // Verify user owns/is member of the store
    const { userId } = await requireStoreMember(req, storeId);

    const planInfo = PLAN_PRICES[planId];
    if (!planInfo) {
      return jsonResponse(
        { error: "invalid_plan", detail: "Plano inválido" },
        { status: 400, req },
      );
    }

    const amountInCents =
      billingPeriod === "annual" ? planInfo.annual : planInfo.monthly;
    const transactionAmount = amountInCents / 100;

    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      return jsonResponse(
        {
          error: "missing_secret",
          detail: "MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor",
        },
        { status: 500, req },
      );
    }

    const admin = adminClient();

    // Fetch user profile info
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    const payerEmail = profile?.email || "cliente@zapia.app";
    const payerName = profile?.full_name || "Lojista Zapia";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const notificationUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;

    const mpBody = {
      transaction_amount: transactionAmount,
      description: `Zapia - Plano ${planInfo.name} (${billingPeriod === "annual" ? "Anual" : "Mensal"})`,
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
        first_name: payerName,
      },
      notification_url: notificationUrl,
      external_reference: `${storeId}:${planId}:${billingPeriod}`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${storeId}-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(mpBody),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error("Mercado Pago PIX Error:", mpData);
      return jsonResponse(
        {
          error: "mercadopago_error",
          detail: mpData.message || "Erro ao gerar PIX no Mercado Pago",
        },
        { status: 400, req },
      );
    }

    const mpPaymentId = String(mpData.id);
    const pointOfInteraction = mpData.point_of_interaction?.transaction_data;
    const qrCode = pointOfInteraction?.qr_code || "";
    const qrCodeBase64 = pointOfInteraction?.qr_code_base64 || "";
    const expiresAt = mpData.date_of_expiration || null;

    // Create invoice entry in Supabase
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .insert({
        store_id: storeId,
        plan_id: planId,
        billing_period: billingPeriod,
        gateway: "mercadopago",
        mp_payment_id: mpPaymentId,
        amount_in_cents: amountInCents,
        status: "pending",
        pix_qr_code: qrCode,
        pix_qr_code_base64: qrCodeBase64,
        pix_expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
    }

    return jsonResponse(
      {
        invoiceId: invoice?.id || null,
        mpPaymentId,
        qrCode,
        qrCodeBase64,
        expiresAt,
        amountInCents,
        planName: planInfo.name,
      },
      { status: 200, req },
    );
  } catch (err: any) {
    console.error("Unhandled error creating PIX:", err);
    return jsonResponse(
      {
        error: "internal_error",
        detail: err?.message || "Erro interno ao processar pagamento",
      },
      { status: 500, req },
    );
  }
});
