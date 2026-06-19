import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { startCheckoutSession } from '../api/mutations'
import { billingErrorMessage } from '../utils/errorMessage'
import type { PlanId } from '@/types/domain'

export function useStartCheckout() {
  return useMutation({
    mutationFn: ({
      storeId,
      planId,
      billingPeriod = 'monthly',
    }: {
      storeId: string
      planId: PlanId
      billingPeriod?: 'monthly' | 'annual'
    }) => startCheckoutSession(storeId, planId, billingPeriod),
    onSuccess: (url, { planId }) => {
      // Stashed so BillingPage can attribute the `subscription_started`
      // analytics event on the `?checkout=success` return — Stripe's
      // success_url carries no plan info.
      try {
        sessionStorage.setItem('zapia_checkout_plan', planId)
      } catch {
        // ignore
      }
      // Stripe Checkout is hosted; redirect the whole page so the back button
      // returns the user to the dashboard cleanly.
      window.location.href = url
    },
    onError: (err) => {
      toast.error('Não foi possível abrir o checkout', {
        description: billingErrorMessage(err),
      })
    },
  })
}
