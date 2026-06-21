import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLoadingShell } from '@/components/AppLoadingShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RequireGuest } from '@/components/RequireGuest'
import { ScrollToTop } from '@/components/ScrollToTop'
import { ROUTES } from '@/config/routes'
import { isStoreDomain } from '@/lib/tenant/resolveStore'

// All routes are lazy-loaded so the dashboard pages (which pull in
// react-hook-form + zod) never land in the initial bundle served to public
// catalog / landing visitors. The top-level <Suspense> below covers them.
const LandingPage = lazy(() => import('@/routes/marketing/LandingPage'))
const DashboardLayout = lazy(() => import('@/routes/dashboard/DashboardLayout'))
const DashboardHome = lazy(() => import('@/routes/dashboard/HomePage'))
const BillingPage = lazy(() => import('@/routes/dashboard/BillingPage'))
const OrdersPage = lazy(() => import('@/routes/dashboard/OrdersPage'))
const PricingPage = lazy(() => import('@/routes/marketing/PricingPage'))
const TermsPage = lazy(() => import('@/routes/marketing/TermsPage'))
const PrivacyPage = lazy(() => import('@/routes/marketing/PrivacyPage'))
const TrialSignupPage = lazy(() => import('@/routes/marketing/TrialSignupPage'))
const LoginPage = lazy(() => import('@/routes/auth/LoginPage'))
const SignupPage = lazy(() => import('@/routes/auth/SignupPage'))
const ConfirmEmailPage = lazy(() => import('@/routes/auth/ConfirmEmailPage'))
const ForgotPasswordPage = lazy(() => import('@/routes/auth/ForgotPasswordPage'))
const OnboardingLayout = lazy(() => import('@/routes/dashboard/OnboardingLayout'))
const OnboardingStep1Page = lazy(() => import('@/routes/dashboard/OnboardingStep1Page'))
const OnboardingStep2Page = lazy(() => import('@/routes/dashboard/OnboardingStep2Page'))
const OnboardingStep3Page = lazy(() => import('@/routes/dashboard/OnboardingStep3Page'))
const OnboardingStep4Page = lazy(() => import('@/routes/dashboard/OnboardingStep4Page'))
const OnboardCompletePage = lazy(() => import('@/routes/dashboard/OnboardCompletePage'))
const ProfilePage = lazy(() => import('@/routes/dashboard/ProfilePage'))
const ProductsPage = lazy(() => import('@/routes/dashboard/ProductsPage'))
const NewProductPage = lazy(() => import('@/routes/dashboard/NewProductPage'))
const EditProductPage = lazy(() => import('@/routes/dashboard/EditProductPage'))
const BulkAddProductsPage = lazy(() => import('@/routes/dashboard/BulkAddProductsPage'))
const StoreLayout = lazy(() => import('@/routes/store/StoreLayout'))
const StoreHomePage = lazy(() => import('@/routes/store/StoreHomePage'))
const StorePage = lazy(() => import('@/routes/store/StorePage'))
const ProductPage = lazy(() => import('@/routes/store/ProductPage'))
const CartPage = lazy(() => import('@/routes/store/CartPage'))
const CheckoutPage = lazy(() => import('@/routes/store/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/routes/store/OrderConfirmationPage'))
const StoreAboutPage = lazy(() => import('@/routes/store/StoreAboutPage'))
const CouponRedirectPage = lazy(() => import('@/routes/store/CouponRedirectPage'))
const CatalogPage = lazy(() => import('@/routes/dashboard/CatalogPage'))
const CustomersPage = lazy(() => import('@/routes/dashboard/CustomersPage'))
const NewCustomerPage = lazy(() => import('@/routes/dashboard/NewCustomerPage'))
const EditCustomerPage = lazy(() => import('@/routes/dashboard/EditCustomerPage'))
const SellersPage = lazy(() => import('@/routes/dashboard/SellersPage'))
const CouponsPage = lazy(() => import('@/routes/dashboard/CouponsPage'))
const SupportPage = lazy(() => import('@/routes/dashboard/SupportPage'))
const NewOrderPage = lazy(() => import('@/routes/dashboard/NewOrderPage'))
const NotFoundPage = lazy(() => import('@/routes/NotFoundPage'))
const AdminLayout = lazy(() => import('@/routes/admin/AdminLayout'))
const AdminHomePage = lazy(() => import('@/routes/admin/AdminHomePage'))
const AdminStoresPage = lazy(() => import('@/routes/admin/AdminStoresPage'))
const AdminStorePage = lazy(() => import('@/routes/admin/AdminStorePage'))
const AppProviders = lazy(() => import('@/providers/AppProviders'))
const CookieConsentBanner = lazy(() =>
  import('@/components/CookieConsentBanner').then((module) => ({
    default: module.CookieConsentBanner,
  })),
)

