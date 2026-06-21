import { FunctionsHttpError } from '@supabase/supabase-js'
import { createBrowserClient } from './client'

export class EdgeFunctionError extends Error {
  code: string
  detail?: string
  constructor(code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'EdgeFunctionError'
    this.code = code
    this.detail = detail
  }
}

/**
 * Wraps `supabase.functions.invoke` and surfaces the structured error returned
 * by our Edge Functions (e.g. `{"error":"missing_fields","detail":"..."}`)
 * instead of the opaque "Edge Function returned a non-2xx response" toast.
 */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.functions.invoke<T>(name, { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json()
        const code = (payload?.error as string) ?? 'function_error'
        const detail = (payload?.detail as string) ?? (payload?.message as string)
        throw new EdgeFunctionError(code, detail)
      } catch (parseErr) {
        if (parseErr instanceof EdgeFunctionError) throw parseErr
        // Body wasn't JSON — fall through.
      }
    }
    throw new EdgeFunctionError('function_error', error.message)
  }
  if (!data) throw new EdgeFunctionError('empty_response')
  return data
}
