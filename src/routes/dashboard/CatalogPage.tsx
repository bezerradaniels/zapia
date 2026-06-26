import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'
import { LockedIcon, StoreLocationIcon, EyeIcon, ShoppingCart01Icon, InstagramIcon, NewTwitterIcon, FacebookIcon, YoutubeIcon, TiktokIcon, Globe02Icon, Settings01Icon, PaintBrush01Icon, ContactIcon, GoogleIcon, FileDownloadIcon, Alert01Icon, Add01Icon, Edit02Icon, Delete02Icon, ArrowDown01Icon, ArrowRight02Icon, CheckmarkCircle02Icon, Cancel01Icon, CreditCardIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  updateStoreSchema,
  useUpdateStore,
  useGenerateStoreCopy,
  useSlugAvailability,
  type UpdateStoreInput,
  type StoreCopyKind,
} from '@/features/catalog'
import { useProducts } from '@/features/products'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from '@/features/categories'
import { useActiveStore, buildStoreUrl, ROOT_DOMAIN } from '@/lib/tenant'
import { usePlanLimits } from '@/features/billing'
import { useCatalogPdf } from '@/lib/pdf'
import { fromE164BR } from '@/lib/br'
import { PhoneInput } from '@/components/forms/PhoneInput'
import { ImageCropUploader } from '@/components/forms/ImageCropUploader'
import { RoundMultiCheck } from '@/components/forms/RoundMultiCheck'
import { RoundSingleCheck } from '@/components/forms/RoundSingleCheck'
import { DeliveryAreaCustomLocations } from '@/components/forms/DeliveryAreaCustomLocations'
import { DeliveryHoursEditor } from '@/components/forms/DeliveryHoursEditor'
import { GalleryUploader } from '@/components/forms/GalleryUploader'
import { Button, Combobox, Field, Textarea, Label, AiGenerateButton } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { track } from '@/features/analytics'
import { cn } from '@/lib/utils'
import { COLOR_PRESETS } from '@/config/colorPresets'
import { STATES } from '@/lib/br'
import { useCities } from '@/features/onboarding/hooks/useCities'

type TabId =
  | 'gerais'
  | 'aparencia'
  | 'contato'
  | 'pedidos'
  | 'pagamento'
  | 'entrega'
  | 'categorias'
  | 'links'
  | 'site'

const TABS: { id: TabId; label: string; icon?: typeof Settings01Icon }[] = [
  { id: 'gerais',     label: 'Gerais',    icon: Settings01Icon },
  { id: 'aparencia',  label: 'Aparência', icon: PaintBrush01Icon },
  { id: 'site',       label: 'Site',      icon: Globe02Icon },
  { id: 'contato',    label: 'Contato',   icon: ContactIcon },
  { id: 'pedidos',    label: 'Pedidos',   icon: ShoppingCart01Icon },
  { id: 'pagamento',  label: 'Pagamento', icon: LockedIcon },
  { id: 'entrega',    label: 'Entrega',   icon: StoreLocationIcon },
  { id: 'categorias', label: 'Categorias', icon: LockedIcon },
  { id: 'links',      label: 'Links',      icon: EyeIcon },
]

const TAB_IDS = new Set<TabId>(TABS.map((tab) => tab.id))
const STATE_OPTIONS = STATES.map((state) => ({ value: state.uf, label: state.name }))
const PAYMENT_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão' },
  { value: 'debit_card', label: 'Débito' },
  { value: 'bank_transfer', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'payment_link', label: 'Link de pagamento' },
]
const SHIPPING_OPTIONS = [
  { value: 'delivery', label: 'Domicílio' },
  { value: 'pickup_in_store', label: 'Retirada na loja' },
  { value: 'digital', label: 'Digital' },
]

function labelsFor(values: string[] | undefined, options: { value: string; label: string }[]): string {
  const labels = (values ?? [])
    .map((value) => options.find((option) => option.value === value)?.label)
    .filter(Boolean)
  return labels.length > 0 ? labels.join(' · ') : 'Não configurado'
}

function isTabId(value: string | undefined): value is TabId {
  return !!value && TAB_IDS.has(value as TabId)
}

function catalogSectionPath(section: TabId): string {
  return `${ROUTES.dashboardCatalog}/${section}`
}

/** Most frequent product category, used as real context for AI copy
 * generation instead of letting the model guess the store's segment. */
function mostCommonProductCategory(products: { category: string | null }[]): string | undefined {
  const counts = new Map<string, number>()
  for (const p of products) {
    if (!p.category) continue
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  let best: string | undefined
  let bestCount = 0
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category
      bestCount = count
    }
  }
  return best
}

/* -------------------------------------------------------------------------- */
/* CategoriesTab — reads categories derived from product.category field       */
/* -------------------------------------------------------------------------- */

type CategoryModalState =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'edit'; category: Category }