function DeferredCookieConsentBanner() {
  const [canLoad, setCanLoad] = useState(false)

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }
    let idleId: number | undefined
    let timeoutId: number | undefined
    const load = () => setCanLoad(true)

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(load, { timeout: 2200 })
    } else {
      timeoutId = window.setTimeout(load, 1200)
    }

    return () => {
      if (idleId !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [])

  if (!canLoad) return null

  return (
    <Suspense fallback={null}>
      <CookieConsentBanner />
    </Suspense>
  )
}

function StoreRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppProviders><StoreLayout /></AppProviders>}>
        <Route index element={<StoreHomePage />} />
        <Route path="catalogo" element={<StorePage />} />
        <Route path="produto/:slug" element={<ProductPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pedido/:id" element={<OrderConfirmationPage />} />
        <Route path="sobre" element={<StoreAboutPage />} />
        <Route path="c/:slug" element={<CouponRedirectPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AppRoutes() {
  if (isStoreDomain()) return <StoreRoutes />

  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.pricing} element={<PricingPage />} />
      <Route path={ROUTES.terms} element={<TermsPage />} />
      <Route path={ROUTES.privacy} element={<PrivacyPage />} />
      <Route
        path={ROUTES.trialSignup}
        element={<AppProviders><RequireGuest><TrialSignupPage /></RequireGuest></AppProviders>}
      />
      <Route path={ROUTES.login} element={<AppProviders><LoginPage /></AppProviders>} />
      <Route
        path={ROUTES.signup}
        element={<AppProviders><RequireGuest><SignupPage /></RequireGuest></AppProviders>}
      />
      <Route path={ROUTES.confirmEmail} element={<AppProviders><ConfirmEmailPage /></AppProviders>} />
      <Route path={ROUTES.forgotPassword} element={<AppProviders><ForgotPasswordPage /></AppProviders>} />
      <Route path={ROUTES.onboarding} element={<AppProviders><OnboardingLayout /></AppProviders>}>
        <Route index element={<Navigate to="etapa-um" replace />} />
        <Route
          path="etapa-um"
          element={<Suspense fallback={null}><OnboardingStep1Page /></Suspense>}
        />
        <Route
          path="etapa-dois"
          element={<Suspense fallback={null}><OnboardingStep2Page /></Suspense>}
        />
        <Route
          path="etapa-tres"
          element={<Suspense fallback={null}><OnboardingStep3Page /></Suspense>}
        />
        <Route
          path="etapa-quatro"
          element={<Suspense fallback={null}><OnboardingStep4Page /></Suspense>}
        />
      </Route>
      <Route path={ROUTES.onboardComplete} element={<AppProviders><OnboardCompletePage /></AppProviders>} />

      <Route path={ROUTES.dashboard} element={<AppProviders><DashboardLayout /></AppProviders>}>
        <Route path="perfil" element={<ProfilePage />} />
        <Route index element={<DashboardHome />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/novo" element={<NewOrderPage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="catalogo/:section" element={<CatalogPage />} />
        <Route path="categorias" element={<Navigate to="/dashboard/catalogo/categorias" replace />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="clientes/novo" element={<NewCustomerPage />} />
        <Route path="clientes/:id" element={<EditCustomerPage />} />
        <Route path="vendedores" element={<SellersPage />} />
        <Route path="cupons" element={<CouponsPage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="produtos/bulk" element={<BulkAddProductsPage />} />
        <Route path="produtos/novo" element={<NewProductPage />} />
        <Route path="produtos/:id" element={<EditProductPage />} />
        <Route path="assinatura" element={<BillingPage />} />
        <Route path="suporte" element={<SupportPage />} />
      </Route>

      <Route path=":storeSlug" element={<AppProviders><StoreLayout /></AppProviders>}>
        <Route index element={<StoreHomePage />} />
        <Route path="catalogo" element={<StorePage />} />
        <Route path="produto/:slug" element={<ProductPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pedido/:id" element={<OrderConfirmationPage />} />
        <Route path="sobre" element={<StoreAboutPage />} />
        <Route path="c/:slug" element={<CouponRedirectPage />} />
      </Route>

      <Route path={ROUTES.admin} element={<AppProviders><AdminLayout /></AppProviders>}>
        <Route index element={<AdminHomePage />} />
        <Route path="lojas" element={<AdminStoresPage />} />
        <Route path="lojas/:id" element={<AdminStorePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Suspense fallback={<AppLoadingShell />}>
          <AppRoutes />
        </Suspense>
        <DeferredCookieConsentBanner />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
