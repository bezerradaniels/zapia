import { Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useSession } from '@/features/auth'
import { useMyStores } from '@/features/catalog'
import { loadOnboardingSession } from '@/features/onboarding/utils/onboardingSession'
import { ROUTES } from '@/config/routes'
import { Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

const STEPS = [
  { path: ROUTES.onboardingStep1, label: 'Sua loja' },
  { path: ROUTES.onboardingStep2, label: 'Sobre o negócio' },
  { path: ROUTES.onboardingStep3, label: 'Pagamento e entrega' },
  { path: ROUTES.onboardingStep4, label: 'Visual' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {STEPS.map((step, i) => (
          <div
            key={step.path}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i + 1 <= current ? 'bg-z-green' : 'bg-z-border',
            )}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-z-text-muted">
        Etapa {current} de {STEPS.length} · {STEPS[current - 1]?.label}
      </p>
    </div>
  )
}

export default function OnboardingLayout() {
  const { session, isLoading } = useSession()
  const myStores = useMyStores(!!session)
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading || myStores.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-z-text-muted">
        Carregando...
      </div>
    )
  }

  if (!session) return <Navigate to={ROUTES.login} replace />

  // Redirect to dashboard only if user already has a store AND there's no
  // active onboarding session (which means they're mid-flow after step 1).
  const hasActiveSession = !!loadOnboardingSession()
  if (!hasActiveSession && myStores.data && myStores.data.length > 0) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const currentStep = STEPS.findIndex((s) => location.pathname === s.path) + 1
  const inWizard = currentStep > 0

  function handleBack() {
    if (currentStep <= 1) {
      navigate(ROUTES.home)
    } else {
      navigate(STEPS[currentStep - 2].path)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {inWizard ? (
        <header className="mx-auto w-full max-w-lg px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label={currentStep === 1 ? 'Sair' : 'Voltar'}
              className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-z-border bg-white text-z-text transition-colors hover:bg-z-bg2"
            >
              <HugeiconsIcon icon={currentStep === 1 ? Cancel01Icon : ArrowLeft02Icon} size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Logo height={20} />
              <span className="h-[7px] w-[7px] rounded-full bg-[#10b981]" />
            </div>
            <Link
              to={ROUTES.home}
              className="w-10 text-right text-[12.5px] font-semibold text-z-text-muted hover:text-z-text"
            >
              Sair
            </Link>
          </div>
          <div className="mt-3.5">
            <StepIndicator current={currentStep} />
          </div>
        </header>
      ) : (
        <header className="flex justify-center px-4 py-6">
          <Logo height={62} />
        </header>
      )}

      <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">
        <Outlet />
      </div>
    </div>
  )
}