function CategoriesTab({ storeId }: { storeId: string }) {
  const products = useProducts(storeId)
  const categoriesQuery = useCategories(storeId)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory(storeId)
  const deleteCategory = useDeleteCategory(storeId)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<CategoryModalState | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)

  const productList = products.data ?? []
  const categories = categoriesQuery.data ?? []
  const topLevel = categories.filter((c) => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)
  const productCountFor = (name: string) =>
    productList.filter((p) => p.category === name || p.subcategory === name).length
  const uncategorizedCount = productList.filter((p) => !p.category).length

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateModal = (parentId: string | null) => {
    setModal({ mode: 'create', parentId })
    setModalName('')
    setModalError(null)
  }

  const openEditModal = (category: Category) => {
    setModal({ mode: 'edit', category })
    setModalName(category.name)
    setModalError(null)
  }

  const closeModal = () => {
    setModal(null)
    setModalName('')
    setModalError(null)
  }

  const isSaving = createCategory.isPending || updateCategory.isPending

  const handleSaveModal = async () => {
    const name = modalName.trim()
    if (!name) {
      setModalError('Informe um nome.')
      return
    }
    try {
      if (modal?.mode === 'create') {
        await createCategory.mutateAsync({ store_id: storeId, name, parent_id: modal.parentId })
        if (modal.parentId) setExpandedIds((prev) => new Set(prev).add(modal.parentId!))
      } else if (modal?.mode === 'edit') {
        await updateCategory.mutateAsync({ id: modal.category.id, name })
      }
      closeModal()
    } catch {
      setModalError('Não foi possível salvar. Tente novamente.')
    }
  }

  const handleDelete = async (category: Category) => {
    const subs = childrenOf(category.id)
    const message =
      subs.length > 0
        ? `Excluir "${category.name}" e suas ${subs.length} subcategoria(s)?`
        : `Excluir a categoria "${category.name}"?`
    if (!confirm(message)) return
    await deleteCategory.mutateAsync(category.id)
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={LockedIcon} size={20} className="text-z-text-muted" />
          <h2 className="text-lg font-semibold">Categorias do catálogo</h2>
        </div>
        <Button type="button" size="sm" onClick={() => openCreateModal(null)}>
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Nova categoria
        </Button>
      </div>

      <div className="flex flex-col gap-4 ml-7">
        <p className="-mt-2 text-sm text-z-text-muted">
          Organize seus produtos em categorias e subcategorias. Elas aparecem na tela inicial do
          catálogo, em ordem alfabética, e seus clientes podem filtrar os produtos usando elas.
        </p>

        {categoriesQuery.isLoading ? (
          <p className="text-sm text-z-text-muted">Carregando categorias...</p>
        ) : topLevel.length === 0 ? (
          <div className="rounded-xl border border-dashed border-z-border p-6 text-center">
            <p className="text-sm font-medium text-z-text">Nenhuma categoria cadastrada</p>
            <p className="mt-1 text-xs text-z-text-hint">
              Crie categorias para organizar seus produtos e facilitar a busca no catálogo.
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={() => openCreateModal(null)}>
              <HugeiconsIcon icon={Add01Icon} size={14} />
              Adicionar categoria
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topLevel.map((cat) => {
              const subs = childrenOf(cat.id)
              const isExpanded = expandedIds.has(cat.id)
              const count = productCountFor(cat.name)

              return (
                <div key={cat.id} className="rounded-xl border border-z-border bg-z-bg">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      disabled={subs.length === 0}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2 disabled:opacity-30"
                    >
                      <HugeiconsIcon icon={isExpanded ? ArrowDown01Icon : ArrowRight02Icon} size={14} />
                    </button>

                    <span className="flex-1 font-medium text-z-text">{cat.name}</span>

                    {count > 0 && (
                      <span className="rounded-full bg-z-border px-2 py-0.5 text-[11px] text-z-text-muted">
                        {count} {count === 1 ? 'produto' : 'produtos'}
                      </span>
                    )}
                    {subs.length > 0 && (
                      <span className="rounded-full bg-z-border px-2 py-0.5 text-[11px] text-z-text-muted">
                        {subs.length} {subs.length === 1 ? 'sub' : 'subs'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => openCreateModal(cat.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
                      aria-label="Adicionar subcategoria"
                      title="Adicionar subcategoria"
                    >
                      <HugeiconsIcon icon={Add01Icon} size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-bg2"
                      aria-label="Editar categoria"
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                      aria-label="Excluir categoria"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </button>
                  </div>

                  {isExpanded && subs.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t border-z-border bg-white px-4 py-3">
                      {subs.map((sub) => {
                        const subCount = productCountFor(sub.name)
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 rounded-lg border border-z-border bg-z-bg px-3 py-2"
                          >
                            <span className="text-z-text-hint">└</span>
                            <span className="flex-1 text-sm text-z-text">{sub.name}</span>
                            {subCount > 0 && (
                              <span className="rounded-full bg-z-border px-2 py-0.5 text-[11px] text-z-text-muted">
                                {subCount} {subCount === 1 ? 'produto' : 'produtos'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(sub)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-z-text-muted hover:bg-z-bg2"
                              aria-label="Editar subcategoria"
                            >
                              <HugeiconsIcon icon={Edit02Icon} size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sub)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-z-text-muted hover:bg-z-primary/10 hover:text-z-primary"
                              aria-label="Excluir subcategoria"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {uncategorizedCount > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-z-border px-4 py-3">
                <span className="text-sm text-z-text-muted">Sem categoria</span>
                <span className="rounded-full bg-z-border px-2 py-0.5 text-xs text-z-text-hint">
                  {uncategorizedCount} {uncategorizedCount === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold">
              {modal.mode === 'edit'
                ? 'Editar categoria'
                : modal.parentId
                  ? 'Nova subcategoria'
                  : 'Nova categoria'}
            </h3>
            <Field
              label="Nome"
              placeholder="Ex.: Bebidas"
              value={modalName}
              onChange={(e) => {
                setModalName(e.target.value)
                setModalError(null)
              }}
              maxLength={60}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveModal()
                }
              }}
            />
            {modalError && <p className="text-xs text-destructive">{modalError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveModal} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function MobileCatalogCard({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: typeof Settings01Icon
  title: string
  subtitle: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="rounded-[22px] border border-z-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4efe7] text-z-text">
          <HugeiconsIcon icon={icon} size={25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-extrabold leading-tight text-z-text">{title}</span>
          <span className="block truncate text-base font-medium leading-tight text-z-text-hint">
            {subtitle}
          </span>
        </span>
        <HugeiconsIcon
          icon={open ? ArrowDown01Icon : ArrowRight02Icon}
          size={22}
          className={cn('shrink-0 text-z-text-hint transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-5 flex flex-col gap-4 border-t border-z-border pt-5">{children}</div>}
    </section>
  )
}

function InfoValue({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-extrabold text-z-text-muted">{label}</span>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-z-border bg-z-bg2 px-4 text-base font-extrabold text-z-text">
        {swatch && <span className="h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />}
        <span className="min-w-0 truncate">{value}</span>
      </div>
    </div>
  )
}

function BottomSheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-50/80 backdrop-blur-[1px] lg:hidden">
      <button type="button" aria-label="Fechar" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4 shadow-2xl">
        <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-z-border" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-z-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-z-text-muted hover:bg-z-bg2"
            aria-label="Fechar"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function CatalogPage() {
  const { section } = useParams<{ section?: string }>()
  const { store } = useActiveStore()
  const updateStore = useUpdateStore()
  const limits = usePlanLimits(store?.id)
  const canTheme = limits.canUse('theme')
  const canPdf = limits.canUse('pdf')
  const canGallery = limits.canUse('gallery')
  const canAi = limits.canUse('ai')
  const products = useProducts(store?.id)
  const categoriesQuery = useCategories(store?.id)
  const createCategory = useCreateCategory()
  const { download: downloadPdf, isGenerating: isGeneratingPdf } = useCatalogPdf()
  const { generate: generateStoreCopy } = useGenerateStoreCopy()
  const [generatingKind, setGeneratingKind] = useState<StoreCopyKind | null>(null)
  const [mobileOpenCard, setMobileOpenCard] = useState<'gerais' | 'visual' | 'contato' | 'pagamento' | 'categorias'>('gerais')
  const [visualModalOpen, setVisualModalOpen] = useState(false)
  const [paymentDeliveryModalOpen, setPaymentDeliveryModalOpen] = useState(false)
  const [mobileCategoryModalOpen, setMobileCategoryModalOpen] = useState(false)
  const [mobileCategoryName, setMobileCategoryName] = useState('')
  const [mobileSubcategoryName, setMobileSubcategoryName] = useState('')
  const activeTab = isTabId(section) ? section : 'gerais'

  const form = useForm<UpdateStoreInput>({
    resolver: zodResolver(updateStoreSchema),
    defaultValues: {
      slug: '',
      name: '',
      primary_color: '#25D366',
      slogan: '',
      whatsapp_phone: '',
      logo_url: '',
      banner_url: '',
      contact_email: '',
      contact_phone: '',
      address_cep: '',
      address_street: '',
      address_neighborhood: '',
      address_number: '',
      address_state: '',
      address_city: '',
      cart_enabled: true,
      require_shipping_choice: false,
      require_cpf: false,
      require_payment_choice: false,
      payment_instructions_title: '',
      payment_instructions_message: '',
      whatsapp_button_enabled: true,
      accepted_payment_methods: ['cash', 'pix', 'credit_card', 'debit_card'],
      accepted_shipping_methods: ['delivery', 'pickup_in_store'],
      delivery_hours: [],
      delivery_area_scope: 'city_only',
      delivery_area_custom_locations: [],
      custom_links: [],
      gallery_images: [],
      social_instagram: '',
      social_facebook: '',
      social_x: '',
      social_youtube: '',
      social_kwai: '',
      social_tiktok: '',
      about_us: '',
      age_restricted: false,
      show_out_of_stock: false,
      product_sort: 'recent',
      home_view: 'catalog',
      cnpj: '',
      gtm_id: '',
    },
  })

  const slugAvailability = useSlugAvailability(form.watch('slug') ?? '', store?.slug ?? '')
  const selectedState = form.watch('address_state')
  const { data: cityOptions = [], isLoading: loadingCities } = useCities(selectedState || null)

  useEffect(() => {
    if (!store) return
    form.reset({
      slug: store.slug,
      name: store.name,
      primary_color: store.primary_color,
      slogan: store.slogan ?? '',
      whatsapp_phone: store.whatsapp_phone ? fromE164BR(store.whatsapp_phone) : '',
      logo_url: store.logo_url ?? '',
      banner_url: store.banner_url ?? '',
      contact_email: store.contact_email ?? '',
      contact_phone: store.contact_phone ? fromE164BR(store.contact_phone) : '',
      address_cep: store.address_cep ?? '',
      address_street: store.address_street ?? '',
      address_neighborhood: store.address_neighborhood ?? '',
      address_number: store.address_number ?? '',
      address_state: store.address_state ?? '',
      address_city: store.address_city ?? '',
      cart_enabled: store.cart_enabled ?? true,
      require_shipping_choice: store.require_shipping_choice ?? false,
      require_cpf: store.require_cpf ?? false,
      require_payment_choice: store.require_payment_choice ?? false,
      payment_instructions_title: store.payment_instructions_title ?? '',
      payment_instructions_message: store.payment_instructions_message ?? '',
      whatsapp_button_enabled: store.whatsapp_button_enabled ?? true,
      accepted_payment_methods: store.accepted_payment_methods ?? ['cash', 'pix', 'credit_card', 'debit_card'],
      accepted_shipping_methods: store.accepted_shipping_methods ?? ['delivery', 'pickup_in_store'],
      delivery_hours: store.delivery_hours ?? [],
      delivery_area_scope: store.delivery_area_scope ?? 'city_only',
      delivery_area_custom_locations: store.delivery_area_custom_locations ?? [],
      custom_links: (store.custom_links ?? []) as { label: string; url: string }[],
      gallery_images: (store.gallery_images ?? []) as string[],
      social_instagram: store.social_links?.instagram ?? '',
      social_facebook: store.social_links?.facebook ?? '',
      social_x: store.social_links?.x ?? '',
      social_youtube: store.social_links?.youtube ?? '',
      social_kwai: store.social_links?.kwai ?? '',
      social_tiktok: store.social_links?.tiktok ?? '',
      about_us: store.about_us ?? '',
      age_restricted: store.age_restricted ?? false,
      show_out_of_stock: store.show_out_of_stock ?? false,
      product_sort: store.product_sort ?? 'recent',
      home_view: store.home_view ?? 'catalog',
      cnpj: store.cnpj ?? '',
      gtm_id: store.gtm_id ?? '',
    })
  }, [store, form])

  if (!store) {
    return <p className="text-sm text-z-text-muted">Carregando...</p>
  }

  const slugLocked = !!(
    store.slug_last_updated_at &&
    new Date().getTime() - new Date(store.slug_last_updated_at).getTime() < 90 * 24 * 60 * 60 * 1000
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const input = { ...values }
      if (input.slug === store.slug) {
        delete input.slug
      }
      await updateStore.mutateAsync({ storeId: store.id, input })
      form.reset(values)
    } catch {
      form.setError('root', {
        message: 'Não foi possível salvar as alterações. Tente novamente.',
      })
    }
  })

  const handleGenerateCopy = async (kind: StoreCopyKind) => {
    setGeneratingKind(kind)
    try {
      const text = await generateStoreCopy({
        storeId: store.id,
        kind,
        name: form.getValues('name') || store.name,
        category: mostCommonProductCategory(products.data ?? []),
        slogan: form.getValues('slogan') || undefined,
        aboutUs: form.getValues('about_us') || undefined,
      })
      form.setValue(kind === 'slogan' ? 'slogan' : 'about_us', text, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } catch {
      toast.error('Não foi possível gerar o texto. Tente novamente.')
    } finally {
      setGeneratingKind(null)
    }
  }

  const logoPreview = form.watch('logo_url')
  const primaryColor = form.watch('primary_color')
  const isPresetColor = (c: string) => COLOR_PRESETS.some((p) => p.toLowerCase() === c?.toLowerCase())
  const categories = categoriesQuery.data ?? []
  const topLevelCategories = categories.filter((category) => !category.parent_id)
  const subcategories = categories.filter((category) => category.parent_id)
  const categoryPreview = topLevelCategories.map((category) => category.name).slice(0, 3).join(', ')
  const subcategoryPreview = subcategories.map((category) => category.name).slice(0, 3).join(', ')
  const deliveryAreaLabel =
    form.watch('delivery_area_scope') === 'city_only'
      ? form.watch('address_city')
        ? `Apenas na cidade (${form.watch('address_city')})`
        : 'Apenas na cidade'
      : {
          city_only: 'Apenas na cidade',
          state_only: 'Apenas meu estado',
          brazil: 'Brasil inteiro',
          worldwide: 'Mundo inteiro',
          digital_only: 'Apenas digital',
          custom: 'Personalizado',
        }[form.watch('delivery_area_scope') ?? 'city_only']

  const handleCreateMobileCategory = async () => {
    const categoryName = mobileCategoryName.trim()
    const subcategoryName = mobileSubcategoryName.trim()
    if (!categoryName) return

    try {
      const category = await createCategory.mutateAsync({
        store_id: store.id,
        name: categoryName,
        parent_id: null,
      })
      if (subcategoryName) {
        await createCategory.mutateAsync({
          store_id: store.id,
          name: subcategoryName,
          parent_id: category.id,
        })
      }
      setMobileCategoryName('')
      setMobileSubcategoryName('')
      setMobileCategoryModalOpen(false)
    } catch {
      toast.error('Não foi possível salvar a categoria. Tente novamente.')
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:max-w-6xl">
      <form id="catalog-mobile-form" onSubmit={onSubmit} className="flex flex-col gap-4 lg:hidden">
        <div className="mb-3 flex items-center gap-4">
          <Link
            to={ROUTES.dashboardMore}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-z-border bg-white text-z-text shadow-sm"
            aria-label="Voltar"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} />
          </Link>
          <h1 className="min-w-0 text-[28px] font-extrabold leading-tight text-z-text">
            Personalizar catálogo
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(buildStoreUrl(store.slug))
            track('share_link_copied', {
              store_id: store.id,
              link_type: 'store',
              item_id: store.id,
            })
          }}
          className="flex items-center gap-3 rounded-[22px] bg-z-ink px-5 py-4 text-left text-white"
        >
          <HugeiconsIcon icon={Globe02Icon} size={22} className="shrink-0 text-z-green" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-extrabold leading-tight">
              {buildStoreUrl(store.slug).replace(/^https?:\/\//, '')}
            </span>
            <span className="block text-sm font-medium text-white/55">Toque para copiar o link</span>
          </span>
        </button>

        <MobileCatalogCard
          icon={Settings01Icon}
          title="Informações gerais"
          subtitle="Nome, slogan, sobre"
          open={mobileOpenCard === 'gerais'}
          onToggle={() => setMobileOpenCard(mobileOpenCard === 'gerais' ? 'visual' : 'gerais')}
        >
          <Field label="Nome da loja" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Field label="Slogan" error={form.formState.errors.slogan?.message} {...form.register('slogan')} />
          <div className="flex flex-col gap-1.5">
            <Label>Sobre</Label>
            <Textarea
              placeholder="Conte um pouco sobre a sua loja..."
              className="min-h-[92px]"
              {...form.register('about_us')}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Controller
                name="address_state"
                control={form.control}
                render={({ field }) => (
                  <Combobox
                    options={STATE_OPTIONS}
                    value={field.value ?? ''}
                    onChange={(value) => {
                      field.onChange(value)
                      form.setValue('address_city', '', { shouldDirty: true })
                    }}
                    placeholder="Digite para buscar..."
                    emptyMessage="Estado não encontrado"
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cidade</Label>
              <Controller
                name="address_city"
                control={form.control}
                render={({ field }) => (
                  <Combobox
                    options={cityOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={!selectedState}
                    loading={loadingCities}
                    placeholder={!selectedState ? 'Selecione o estado' : 'Digite para buscar...'}
                    emptyMessage="Cidade não encontrada"
                  />
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
            <Field label="Endereço" error={form.formState.errors.address_street?.message} {...form.register('address_street')} />
            <Field label="Número" error={form.formState.errors.address_number?.message} {...form.register('address_number')} />
          </div>
        </MobileCatalogCard>

        <MobileCatalogCard
          icon={PaintBrush01Icon}
          title="Logo, banner e cores"
          subtitle="Identidade visual"
          open={mobileOpenCard === 'visual'}
          onToggle={() => setMobileOpenCard(mobileOpenCard === 'visual' ? 'gerais' : 'visual')}
        >
          <InfoValue label="Cor primária" value={`Cor selecionada (${primaryColor})`} swatch={primaryColor} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setVisualModalOpen(true)} className="h-11 rounded-xl border border-z-border bg-z-bg2 text-sm font-semibold text-z-text">
              Adicionar logo
            </button>
            <button type="button" onClick={() => setVisualModalOpen(true)} className="h-11 rounded-xl border border-z-border bg-z-bg2 text-sm font-semibold text-z-text">
              Adicionar banner
            </button>
          </div>
          <button
            type="button"
            onClick={() => setVisualModalOpen(true)}
            className="h-11 rounded-xl bg-z-ink px-4 text-sm font-extrabold text-white"
          >
            Editar identidade visual
          </button>
        </MobileCatalogCard>

        <MobileCatalogCard
          icon={ContactIcon}
          title="WhatsApp e contatos"
          subtitle="Onde os pedidos chegam"
          open={mobileOpenCard === 'contato'}
          onToggle={() => setMobileOpenCard(mobileOpenCard === 'contato' ? 'gerais' : 'contato')}
        >
          <div className="flex flex-col gap-1.5">
            <Label>WhatsApp de pedidos</Label>
            <PhoneInput
              className="h-12 w-full rounded-xl border border-z-border bg-z-bg2 px-4 text-base font-semibold"
              value={form.watch('whatsapp_phone') ?? ''}
              onChange={(masked) => form.setValue('whatsapp_phone', masked, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
          <Field label="E-mail de contato" type="email" {...form.register('contact_email')} />
        </MobileCatalogCard>

        <MobileCatalogCard
          icon={CreditCardIcon}
          title="Pagamento e entrega"
          subtitle="Métodos aceitos"
          open={mobileOpenCard === 'pagamento'}
          onToggle={() => setMobileOpenCard(mobileOpenCard === 'pagamento' ? 'gerais' : 'pagamento')}
        >
          <InfoValue label="Pagamento" value={labelsFor(form.watch('accepted_payment_methods'), PAYMENT_OPTIONS)} />
          <InfoValue label="Entrega" value={labelsFor(form.watch('accepted_shipping_methods'), SHIPPING_OPTIONS)} />
          <InfoValue label="Região de entrega" value={deliveryAreaLabel} />
          <InfoValue label="Horário de funcionamento" value={(form.watch('delivery_hours') ?? []).length > 0 ? `${(form.watch('delivery_hours') ?? []).length} faixa(s) configurada(s)` : 'Não configurado'} />
          <button
            type="button"
            onClick={() => setPaymentDeliveryModalOpen(true)}
            className="h-11 rounded-xl bg-z-ink px-4 text-sm font-extrabold text-white"
          >
            Editar pagamento e entrega
          </button>
        </MobileCatalogCard>

        <MobileCatalogCard
          icon={LockedIcon}
          title="Categorias"
          subtitle={`${topLevelCategories.length} categorias ativas`}
          open={mobileOpenCard === 'categorias'}
          onToggle={() => setMobileOpenCard(mobileOpenCard === 'categorias' ? 'gerais' : 'categorias')}
        >
          <InfoValue label="Categorias" value={categoryPreview || 'Nenhuma categoria cadastrada'} />
          <InfoValue label="Subcategorias" value={subcategoryPreview || 'Nenhuma subcategoria cadastrada'} />
          <button
            type="button"
            onClick={() => setMobileCategoryModalOpen(true)}
            className="h-11 rounded-xl bg-z-ink px-4 text-sm font-extrabold text-white"
          >
            Adicionar categoria
          </button>
        </MobileCatalogCard>
      </form>

      <div className="hidden flex-col gap-5 lg:flex lg:flex-row lg:gap-6">
        {/* Tabs — single row on mobile, vertical sidebar on desktop */}
        <nav className="grid w-full grid-cols-3 gap-1 sticky top-14 z-10 self-start rounded-2xl border border-z-border bg-white/70 p-1.5 shadow-sm backdrop-blur-md lg:static lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none sm:grid-cols-5 lg:grid-cols-1">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              to={catalogSectionPath(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-colors',
                'lg:flex-row lg:w-full lg:gap-2 lg:px-4 lg:py-2.5 lg:text-sm lg:text-left',
                activeTab === tab.id
                  ? 'bg-z-text text-white'
                  : 'text-z-text-muted hover:bg-z-bg2 hover:text-z-text',
              )}
            >
              {tab.icon && <HugeiconsIcon icon={tab.icon} size={15} className="shrink-0" />}
              <span className="lg:hidden">{tab.label}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1">
          {activeTab === 'categorias' && <CategoriesTab storeId={store.id} />}
          <form id="catalog-form" onSubmit={onSubmit} className={cn('flex flex-col gap-4', activeTab === 'categorias' && 'hidden')}>
            {/* INFORMAÇÕES GERAIS */}
            {activeTab === 'gerais' && (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={StoreLocationIcon} size={20} className="text-z-text-muted" />
                      <h2 className="text-base font-semibold">Dados da empresa</h2>
                    </div>
                    {canPdf ? (
                      <button
                        type="button"
                        disabled={isGeneratingPdf || products.isLoading}
                        onClick={() =>
                          downloadPdf(store, products.data ?? [], buildStoreUrl(store.slug))
                        }
                        className="flex items-center gap-2 rounded-lg border border-z-border bg-white px-4 py-2 text-sm font-medium text-z-text transition-colors hover:border-z-green hover:text-[#0bfeda] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={FileDownloadIcon} size={16} />
                        {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
                      </button>
                    ) : (
                      <div
                        title="Disponível nos planos Pro e Premium"
                        className="flex items-center gap-2 rounded-lg border border-dashed border-z-border px-4 py-2 text-sm font-medium text-z-text-muted opacity-50"
                      >
                        <HugeiconsIcon icon={FileDownloadIcon} size={16} />
                        PDF (Pro+)
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nome da loja"
                      error={form.formState.errors.name?.message}
                      {...form.register('name')}
                    />
                    <Field
                      label="CNPJ"
                      placeholder="00.000.000/0001-00"
                      error={form.formState.errors.cnpj?.message}
                      {...form.register('cnpj')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-z-text">Slogan da loja</span>
                      <AiGenerateButton
                        canUse={canAi}
                        isLoading={generatingKind === 'slogan'}
                        onClick={() => handleGenerateCopy('slogan')}
                      />
                    </div>
                    <Field
                      placeholder="Produtos que encantam, feitos para você!"
                      error={form.formState.errors.slogan?.message}
                      {...form.register('slogan')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sobre">Sobre nós</Label>
                      <AiGenerateButton
                        canUse={canAi}
                        isLoading={generatingKind === 'about'}
                        onClick={() => handleGenerateCopy('about')}
                      />
                    </div>
                    <Textarea
                      id="sobre"
                      placeholder="Conte um pouco sobre a sua loja..."
                      className="min-h-[100px]"
                      {...form.register('about_us')}
                    />
                    <p className="text-xs text-z-text-hint">
                      Esta descrição aparecerá na página "Sobre Nós" do seu catálogo.
                    </p>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-8 items-center justify-center rounded border border-z-border text-xs font-bold text-z-text-muted">18+</div>
                      <h2 className="text-base font-semibold">Indicação de idade</h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-11">
                    <span className="text-sm text-z-text-muted">Seus produtos são restritos a adultos?</span>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="true"
                          checked={form.watch('age_restricted') === true}
                          onChange={() => form.setValue('age_restricted', true, { shouldDirty: true })}
                          className="text-[#0bfeda] focus:ring-z-green h-4 w-4" 
                        />
                        <span className="text-sm">Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value="false"
                          checked={form.watch('age_restricted') === false}
                          onChange={() => form.setValue('age_restricted', false, { shouldDirty: true })}
                          className="text-[#0bfeda] focus:ring-z-green h-4 w-4" 
                        />
                        <span className="text-sm">Não</span>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={EyeIcon} size={20} className="text-z-text-muted" />
                      <h2 className="text-base font-semibold">Mostrar produtos fora de estoque no catálogo</h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted">Produtos que estão fora de estoque não serão exibidos em seu catálogo.</p>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-z-border bg-z-bg p-4 cursor-pointer transition-colors hover:bg-z-bg2">
                      <span className="text-sm font-medium">Habilitar a exibição de produtos fora de estoque</span>
                      <div className="relative inline-flex items-center">
                        <input type="checkbox" className="peer sr-only" {...form.register('show_out_of_stock')} />
                        <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                      </div>
                    </label>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-8 items-center justify-center rounded border border-z-border text-xs font-bold text-z-text-muted">A Z</div>
                      <h2 className="text-base font-semibold">Ordem de exibição dos produtos</h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 ml-11">
                    <p className="text-sm text-z-text-muted">Defina como deve ser a ordem de exibição dos seus produtos no seu catálogo</p>

                    <div className="max-w-md">
                      <select 
                        className="w-full rounded-lg border border-z-border bg-white px-3 py-2 text-sm text-z-text focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        {...form.register('product_sort')}
                      >
                        <option value="recent">Mais recentes primeiro</option>
                        <option value="name_asc">Nome: A a Z</option>
                        <option value="name_desc">Nome: Z a A</option>
                        <option value="price_asc">Menor preço primeiro</option>
                        <option value="price_desc">Maior preço primeiro</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={StoreLocationIcon} size={20} className="text-z-text-muted" />
                      <h2 className="text-base font-semibold">Página inicial do catálogo</h2>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-7">
                    <p className="text-sm text-z-text-muted">
                      Escolha o que seus clientes verão ao abrir o link da sua loja. A outra opção
                      continua disponível em sua própria página.
                    </p>

                    <div className="max-w-md">
                      <RoundSingleCheck
                        options={[
                          { value: 'catalog', label: 'Catálogo' },
                          { value: 'about', label: 'Sobre' },
                        ]}
                        value={form.watch('home_view') ?? 'catalog'}
                        onChange={(next) =>
                          form.setValue(
                            'home_view',
                            next as UpdateStoreInput['home_view'],
                            { shouldDirty: true },
                          )
                        }
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* LOGO, BANNER E CORES */}
            {activeTab === 'aparencia' && (
              <section className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-2xl border border-z-border bg-white p-6">
                    <h2 className="text-lg font-semibold">Logo do catálogo</h2>
                    <ImageCropUploader
                      bucket="store-logos"
                      storeId={store.id}
                      label="Clique aqui para enviar um novo logo"
                      aspect={1}
                      value={logoPreview || null}
                      onChange={(url) =>
                        form.setValue('logo_url', url ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      hint="JPG, PNG ou WEBP. Máximo 5 MB."
                    />
                    {form.formState.errors.logo_url && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.logo_url.message}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 rounded-2xl border border-z-border bg-white p-6">
                    <h2 className="text-lg font-semibold">Banner do catálogo</h2>
                    <ImageCropUploader
                      bucket="store-logos"
                      storeId={store.id}
                      label="Banner (hero do catálogo)"
                      aspect={16 / 10}
                      value={form.watch('banner_url') || null}
                      onChange={(url) =>
                        form.setValue('banner_url', url ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      hint="JPG, PNG ou WEBP. Máximo 5 MB. Proporção 16:10."
                    />
                    {form.formState.errors.banner_url && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.banner_url.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Cor do tema do catálogo</h2>
                    {!canTheme && (
                      <Link
                        to={ROUTES.dashboardBilling}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0bfeda] hover:underline"
                      >
                        <HugeiconsIcon icon={LockedIcon} size={11} />
                        Disponível no Pro
                      </Link>
                    )}
                  </div>

                  <fieldset
                    disabled={!canTheme}
                    className={cn('flex flex-col gap-4', !canTheme && 'opacity-60')}
                  >
                    {/* Current color */}
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 shrink-0 rounded-full border border-z-border shadow-sm"
                        style={{ backgroundColor: primaryColor ?? '#000000' }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs text-z-text-hint">Cor atual</span>
                        <span className="text-sm font-mono font-medium text-z-text">
                          {(primaryColor ?? '').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-z-text">Escolher nova cor:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => form.setValue('primary_color', c, { shouldDirty: true, shouldValidate: true })}
                            aria-label={`Cor ${c}`}
                            className={cn(
                              'relative h-[18px] w-[18px] rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100',
                              isPresetColor(primaryColor ?? '') && primaryColor?.toLowerCase() === c.toLowerCase()
                                ? 'ring-2 ring-z-ink ring-offset-2'
                                : '',
                            )}
                            style={{ background: c }}
                          >
                            {isPresetColor(primaryColor ?? '') && primaryColor?.toLowerCase() === c.toLowerCase() && (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Galeria de fotos */}
                <div className="flex flex-col gap-1 rounded-2xl border border-z-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Galeria de fotos</h2>
                    {!canGallery && (
                      <Link
                        to={ROUTES.dashboardBilling}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        ⭐ Fazer upgrade
                      </Link>
                    )}
                  </div>

                  {canGallery ? (
                    <GalleryUploader
                      storeId={store.id}
                      value={(form.watch('gallery_images') ?? []) as string[]}
                      onChange={(urls) => form.setValue('gallery_images', urls, { shouldDirty: true })}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-z-border bg-z-bg2 p-6 text-center">
                      <p className="text-sm text-z-text-muted">
                        Adicione até 10 fotos da sua loja para exibir na página "Sobre".
                      </p>
                      <Link
                        to={ROUTES.dashboardBilling}
                        className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-lg bg-z-green px-4 py-2 text-sm font-semibold text-z-ink hover:opacity-90"
                      >
                        Fazer upgrade para Pro
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* WHATSAPP E CONTATOS */}
            {activeTab === 'contato' && (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold">WhatsApp para receber pedidos</h2>
                  </div>

                  <div className="flex flex-col gap-1.5 ml-11">
                    <span className="text-sm text-z-text-muted">
                      Os pedidos e perguntas chegarão neste número
                    </span>
                    <div className="flex items-center gap-2 max-w-sm mt-1">
                      <select disabled className="h-11 rounded-lg border border-z-border bg-white px-3 text-sm focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 w-24">
                        <option>+55</option>
                      </select>
                      <PhoneInput
                        className="h-11 w-full rounded-lg border border-z-border bg-white px-3.5 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        value={form.watch('whatsapp_phone') ?? ''}
                        onChange={(masked) =>
                          form.setValue('whatsapp_phone', masked, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      />
                    </div>
                    {form.formState.errors.whatsapp_phone && (
                      <span className="text-xs text-destructive">
                        {form.formState.errors.whatsapp_phone.message}
                      </span>
                    )}

                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#FDE047] bg-[#FEF9C3] p-4 text-sm text-[#854D0E]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                        <span className="text-lg">💡</span>
                      </div>
                      <p>
                        <strong>Importante:</strong> Esse é o número que seus clientes vão usar para falar com você e fazer pedidos no WhatsApp 📲
                      </p>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={StoreLocationIcon} size={20} className="text-z-text-muted" />
                      <h2 className="text-base font-semibold">Telefone e e-mail visíveis no seu catálogo</h2>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted">
                      Estes informações estarão visíveis em vários locais do seu catálogo, como rodapé, área de sobre nós e página de pedidos.
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2 items-start">
                      <div className="flex flex-col gap-1.5">
                        <Label>Telefone de contato (Fixo ou Celular)</Label>
                        <div className="flex items-center gap-2">
                          <select className="h-11 rounded-lg border border-z-border bg-white px-3 text-sm w-24">
                            <option>+55</option>
                          </select>
                          <PhoneInput
                            className={`h-11 w-full rounded-lg border bg-white px-3.5 text-sm transition-colors focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20 ${
                              form.formState.errors.contact_phone
                                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                                : 'border-z-border'
                            }`}
                            value={form.watch('contact_phone')}
                            onChange={(val) => {
                              const raw = val.replace(/\D/g, '')
                              let masked = raw
                              if (raw.length > 2) {
                                masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
                              }
                              if (raw.length > 6) {
                                masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`
                              }
                              form.setValue('contact_phone', masked, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }}
                          />
                        </div>
                        {form.formState.errors.contact_phone && (
                          <span className="text-xs text-destructive">
                            {form.formState.errors.contact_phone.message}
                          </span>
                        )}
                      </div>
                      <Field
                        label="E-mail para contato"
                        type="email"
                        placeholder="contato@sualoja.com.br"
                        error={form.formState.errors.contact_email?.message}
                        {...form.register('contact_email')}
                      />
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={StoreLocationIcon} size={20} className="text-z-text-muted" />
                      <h2 className="text-base font-semibold">Endereço da loja (opcional)</h2>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted">
                      Este é o endereço que seus clientes verão em seu catálogo.
                    </p>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 max-w-[200px]">
                        <Field 
                          label="Cep" 
                          placeholder="70.381-515" 
                          error={form.formState.errors.address_cep?.message}
                          {...form.register('address_cep')}
                        />
                      </div>
                      <div className="flex-1">
                        <Field 
                          label="Endereço" 
                          placeholder="Quadra CRS 516 Bloco A" 
                          error={form.formState.errors.address_street?.message}
                          {...form.register('address_street')}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Field 
                          label="Bairro" 
                          placeholder="Asa Sul" 
                          error={form.formState.errors.address_neighborhood?.message}
                          {...form.register('address_neighborhood')}
                        />
                      </div>
                      <div className="flex-1 max-w-[200px]">
                        <Field 
                          label="Número" 
                          placeholder="120" 
                          error={form.formState.errors.address_number?.message}
                          {...form.register('address_number')}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field 
                        label="Estado" 
                        placeholder="Distrito Federal" 
                        error={form.formState.errors.address_state?.message}
                        {...form.register('address_state')}
                      />
                      <Field 
                        label="Cidade" 
                        placeholder="Brasília" 
                        error={form.formState.errors.address_city?.message}
                        {...form.register('address_city')}
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* PEDIDOS E CARRINHO */}
            {activeTab === 'pedidos' && (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <HugeiconsIcon icon={ShoppingCart01Icon} size={20} className="text-z-text-muted" />
                    <h2 className="text-base font-semibold">Carrinho de pedidos</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted -mt-2">
                      Defina se você quer usar ou não um carrinho de comprar no seu catálogo
                    </p>

                    <label className="flex items-center justify-between rounded-xl border border-z-border p-4 cursor-pointer bg-z-bg transition-colors hover:bg-z-bg2">
                      <span className="font-medium text-z-text">Ativar o carrinho</span>
                      <div className="relative inline-flex items-center">
                        <input type="checkbox" className="peer sr-only" {...form.register('cart_enabled')} />
                        <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                      </div>
                    </label>

                    <div className="flex items-start gap-3 rounded-xl border border-[#FDE047] bg-[#FEF9C3] p-4 text-sm text-[#854D0E]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                        <span className="text-lg">💡</span>
                      </div>
                      <p>
                        <strong>Importante:</strong> Com o carrinho ativado, seus clientes poderão montar um pedido com vários produtos e enviá-lo para o WhatsApp da loja.
                      </p>
                    </div>

                    <div className="my-2 h-px w-full bg-z-border" />

                    <h3 className="text-base font-semibold">Dados obrigatórios para finalizar um pedido</h3>
                    <p className="text-sm text-z-text-muted -mt-2">
                      Defina quais informações obrigatórias seus clientes deverão fornecer para finalizar um pedido
                    </p>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center justify-between rounded-xl border border-z-border p-4 cursor-pointer bg-z-bg transition-colors hover:bg-z-bg2">
                        <span className="font-medium text-z-text">Solicitar forma de entrega</span>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" className="peer sr-only" {...form.register('require_shipping_choice')} />
                          <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-z-border p-4 cursor-pointer bg-z-bg transition-colors hover:bg-z-bg2">
                        <span className="font-medium text-z-text">Solicitar o CPF ou CNPJ do cliente</span>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" className="peer sr-only" {...form.register('require_cpf')} />
                          <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-z-border p-4 cursor-pointer bg-z-bg transition-colors hover:bg-z-bg2">
                        <span className="font-medium text-z-text">Solicitar forma de pagamento</span>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" className="peer sr-only" {...form.register('require_payment_choice')} />
                          <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                        </div>
                      </label>
                    </div>

                    <div className="my-2 h-px w-full bg-z-border" />

                    <h3 className="text-base font-semibold">Instruções de pagamento</h3>
                    <p className="text-sm text-z-text-muted -mt-2">
                      Esta é a mensagem exibida após o cliente concluir um pedido. Lembre-se que o botão "Combinar Pagamento" abre o WhatsApp da sua loja.
                    </p>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Field
                          label="Título da mensagem"
                          placeholder="Ex: Entraremos em contato em breve"
                          maxLength={120}
                          error={form.formState.errors.payment_instructions_title?.message}
                          {...form.register('payment_instructions_title')}
                        />
                        <span className="text-xs text-z-text-hint mt-1">
                          {120 - (form.watch('payment_instructions_title')?.length || 0)} caracteres restantes
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Mensagem pós confirmação do pedido</Label>
                        <Textarea
                          placeholder="Ex: Se quiser agilizar o processo, entre em contato conosco para finalizar o pagamento e os detalhes da entrega:"
                          className="min-h-[100px]"
                          maxLength={300}
                          {...form.register('payment_instructions_message')}
                        />
                        <span className="text-xs text-z-text-hint mt-1">
                          {300 - (form.watch('payment_instructions_message')?.length || 0)} caracteres restantes
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366]">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold">Botão do WhatsApp</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted -mt-2">
                      Habilite o botão "Pedir via WhatsApp" em seu catálogo, permitindo que os clientes enviem mensagens diretamente para o número cadastrado.
                    </p>

                    <label className="flex items-center justify-between rounded-xl border border-z-border p-4 cursor-pointer bg-z-bg transition-colors hover:bg-z-bg2">
                      <span className="font-medium text-z-text">Ativar o botão do WhatsApp</span>
                      <div className="relative inline-flex items-center">
                        <input type="checkbox" className="peer sr-only" {...form.register('whatsapp_button_enabled')} />
                        <div className="h-6 w-11 rounded-full bg-z-border after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#11b981] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                      </div>
                    </label>

                    <div className="flex items-start gap-3 rounded-xl border border-[#FDE047] bg-[#FEF9C3] p-4 text-sm text-[#854D0E]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                        <span className="text-lg">💡</span>
                      </div>
                      <p>
                        <strong>Importante:</strong> Com o botão desativado, o contato via WhatsApp só estará disponível após o cliente concluir o pedido.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* MÉTODOS DE PAGAMENTO */}
            {activeTab === 'pagamento' && (
              <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                <div className="mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={LockedIcon} size={20} className="text-z-text-muted" />
                  <h2 className="text-base font-semibold">Formas de pagamento oferecidas por sua loja</h2>
                </div>

                <div className="flex flex-col gap-4 ml-7">
                  <p className="text-sm text-z-text-muted -mt-2">
                    Elas estarão disponíveis para os seus clientes escolherem como gostariam de pagar pelo pedido.
                  </p>

                  <RoundMultiCheck
                    options={[
                      { value: 'pix',          label: 'PIX' },
                      { value: 'cash',         label: 'Dinheiro' },
                      { value: 'credit_card',  label: 'Cartão de crédito' },
                      { value: 'debit_card',   label: 'Cartão de débito' },
                      { value: 'bank_transfer',label: 'Transferência' },
                      { value: 'boleto',       label: 'Boleto' },
                      { value: 'payment_link', label: 'Link de pagamento' },
                    ]}
                    value={form.watch('accepted_payment_methods') ?? []}
                    onChange={(next) => form.setValue('accepted_payment_methods', next, { shouldDirty: true })}
                  />

                  <div className="flex items-start gap-3 rounded-xl border border-[#FDE047] bg-[#FEF9C3] p-4 text-sm text-[#854D0E]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                      <span className="text-lg">💡</span>
                    </div>
                    <p>
                      <strong>Importante:</strong> Você deverá gerenciar o pagamento diretamente com o seu cliente. A Zapia não cobrará o seu cliente.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* MÉTODOS DE ENTREGA */}
            {activeTab === 'entrega' && (
              <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                <div className="mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={StoreLocationIcon} size={20} className="text-z-text-muted" />
                  <h2 className="text-base font-semibold">Formas de entrega</h2>
                </div>

                <div className="flex flex-col gap-6 ml-7">
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-z-text-muted -mt-2">
                      Selecione quais métodos de entrega que você oferece aos seus clientes
                    </p>
                    <RoundMultiCheck
                      options={[
                        { value: 'delivery',        label: 'Entrega em domicílio' },
                        { value: 'pickup_in_store',  label: 'Retirada na loja' },
                        { value: 'digital',          label: 'Entrega digital' },
                      ]}
                      value={form.watch('accepted_shipping_methods') ?? []}
                      onChange={(next) => form.setValue('accepted_shipping_methods', next, { shouldDirty: true })}
                    />
                  </div>

                  <hr className="border-z-border" />

                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-medium text-z-text">Horários de atendimento</p>
                      <p className="mt-0.5 text-xs text-z-text-muted">
                        Informe os horários em que seus clientes podem fazer pedidos.
                      </p>
                    </div>
                    <DeliveryHoursEditor
                      value={form.watch('delivery_hours') ?? []}
                      onChange={(next) => form.setValue('delivery_hours', next, { shouldDirty: true })}
                    />
                  </div>

                  <hr className="border-z-border" />

                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-medium text-z-text">Local de entrega</p>
                      <p className="mt-0.5 text-xs text-z-text-muted">
                        Escolha a área para onde você entrega os pedidos da sua loja.
                      </p>
                    </div>
                    <RoundSingleCheck
                      options={[
                        {
                          value: 'city_only',
                          label: form.watch('address_city')
                            ? `Apenas na cidade (${form.watch('address_city')})`
                            : 'Apenas na cidade',
                        },
                        { value: 'state_only', label: 'Apenas meu estado' },
                        { value: 'brazil', label: 'Brasil inteiro' },
                        { value: 'worldwide', label: 'Mundo inteiro' },
                        { value: 'digital_only', label: 'Apenas digital' },
                        { value: 'custom', label: 'Personalizado' },
                      ]}
                      value={form.watch('delivery_area_scope') ?? 'city_only'}
                      onChange={(next) =>
                        form.setValue(
                          'delivery_area_scope',
                          next as UpdateStoreInput['delivery_area_scope'],
                          { shouldDirty: true },
                        )
                      }
                    />

                    {form.watch('delivery_area_scope') === 'custom' && (
                      <DeliveryAreaCustomLocations
                        value={form.watch('delivery_area_custom_locations') ?? []}
                        onChange={(next) =>
                          form.setValue('delivery_area_custom_locations', next, { shouldDirty: true })
                        }
                      />
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* LINKS SOCIAIS */}
            {activeTab === 'links' && (
              <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                <div className="mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={EyeIcon} size={20} className="text-z-text-muted" />
                  <h2 className="text-base font-semibold">Links relevantes do seu negócio</h2>
                </div>

                <div className="flex flex-col gap-4 ml-7">
                  <p className="text-sm text-z-text-muted -mt-2">
                    Estes links ficarão visíveis na área "sobre nós" do seu catálogo.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Instagram */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">Instagram</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Seu @ ou link do perfil"
                          {...form.register('social_instagram')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <HugeiconsIcon icon={InstagramIcon} size={18} className="text-[#E1306C]" />
                        </span>
                      </div>
                    </div>

                    {/* X (Twitter) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">X (twitter)</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Seu @ ou link para o seu X"
                          {...form.register('social_x')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <HugeiconsIcon icon={NewTwitterIcon} size={18} className="text-z-text" />
                        </span>
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">Facebook</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Seu usuário ou link do perfil"
                          {...form.register('social_facebook')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <HugeiconsIcon icon={FacebookIcon} size={18} className="text-[#1877F2]" />
                        </span>
                      </div>
                    </div>

                    {/* YouTube */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">YouTube</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Link para o seu canal"
                          {...form.register('social_youtube')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <HugeiconsIcon icon={YoutubeIcon} size={18} className="text-[#FF0000]" />
                        </span>
                      </div>
                    </div>

                    {/* Kwai */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">Kwai</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Seu @ ou link para o seu Kwai"
                          {...form.register('social_kwai')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6900] font-black text-[13px]">K</span>
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">TikTok</label>
                      <div className="relative">
                        <input
                          className="h-11 w-full rounded-lg border border-z-border bg-white pl-3.5 pr-10 text-sm transition-colors placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                          placeholder="Seu @ ou link para o seu TikTok"
                          {...form.register('social_tiktok')}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          <HugeiconsIcon icon={TiktokIcon} size={18} className="text-z-text" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-z-border" />

                <div className="flex flex-col gap-3 ml-7">
                  <div>
                    <p className="text-sm font-medium text-z-text">Links adicionais</p>
                    <p className="mt-0.5 text-xs text-z-text-muted">Aparecem na página "Sobre" do catálogo.</p>
                  </div>
                  {(form.watch('custom_links') ?? []).map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="h-10 w-32 shrink-0 rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        placeholder="Rótulo"
                        {...form.register(`custom_links.${index}.label`)}
                      />
                      <input
                        className="h-10 flex-1 rounded-lg border border-z-border bg-white px-3 text-sm placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        placeholder="https://..."
                        {...form.register(`custom_links.${index}.url`)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const links = form.getValues('custom_links') ?? []
                          form.setValue('custom_links', links.filter((_, i) => i !== index), { shouldDirty: true })
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-z-text-hint hover:bg-z-primary/10 hover:text-z-primary"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const links = form.getValues('custom_links') ?? []
                      form.setValue('custom_links', [...links, { label: '', url: '' }], { shouldDirty: true })
                    }}
                    className="flex w-fit items-center gap-1.5 text-sm font-medium text-[#0bfeda] hover:underline"
                  >
                    + Adicionar link
                  </button>
                </div>
              </section>
            )}

            {/* SITE / URL */}
            {activeTab === 'site' && (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <HugeiconsIcon icon={Globe02Icon} size={20} className="text-z-text-muted" />
                    <h2 className="text-base font-semibold">Endereço do seu catálogo</h2>
                  </div>

                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted -mt-2">
                      Este é o link que você deve compartilhar com seus clientes para que eles acessem seu catálogo online.
                    </p>

                    <div className="flex h-11 items-center gap-2 rounded-lg border border-z-border bg-z-bg px-3.5">
                      <div className="flex-1 truncate text-sm font-medium text-z-text">
                        {buildStoreUrl(store.slug).replace(/^https?:\/\//, '')}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 rounded-lg px-3 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(buildStoreUrl(store.slug))
                          track('share_link_copied', {
                            store_id: store.id,
                            link_type: 'store',
                            item_id: store.id,
                          })
                        }}
                      >
                        Copiar link
                      </Button>
                    </div>

                    <div className="my-2 h-px w-full bg-z-border" />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">Alterar URL da loja</label>
                      <div className="flex items-center gap-2">
                        <input
                          className={cn(
                            "h-12 w-40 min-w-0 rounded-lg border bg-white px-3.5 text-sm transition-colors placeholder:text-z-text-hint focus:outline-none focus:ring-2",
                            form.formState.errors.slug || slugAvailability === 'taken'
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                              : slugAvailability === 'available'
                                ? 'border-[#10b981] focus:border-[#10b981] focus:ring-[#10b981]/20'
                                : 'border-z-border focus:border-z-green focus:ring-z-green/20',
                            slugLocked && "opacity-50 cursor-not-allowed bg-z-bg"
                          )}
                          placeholder="seu-endereco"
                          disabled={slugLocked}
                          {...form.register('slug')}
                        />
                        <span className="shrink-0 text-sm text-z-text-hint">.{ROOT_DOMAIN}</span>
                      </div>
                      {form.formState.errors.slug ? (
                        <span className="text-xs text-destructive">{form.formState.errors.slug.message}</span>
                      ) : slugAvailability === 'taken' ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                          <HugeiconsIcon icon={Cancel01Icon} size={13} />
                          Nome indisponível
                        </span>
                      ) : slugAvailability === 'available' ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-[#0bfeda]">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                          Nome disponível
                        </span>
                      ) : null}

                      {slugLocked ? (
                        <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded-lg mt-1 border border-amber-100">
                          <HugeiconsIcon icon={Alert01Icon} size={14} />
                          <span>
                            Você alterou sua URL recentemente. Uma nova alteração será permitida em{' '}
                            {new Date(new Date(store.slug_last_updated_at!).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-z-text-hint mt-1">
                          Você pode alterar o endereço da sua loja apenas uma vez a cada 3 meses.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Google Tag Manager */}
                <section className="flex flex-col gap-5 rounded-2xl border border-z-border bg-white p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <HugeiconsIcon icon={GoogleIcon} size={20} className="text-z-text-muted" />
                    <h2 className="text-base font-semibold">Google Tag Manager</h2>
                  </div>

                  <div className="flex flex-col gap-4 ml-7">
                    <p className="text-sm text-z-text-muted -mt-2">
                      Adicione seu ID do GTM para gerenciar tags de analytics, pixel do Meta, conversão do Google Ads e muito mais — sem precisar mexer no código.
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-z-text">
                        ID do container
                      </label>
                      <input
                        placeholder="GTM-XXXXXX"
                        className="h-11 w-full max-w-xs rounded-lg border border-z-border bg-white px-3.5 font-mono text-sm uppercase placeholder:normal-case placeholder:text-z-text-hint focus:border-z-green focus:outline-none focus:ring-2 focus:ring-z-green/20"
                        {...form.register('gtm_id')}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase()
                          form.setValue('gtm_id', val, { shouldValidate: true })
                        }}
                      />
                      {form.formState.errors.gtm_id && (
                        <span className="text-xs text-destructive">
                          {form.formState.errors.gtm_id.message}
                        </span>
                      )}
                      <p className="text-xs text-z-text-hint">
                        Encontre seu ID no painel do{' '}
                        <a
                          href="https://tagmanager.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0bfeda] hover:underline"
                        >
                          Google Tag Manager
                        </a>
                        . Ele começa com <span className="font-mono">GTM-</span>.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* PLACEHOLDER PARA ABAS NÃO LISTADAS AINDA */}
            {!['gerais', 'aparencia', 'contato', 'pedidos', 'pagamento', 'entrega', 'categorias', 'links', 'site'].includes(activeTab) && (
              <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-z-border bg-z-bg2 p-12 text-center">
                <HugeiconsIcon icon={StoreLocationIcon} size={32} className="text-z-text-hint" />
                <h2 className="text-lg font-semibold text-z-text">Em construção</h2>
                <p className="text-sm text-z-text-muted">Esta seção será implementada em breve, seguindo o design do RediRedi.</p>
              </section>
            )}

            {form.formState.errors.root && (
              <p className="mt-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

          </form>
        </main>
      </div>

      <BottomSheet title="Logo, banner e cores" open={visualModalOpen} onClose={() => setVisualModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Cor primária</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => form.setValue('primary_color', preset, { shouldDirty: true, shouldValidate: true })}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform active:scale-95',
                    primaryColor?.toLowerCase() === preset.toLowerCase() && 'ring-2 ring-z-ink ring-offset-1',
                  )}
                  style={{ backgroundColor: preset }}
                  aria-label={`Selecionar cor ${preset}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <ImageCropUploader
              bucket="store-logos"
              storeId={store.id}
              label="Adicionar logo"
              aspect={1}
              value={form.watch('logo_url') || null}
              onChange={(url) => form.setValue('logo_url', url ?? '', { shouldDirty: true, shouldValidate: true })}
              hint="JPG, PNG ou WEBP."
              compact
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Banner</Label>
            <ImageCropUploader
              bucket="store-logos"
              storeId={store.id}
              label="Adicionar banner"
              aspect={16 / 10}
              value={form.watch('banner_url') || null}
              onChange={(url) => form.setValue('banner_url', url ?? '', { shouldDirty: true, shouldValidate: true })}
              hint="Proporção 16:10 recomendada."
              compact
            />
          </div>

          <Button type="button" fullWidth className="h-11" onClick={() => setVisualModalOpen(false)}>
            Concluir
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet title="Pagamento e entrega" open={paymentDeliveryModalOpen} onClose={() => setPaymentDeliveryModalOpen(false)}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label>Pagamento</Label>
            <RoundMultiCheck
              options={[
                { value: 'pix', label: 'PIX' },
                { value: 'cash', label: 'Dinheiro' },
                { value: 'credit_card', label: 'Cartão de crédito' },
                { value: 'debit_card', label: 'Cartão de débito' },
                { value: 'bank_transfer', label: 'Transferência' },
                { value: 'boleto', label: 'Boleto' },
                { value: 'payment_link', label: 'Link de pagamento' },
              ]}
              value={form.watch('accepted_payment_methods') ?? []}
              onChange={(next) => form.setValue('accepted_payment_methods', next, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Entrega</Label>
            <RoundMultiCheck
              options={[
                { value: 'delivery', label: 'Entrega em domicílio' },
                { value: 'pickup_in_store', label: 'Retirada na loja' },
                { value: 'digital', label: 'Entrega digital' },
              ]}
              value={form.watch('accepted_shipping_methods') ?? []}
              onChange={(next) => form.setValue('accepted_shipping_methods', next, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Região de entrega</Label>
            <RoundSingleCheck
              options={[
                {
                  value: 'city_only',
                  label: form.watch('address_city')
                    ? `Apenas na cidade (${form.watch('address_city')})`
                    : 'Apenas na cidade',
                },
                { value: 'state_only', label: 'Apenas meu estado' },
                { value: 'brazil', label: 'Brasil inteiro' },
                { value: 'worldwide', label: 'Mundo inteiro' },
                { value: 'digital_only', label: 'Apenas digital' },
                { value: 'custom', label: 'Personalizado' },
              ]}
              value={form.watch('delivery_area_scope') ?? 'city_only'}
              onChange={(next) =>
                form.setValue('delivery_area_scope', next as UpdateStoreInput['delivery_area_scope'], {
                  shouldDirty: true,
                })
              }
            />
            {form.watch('delivery_area_scope') === 'custom' && (
              <DeliveryAreaCustomLocations
                value={form.watch('delivery_area_custom_locations') ?? []}
                onChange={(next) => form.setValue('delivery_area_custom_locations', next, { shouldDirty: true })}
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label>Horário de funcionamento</Label>
            <DeliveryHoursEditor
              value={form.watch('delivery_hours') ?? []}
              onChange={(next) => form.setValue('delivery_hours', next, { shouldDirty: true })}
            />
          </div>

          <Button type="button" fullWidth onClick={() => setPaymentDeliveryModalOpen(false)}>
            Concluir
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet title="Nova categoria" open={mobileCategoryModalOpen} onClose={() => setMobileCategoryModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <Field
            label="Categoria"
            placeholder="Ex.: Vestidos"
            value={mobileCategoryName}
            onChange={(event) => setMobileCategoryName(event.target.value)}
          />
          <Field
            label="Subcategoria"
            placeholder="Ex.: Longos"
            value={mobileSubcategoryName}
            onChange={(event) => setMobileSubcategoryName(event.target.value)}
          />
          <Button
            type="button"
            fullWidth
            disabled={!mobileCategoryName.trim() || createCategory.isPending}
            onClick={handleCreateMobileCategory}
          >
            {createCategory.isPending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </div>
      </BottomSheet>

      {form.formState.isDirty && (
        <div className="sticky bottom-16 z-40 flex items-center justify-between gap-3 rounded-2xl border border-z-border bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
          <span className="text-sm font-medium text-z-text-muted">Alterações não salvas.</span>
          <Button type="submit" form="catalog-mobile-form" disabled={updateStore.isPending} className="rounded-full px-6">
            {updateStore.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}

      {activeTab !== 'categorias' && (form.formState.isDirty || updateStore.isPending) && (
        <div className="sticky bottom-16 z-40 mt-2 hidden items-center justify-between gap-4 rounded-2xl border border-z-border bg-white/90 px-5 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:bottom-0 lg:flex">
          <span className="text-sm text-z-text-muted">Você tem alterações não salvas.</span>
          <Button
            type="submit"
            form="catalog-form"
            disabled={updateStore.isPending}
            className="rounded-full px-8"
          >
            {updateStore.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      )}
    </div>
  )
}
