// Sends email notification to admin when a new user signs up.
// Requires a valid user JWT — called right after signInWithPassword on signup.
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

interface SignupNotificationRequest {
  email: string
  name: string
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
    const { email, name }: SignupNotificationRequest = await req.json()

    if (!email || !name) {
      return new Response('missing_fields', { status: 400, headers: corsHeaders })
    }

    const safeName = escapeHtml(name)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zapia <noreply@zapia.app>',
        to: [ADMIN_EMAIL],
        subject: 'Novo cadastro no Zapia',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #34d399;">
              <h2 style="color: #111827; margin-top: 0; font-size: 24px;">Novo cadastro no Zapia</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5;"><strong>${safeName}</strong> acabou de se cadastrar na plataforma.</p>
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
    console.error('signup notification error:', err)
    return new Response('internal_error', { status: 500, headers: corsHeaders })
  }
})
