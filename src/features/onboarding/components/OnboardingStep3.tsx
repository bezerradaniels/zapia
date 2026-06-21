import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { Button, Label } from '@/components/ui'
import { RoundMultiCheck } from '@/components/forms/RoundMultiCheck'
import { RoundSingleCheck } from '@/components/forms/RoundSingleCheck'
import { DeliveryHoursEditor } from '@/components/forms/DeliveryHoursEditor'
import { DeliveryAreaCustomLocations } from '@/components/forms/DeliveryAreaCustomLocations'
import { patchStore } from '@/features/catalog'
import { ROUTES } from '@/config/routes'
import { track } from '@/features/analytics'
import { loadOnboardingSession } from '../utils/onboardingSession'
import { saveDraft, loadDraft } from '../utils/onboardingDraft'
import { step3Schema, type Step1Values, type Step3Values } from '../schemas'

const PAYMENT_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'debit_card', label: 'Cartão de débito' },
  { value: 'bank_transfer', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'payment_link', label: 'Link de pagamento' },
]

const SHIPPING_OPTIONS = [
  { value: 'delivery', label: 'Entrega em domicílio' },
  { value: 'pickup_in_store', label: 'Retirada na loja' },
  { value: 'digital', label: 'Entrega digital' },
]

const DELIVERY_AREA_OPTIONS = [
  { value: 'state_only', label: 'Apenas meu estado' },
  { value: 'brazil', label: 'Brasil inteiro' },
  { value: 'worldwide', label: 'Mundo inteiro' },
  { value: 'digital_only', label: 'Apenas digital' },
  { value: 'custom', label: 'Personalizado' },
]

export function OnboardingStep3() {
  const navigate = useNavigate()
  const session = loadOnboardingSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const draft = loadDraft<Step3Values>(3)
  const step1Draft = loadDraft<Step1Values>(1)

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      accepted_payment_methods: draft?.accepted_payment_methods ?? [],
      accepted_shipping_methods: draft?.accepted_shipping_methods ?? [],
      delivery_hours: draft?.delivery_hours ?? [{ days: 'all', start: '08:00', end: '18:00' }],
      delivery_area_scope: draft?.delivery_area_scope ?? 'city_only',
      delivery_area_custom_locations: draft?.delivery_area_custom_locations ?? [],
    },
  })

  const deliveryAreaOptions = [
    {
      value: 'city_only',
      label: step1Draft?.address_city ? `Apenas na cidade (${step1Draft.address_city})` : 'Apenas na cidade',
    },
    ...DELIVERY_AREA_OPTIONS,
  ]

  useEffect(() => {
    const { unsubscribe } = watch((values) => saveDraft(3, values))
    return unsubscribe
  }, [watch])

  if (!session) return <Navigate to={ROUTES.onboardingStep1} replace />

  const onSubmit = async (values: Step3Values) => {
    setIsSubmitting(true)
    try {
      await patchStore(session.storeId, {
        accepted_payment_methods: values.accepted_payment_methods,
        accepted_shipping_methods: values.accepted_shipping_methods,
        delivery_hours: values.delivery_hours,
        delivery_area_scope: values.delivery_area_scope,
        delivery_area_custom_locations: values.delivery_area_custom_locations ?? [],
      })
      track('onboarding_step_completed', {
        store_id: session.storeId,
        step: 3,
        step_name: 'pagamento_e_entrega',
      })
      navigate(ROUTES.onboardingStep4)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-z-text">Pagamento e entrega</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Informe como seus clientes podem pagar e receber os pedidos.
        </p>
      </div>

      {/* Payment methods */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Formas de pagamento aceitas *</Label>
        <Controller
          name="accepted_payment_methods"
          control={control}
          render={({ field }) => (
            <RoundMultiCheck
              options={PAYMENT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.accepted_payment_methods && (
          <p className="text-xs text-red-500">{errors.accepted_payment_methods.message}</p>
        )}
      </div>

      {/* Shipping methods */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Formas de entrega *</Label>
        <Controller
          name="accepted_shipping_methods"
          control={control}
          render={({ field }) => (
            <RoundMultiCheck
              options={SHIPPING_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.accepted_shipping_methods && (
          <p className="text-xs text-red-500">{errors.accepted_shipping_methods.message}</p>
        )}
      </div>

      {/* Delivery hours */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm">Horários de atendimento</Label>
          <p className="mt-0.5 text-xs text-z-text-muted">
            Informe os horários em que seus clientes podem fazer pedidos.
          </p>
        </div>
        <Controller
          name="delivery_hours"
          control={control}
          render={({ field }) => (
            <DeliveryHoursEditor value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Delivery area */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Local de entrega *</Label>
        <Controller
          name="delivery_area_scope"
          control={control}
          render={({ field }) => (
            <RoundSingleCheck options={deliveryAreaOptions} value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.delivery_area_scope && (
          <p className="text-xs text-red-500">{errors.delivery_area_scope.message}</p>
        )}
        {watch('delivery_area_scope') === 'custom' && (
          <Controller
            name="delivery_area_custom_locations"
            control={control}
            render={({ field }) => (
              <DeliveryAreaCustomLocations value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        )}
      </div>

      {errors.root && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate(ROUTES.onboardingStep2)}
          disabled={isSubmitting}
          className="flex-1"
        >
          ← Voltar
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-[2]">
          {isSubmitting ? 'Salvando...' : 'Próxima etapa'}
          {!isSubmitting && <HugeiconsIcon icon={ArrowRight02Icon} size={20} />}
        </Button>
      </div>
    </form>
  )
}
