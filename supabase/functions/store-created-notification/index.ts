// Sends email notification to admin when a new store is created (end of onboarding).
// Requires a valid user JWT — called right after the `stores` row is inserted.
import { requireAuth } from '../_shared/auth.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'daniel.ddsb@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://zapia.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Builds a wa.me link from a BR phone number (accepts E.164 or local format). */
function buildWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const e164digits = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${e164digits}`
}

interface StoreCreatedNotificationRequest {
  name: string
  email: string
  whatsapp_phone: string
  store_name: string
  store_url: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405, headers: corsHeaders })
  }

  try {
    await requireAuth(req)
  } catch {
    return new Response('unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const { name, email, whatsapp_phone, store_name, store_url }: StoreCreatedNotificationRequest =
      await req.json()

    if (!name || !email || !whatsapp_phone || !store_name || !store_url) {
      return new Response('missing_fields', { status: 400, headers: corsHeaders })
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeWhatsapp = escapeHtml(whatsapp_phone)
    const safeStoreName = escapeHtml(store_name)
    const safeStoreUrl = escapeHtml(store_url)
    const whatsappLink = buildWhatsAppLink(whatsapp_phone)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zapia <noreply@zapia.app>',
        to: [ADMIN_EMAIL],
        subject: `Nova loja criada: ${safeStoreName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #34d399;">
              <h2 style="color: #111827; margin-top: 0; font-size: 24px;">Nova loja criada no Zapia</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Um lojista acabou de finalizar o cadastro e criar a loja.</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Nome:</strong> ${safeName}</p>
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>E-mail:</strong> ${safeEmail}</p>
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>WhatsApp:</strong> ${safeWhatsapp}</p>
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px;"><strong>Loja:</strong> ${safeStoreName}</p>
                <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Link da loja:</strong> <a href="${safeStoreUrl}" style="color: #059669;">${safeStoreUrl}</a></p>
              </div>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${whatsappLink}" style="display: inline-block; background-color: #25d366; color: #ffffff; font-weight: bold; font-size: 15px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                  Conversar no WhatsApp
                </a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                Este é um e-mail automático do sistema Zapia. Não responda.
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      return new Response('email_send_failed', { status: 500, headers: corsHeaders })
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('store created notification error:', err)
    return new Response('internal_error', { status: 500, headers: corsHeaders })
  }
})
