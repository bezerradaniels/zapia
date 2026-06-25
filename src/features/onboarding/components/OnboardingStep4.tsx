import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { Store01Icon } from '@hugeicons/core-free-icons'
import { Button, Label } from '@/components/ui'
import { ImageCropUploader } from '@/components/forms/ImageCropUploader'
import { patchStore, catalogKeys } from '@/features/catalog'
import { ROUTES } from '@/config/routes'
import { track } from '@/features/analytics'
import { loadOnboardingSession } from '../utils/onboardingSession'
import { saveDraft, loadDraft } from '../utils/onboardingDraft'
import { step4Schema, type Step4Values } from '../schemas'
import { cn } from '@/lib/utils'
import { COLOR_PRESETS } from '@/config/colorPresets'

function isPresetColor(color: string | undefined): boolean {
  return COLOR_PRESETS.includes(color as (typeof COLOR_PRESETS)[number])
}

export function OnboardingStep4() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = loadOnboardingSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const draft = loadDraft<Step4Values>(4)
  const initialColor = draft?.primary_color ?? '#34d399'
  const [useCustomColor, setUseCustomColor] = useState(!isPresetColor(initialColor))

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      primary_color: initialColor,
      logo_url: draft?.logo_url ?? '',
      banner_url: draft?.banner_url ?? '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = watch((values) => saveDraft(4, values))
    return unsubscribe
  }, [watch])

  if (!session) return <Navigate to={ROUTES.onboardingStep1} replace />

  const selectedColor = watch('primary_color')
  const activeColor = selectedColor
  const logoUrl = watch('logo_url')
  const bannerUrl = watch('banner_url')

  const onSubmit = async (values: Step4Values) => {
    setIsSubmitting(true)
    try {
      await patchStore(session.storeId, {
        primary_color: activeColor,
        logo_url: values.logo_url || null,
        banner_url: values.banner_url || null,
      })
      await queryClient.invalidateQueries({ queryKey: catalogKeys.all })

      track('onboarding_step_completed', {
        store_id: session.storeId,
        step: 4,
        step_name: 'visual_da_loja',
      })
      track('onboarding_completed', {
        store_id: session.storeId,
        total_time_seconds: Math.round((Date.now() - (session.startedAt ?? Date.now())) / 1000),
      })

      navigate(ROUTES.onboardComplete)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-z-text">Visual da sua loja</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Personalize as cores e imagens que seus clientes vão ver.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Prévia da vitrine</Label>
        <div className="overflow-hidden rounded-2xl border border-z-border">
          <div
            className="relative flex h-20 items-end bg-cover bg-center"
            style={{
              backgroundColor: activeColor,
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            }}
          >
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <div className="flex items-center gap-3 bg-white p-3">
            <div className="-mt-8 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-z-bg shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <HugeiconsIcon icon={Store01Icon} size={18} className="text-z-text-hint" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-z-text">
                {session.storeName || 'Sua loja'}
              </p>
              <span
                className="mt-1 inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold text-white"
                style={{ backgroundColor: activeColor }}
              >
                Ver catálogo
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm">Cor principal do catálogo</Label>
        <div className="flex flex-col gap-3">
          {/* Preset swatches */}
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                title={preset}
                onClick={() => {
                  setValue('primary_color', preset, { shouldValidate: true })
                  setUseCustomColor(false)
                }}
                className={cn(
                  'relative h-9 w-9 rounded-full transition-transform hover:scale-110',
                  !useCustomColor && selectedColor === preset
                    ? 'ring-2 ring-z-ink ring-offset-2'
                    : '',
                )}
                style={{ backgroundColor: preset }}
              >
                {!useCustomColor && selectedColor === preset && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom color row */}
          <div className="flex items-center gap-2">
            <label className="relative cursor-pointer" title="Escolher cor personalizada">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setUseCustomColor(true)
                  setValue('primary_color', e.target.value, { shouldValidate: true })
                }}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed transition-all hover:scale-110',
                  useCustomColor ? 'border-z-ink ring-2 ring-z-ink ring-offset-2' : 'border-slate-300',
                )}
                style={{ backgroundColor: useCustomColor ? selectedColor : 'transparent' }}
              >
                {!useCustomColor && (
                  <span className="text-lg leading-none text-z-text-hint">+</span>
                )}
                {useCustomColor && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </div>
            </label>
            <input
              type="text"
              value={selectedColor.toUpperCase()}
              onChange={(e) => {
                const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  setUseCustomColor(!isPresetColor(v))
                  setValue('primary_color', v, { shouldValidate: true })
                }
              }}
              maxLength={7}
              placeholder="#000000"
              className="h-9 w-28 rounded-lg border border-slate-300 px-3 text-sm font-mono text-z-text outline-none focus:border-z-green"
            />
            <div
              className="h-9 w-9 rounded-full border border-slate-300 shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Logo da loja</Label>
        <p className="text-xs text-z-text-hint">Proporção 1:1 recomendada. JPG, PNG ou WEBP.</p>
        <Controller
          name="logo_url"
          control={control}
          render={({ field }) => (
            <ImageCropUploader
              bucket="store-logos"
              storeId={session.storeId}
              value={field.value || null}
              onChange={(url) => {
                setValue('logo_url', url ?? '', { shouldDirty: true, shouldValidate: true })
              }}
              aspect={1}
              label="Logo"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Foto de capa do catálogo</Label>
        <p className="text-xs text-z-text-hint">Proporção 16:10 recomendada. JPG, PNG ou WEBP.</p>
        <Controller
          name="banner_url"
          control={control}
          render={({ field }) => (
            <ImageCropUploader
              bucket="store-logos"
              storeId={session.storeId}
              value={field.value || null}
              onChange={(url) => {
                setValue('banner_url', url ?? '', { shouldDirty: true, shouldValidate: true })
              }}
              aspect={16 / 10}
              label="Capa"
            />
          )}
        />
      </div>

      {errors.root && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Finalizando...' : 'Publicar minha loja'}
        {!isSubmitting && <HugeiconsIcon icon={Store01Icon} size={20} />}
      </Button>
    </form>
  )
}
