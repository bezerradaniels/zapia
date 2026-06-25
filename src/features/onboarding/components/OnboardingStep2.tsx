import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowRight02Icon,
  TShirtIcon,
  Dumbbell01Icon,
  SparklesIcon,
  Moon02Icon,
  SmartPhone01Icon,
  RestaurantIcon,
  Bone01Icon,
  Home01Icon,
  FootballIcon,
  BabyBottleIcon,
  ToolsIcon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons'
import { Button, Input, Label } from '@/components/ui'
import { createBrowserClient } from '@/lib/supabase'
import { slugify } from '@/lib/utils/slugify'
import { ROUTES } from '@/config/routes'
import { track } from '@/features/analytics'
import { loadOnboardingSession, saveOnboardingSession } from '../utils/onboardingSession'
import { saveDraft, loadDraft } from '../utils/onboardingDraft'
import { step2Schema, type Step2Values } from '../schemas'
import { cn } from '@/lib/utils'

const STORE_CATEGORIES: { value: string; label: string; icon: IconSvgElement }[] = [
  { value: 'moda', label: 'Moda e Acessórios', icon: TShirtIcon },
  { value: 'suplementos', label: 'Suplementos', icon: Dumbbell01Icon },
  { value: 'beleza', label: 'Beleza e Cosméticos', icon: SparklesIcon },
  { value: 'sexshop', label: 'Sex Shop', icon: Moon02Icon },
  { value: 'eletronicos', label: 'Eletrônicos', icon: SmartPhone01Icon },
  { value: 'alimentos', label: 'Alimentos', icon: RestaurantIcon },
  { value: 'pet', label: 'Pet Shop', icon: Bone01Icon },
  { value: 'casa', label: 'Casa e Decoração', icon: Home01Icon },
  { value: 'esportes', label: 'Esportes', icon: FootballIcon },
  { value: 'infantil', label: 'Infantil', icon: BabyBottleIcon },
  { value: 'servicos', label: 'Serviços', icon: ToolsIcon },
  { value: 'outro', label: 'Outro', icon: MoreHorizontalIcon },
]

export function OnboardingStep2() {
  const navigate = useNavigate()
  const session = loadOnboardingSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const draft = loadDraft<Step2Values>(2)

  const slugSuggestions = session
    ? [
        slugify(session.storeName),
        `${slugify(session.storeName)}-oficial`,
        `${slugify(session.storeName)}-loja`,
      ]
        .filter((s, i, arr) => arr.indexOf(s) === i)
        .slice(0, 3)
    : []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      category: draft?.category ?? '',
      instagram: draft?.instagram ?? '',
      slug: draft?.slug ?? session?.storeSlug ?? '',
    },
  })

  const selectedCategory = watch('category')
  const currentSlug = watch('slug')

  useEffect(() => {
    const { unsubscribe } = watch((values) => saveDraft(2, values))
    return unsubscribe
  }, [watch])

  if (!session) return <Navigate to={ROUTES.onboardingStep1} replace />

  const onSubmit = async (values: Step2Values) => {
    setIsSubmitting(true)
    try {
      const supabase = createBrowserClient()
      const patch: {
        category: string
        instagram?: string
        social_links?: { instagram: string }
        slug?: string
        slug_last_updated_at?: string
      } = { category: values.category }

      if (values.instagram) {
        patch.instagram = values.instagram
        patch.social_links = { instagram: values.instagram }
      }

      if (values.slug !== session.storeSlug) {
        patch.slug = values.slug
        patch.slug_last_updated_at = new Date().toISOString()
      }

      const { error } = await supabase.from('stores').update(patch).eq('id', session.storeId)

      if (error) {
        if (error.code === '23505') {
          setError('slug', { message: 'Este endereço já está em uso. Tente outro.' })
          return
        }
        throw error
      }

      saveOnboardingSession({
        ...session,
        storeSlug: values.slug,
      })
      track('onboarding_step_completed', {
        store_id: session.storeId,
        step: 2,
        step_name: 'sobre_o_negocio',
      })
      navigate(ROUTES.onboardingStep3)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-z-text">Sobre o seu negócio</h1>
        <p className="mt-1 text-sm text-z-text-muted">
          Nos conte mais sobre o que você vende e como quer ser encontrado.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Ramo da sua loja *</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {STORE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setValue('category', cat.value, { shouldValidate: true })}
              aria-pressed={selectedCategory === cat.value}
              className={cn(
                'flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2.5 text-center text-[11px] font-medium leading-tight transition-colors',
                selectedCategory === cat.value
                  ? 'border-z-green bg-z-green/10 text-[#0f574c]'
                  : 'border-slate-300 bg-white text-z-text-muted hover:border-z-green/50',
              )}
            >
              <HugeiconsIcon icon={cat.icon} size={20} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagram" className="text-sm">@ do Instagram</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-z-text-hint">
            @
          </span>
          <Input
            id="instagram"
            placeholder="sualoja"
            className={cn('pl-7 border-slate-300', errors.instagram && 'border-red-400')}
            {...register('instagram')}
            onChange={(e) => {
              const raw = e.target.value
              const afterSlash = raw.split('/').filter(Boolean).pop() ?? ''
              const clean = afterSlash.replace(/[^a-zA-Z0-9._]/g, '')
              setValue('instagram', clean, { shouldValidate: true })
            }}
          />
        </div>
        {errors.instagram && (
          <p className="text-xs text-red-500">{errors.instagram.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug" className="text-sm">Link da sua loja *</Label>
        <div
          className={cn(
            'flex items-center overflow-hidden rounded-lg border bg-white focus-within:border-z-green',
            errors.slug ? 'border-red-400' : 'border-slate-300',
          )}
        >
          <span className="select-none whitespace-nowrap border-r border-slate-300 bg-z-bg px-3 py-2.5 text-sm text-z-text-hint">
            zapia.app/
          </span>
          <input
            id="slug"
            type="text"
            className="h-11 flex-1 bg-white px-3 text-sm outline-none placeholder:text-z-text-hint"
            placeholder="minha-loja"
            {...register('slug')}
          />
        </div>
        {slugSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-z-text-hint">Sugestões:</span>
            {slugSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue('slug', s, { shouldValidate: true })}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  currentSlug === s
                    ? 'border-z-ink bg-z-ink text-white'
                    : 'border-z-border text-z-text-muted hover:border-z-ink/40',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
      </div>

      {errors.root && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Continuar'}
        {!isSubmitting && <HugeiconsIcon icon={ArrowRight02Icon} size={20} />}
      </Button>
    </form>
  )
}
