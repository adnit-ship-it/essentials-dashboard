/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import DOMPurify from "dompurify"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Undo2,
  X,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { fetchGraphQL } from "@/lib/services/graphql"
import type { Product } from "@/lib/types/products"
import { fileToPendingUpload } from "@/lib/utils/file-uploads"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type DraftMeta = {
  isNew: boolean
  isDeleted: boolean
  isDirty: boolean
  assets?: {
    img?: AssetMeta
    thumbnail?: AssetMeta
  }
}

type DraftProduct = Omit<
  Product,
  "features" | "prices" | "productBundleIds" | "quiz"
> & {
  features: string[]
  prices: Product["prices"]
  productBundleIds: Product["productBundleIds"]
  quiz: Product["quiz"]
  _localId: string
  _meta: DraftMeta
}

type PendingUpload = {
  base64: string
  dataUrl: string
  fileName: string
  fileSize: number
  mimeType: string
}

type AssetMeta = {
  path: string
  url?: string
  sha?: string | null
  pendingUpload?: PendingUpload | null
}

type AssetLookup = Record<
  string,
  {
    url?: string
    sha?: string | null
  }
>

type AssetSlot = "img" | "thumbnail"
const ASSET_SLOTS: AssetSlot[] = ["img", "thumbnail"]

type PriceKey = keyof Product["prices"]
const PRICE_KEYS: PriceKey[] = ["monthly", "threeMonthly", "sixMonthly"]
const PRICE_LABELS: Record<PriceKey, string> = {
  monthly: "Monthly",
  threeMonthly: "Every 3 Months",
  sixMonthly: "Every 6 Months",
}

type BundleKey = keyof Product["productBundleIds"]
const BUNDLE_KEYS: BundleKey[] = ["monthly", "threeMonthly", "sixMonthly"]
const BUNDLE_LABELS: Record<BundleKey, string> = {
  monthly: "Monthly Bundle ID",
  threeMonthly: "3-Month Bundle ID",
  sixMonthly: "6-Month Bundle ID",
}

const AVAILABILITY_OPTIONS: Array<{
  value: NonNullable<Product["availability"]>
  label: string
}> = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "coming_soon", label: "Coming Soon" },
]

const PRODUCT_TYPE_OPTIONS: Array<{ value: NonNullable<Product["type"]>; label: string }> = [
  { value: "injection", label: "Injection" },
  { value: "oral_drops", label: "Oral Drops" },
  { value: "oral_pills", label: "Oral Pills" },
]

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "sexual health", label: "Sexual Health" },
  { value: "wellness", label: "Wellness" },
  { value: "hair", label: "Hair" },
  { value: "skin", label: "Skin" },
]

interface ProductEditorState {
  draft: DraftProduct
  priceEntries: Array<{ key: PriceKey; value: string }>
  bundleEntries: Array<{ key: BundleKey; value: string }>
  featureInput: string
  error?: string
}

type Feedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string }

// Use relative URLs in browser to avoid CORS issues
const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
const QUIZ_CONFIG_URL = `${API_BASE_URL}/api/quizzes`

type QuizOption = {
  id: string
  name: string
}

type FetchedProductBundle = {
  id: string
  name: string
  price: number
  imageUrl?: string
  description?: string
}

function generateLocalId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeForPath(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildDefaultAssetPath(productId: string, slot: AssetSlot, extension: string) {
  const safeId = normalizeForPath(productId || "product")
  return `/assets/images/products/${safeId}-${slot}.${extension}`
}

// fileToPendingUpload is now imported from shared utilities

function normalizeProduct(product: Product): Product {
  const normalizedPrices = PRICE_KEYS.reduce<Product["prices"]>((acc, key) => {
    const value = product.prices?.[key]
    if (value !== undefined && value !== null) {
      acc[key] = value
    }
    return acc
  }, {})

  const normalizedBundles = BUNDLE_KEYS.reduce<Product["productBundleIds"]>((acc, key) => {
    const value = product.productBundleIds?.[key]
    if (value !== undefined && value !== null && value?.trim()) {
      acc[key] = value
    }
    return acc
  }, {})

  const features = Array.isArray(product.features)
    ? product.features.map((feature) => feature?.trim() ?? "").filter(Boolean)
    : []

  return {
    ...product,
    prices: normalizedPrices,
    productBundleIds: normalizedBundles,
    features,
    order: product.order,
  }
}

function cloneAssetMeta(meta?: AssetMeta | null): AssetMeta | undefined {
  if (!meta) {
    return undefined
  }
  return {
    ...meta,
    pendingUpload: meta.pendingUpload
      ? { ...meta.pendingUpload }
      : undefined,
  }
}

function cloneDraftProduct(product: DraftProduct): DraftProduct {
  return {
    ...product,
    prices: { ...product.prices },
    productBundleIds: { ...product.productBundleIds },
    features: [...(product.features || [])],
    _meta: {
      ...product._meta,
      assets: product._meta.assets
        ? {
            img: cloneAssetMeta(product._meta.assets.img),
            thumbnail: cloneAssetMeta(product._meta.assets.thumbnail),
          }
        : undefined,
    },
  }
}

function stripMeta(product: DraftProduct): Product {
  const { _localId: _ignoreLocalId, _meta: _ignoreMeta, ...rest } = product
  return {
    ...rest,
    prices: { ...rest.prices },
    productBundleIds: { ...rest.productBundleIds },
    features: [...(rest.features || [])],
    quiz: rest.quiz ?? null,
    order: rest.order,
  }
}

function areProductsEqual(a: Product, b: Product) {
  return JSON.stringify(normalizeProduct(a)) === JSON.stringify(normalizeProduct(b))
}

function sanitizeDraftProduct(product: DraftProduct): DraftProduct {
  const sanitizedPrices = PRICE_KEYS.reduce<Product["prices"]>((acc, key) => {
    const value = product.prices?.[key]
    if (value === undefined || value === null) {
      return acc
    }
    const numericValue = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(numericValue)) {
      return acc
    }
    acc[key] = numericValue
    return acc
  }, {})

  const sanitizedBundles = BUNDLE_KEYS.reduce<Product["productBundleIds"]>((acc, key) => {
    const value = product.productBundleIds?.[key]
    if (typeof value !== "string") {
      return acc
    }
    const trimmedValue = value?.trim()
    if (trimmedValue) {
      acc[key] = trimmedValue
    }
    return acc
  }, {})

  const features = Array.isArray(product.features)
    ? product.features.map((feature) => feature?.trim() ?? "").filter(Boolean)
    : []

  const availability = product.availability && AVAILABILITY_OPTIONS.some((option) => option.value === product.availability)
    ? product.availability
    : undefined

  const type = product.type && PRODUCT_TYPE_OPTIONS.find((option) => option.value === product.type)
    ? product.type
    : undefined

  return {
    ...product,
    id: product.id?.trim() ?? "",
    name: product.name?.trim() ?? "",
    category: product.category?.trim() ?? "",
    description: product.description?.trim() ?? "",
    img: product.img?.trim() ?? "",
    thumbnail: product.thumbnail?.trim() ?? "",
    availability,
    type,
    prices: sanitizedPrices,
    productBundleIds: sanitizedBundles,
    features,
    quiz: product.quiz ?? null,
    order: product.order,
  }
}

function createDraftFromProduct(
  product: Product,
  overrides?: Partial<DraftMeta>,
  localId?: string,
  assetLookup?: AssetLookup
): DraftProduct {
  const normalized = normalizeProduct(product)
  const imgPath = normalized.img?.trim()
  const thumbnailPath = normalized.thumbnail?.trim()
  const assets: DraftMeta["assets"] = {}

  if (imgPath) {
    assets.img = {
      path: imgPath,
      url: assetLookup?.[imgPath]?.url,
      sha: assetLookup?.[imgPath]?.sha ?? undefined,
      pendingUpload: null,
    }
  }

  if (thumbnailPath) {
    assets.thumbnail = {
      path: thumbnailPath,
      url: assetLookup?.[thumbnailPath]?.url,
      sha: assetLookup?.[thumbnailPath]?.sha ?? undefined,
      pendingUpload: null,
    }
  }

  return {
    ...normalized,
    prices: normalized.prices || {},
    productBundleIds: normalized.productBundleIds || {},
    features: Array.isArray(normalized.features) ? [...normalized.features] : [],
    quiz: normalized.quiz ?? null,
    _localId: localId ?? normalized.id,
    _meta: {
      isNew: overrides?.isNew ?? false,
      isDeleted: overrides?.isDeleted ?? false,
      isDirty: overrides?.isDirty ?? false,
      assets: Object.keys(assets).length > 0 ? assets : undefined,
    },
  }
}

function createEmptyDraftProduct(): DraftProduct {
  return {
    id: "",
    name: "",
    category: "",
    description: "",
    img: "",
    thumbnail: "",
    prices: {},
    productBundleIds: {},
    availability: "in_stock",
    type: "injection",
    popular: false,
    features: [],
    quiz: null,
    order: undefined, // Will be set when added to the list
    _localId: generateLocalId(),
    _meta: {
      isNew: true,
      isDeleted: false,
      isDirty: true,
      assets: {},
    },
  }
}

function buildEditorStateFromDraft(draft: DraftProduct): ProductEditorState {
  return {
    draft: cloneDraftProduct(draft),
    priceEntries: PRICE_KEYS.map((key) => ({
      key,
      value:
        draft.prices?.[key] !== undefined && draft.prices?.[key] !== null
          ? draft.prices?.[key]?.toString() ?? ""
          : "",
    })),
    bundleEntries: BUNDLE_KEYS.map((key) => ({
      key,
      value: draft.productBundleIds?.[key] ?? "",
    })),
    featureInput: "",
  }
}

function validateProducts(products: Product[]) {

  const seen = new Set<string>()
  for (const product of products) {
    if (!product.id || product.id.trim() === "") {
      console.error("[ProductValidation] ❌ Product missing ID:", { 
        product, 
        id: product.id,
        name: product.name,
        hasId: !!product.id,
        idType: typeof product.id,
        idLength: product.id?.length ?? 0
      })
      return `Each product must have a unique id. Product "${product.name || product.id || 'Unnamed'}" is missing an ID.`
    }
    if (seen.has(product.id)) {
      console.error("[ProductValidation] ❌ Duplicate ID found:", product.id)
      return `Duplicate product id "${product.id}".`
    }
    seen.add(product.id)
    if (!product.name || product.name.trim() === "") {
      console.error("[ProductValidation] ❌ Product missing name:", { id: product.id })
      return `Product "${product.id}" is missing a name.`
    }
  }
  console.log("[ProductValidation] ✅ All products validated successfully")
  return null
}

export function ProductsSection() {
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sha, setSha] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [activeEditor, setActiveEditor] = useState<ProductEditorState | null>(null)
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([])
  const [linkNameModalOpen, setLinkNameModalOpen] = useState(false)
  const [linkNameInput, setLinkNameInput] = useState("")
  const [linkNameLoading, setLinkNameLoading] = useState(false)
  const [selectedFields, setSelectedFields] = useState<{
    imageUrl: boolean
    description: boolean
  }>({
    imageUrl: false,
    description: false,
  })
  const [fetchedProducts, setFetchedProducts] = useState<FetchedProductBundle[]>([])
  const [productPreviewModalOpen, setProductPreviewModalOpen] = useState(false)
  const [selectedFetchedProductIds, setSelectedFetchedProductIds] = useState<Set<string>>(new Set())
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  const originalProductsRef = useRef<Record<string, Product>>({})
  const originalOrderRef = useRef<Product[]>([])
  const assetLookupRef = useRef<AssetLookup>({})
  const quizNameById = useMemo(() => {
    return quizOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.id] = option.name
      return acc
    }, {})
  }, [quizOptions])

  const computeDraftWithMeta = useCallback(
    (draft: DraftProduct): DraftProduct => {
      const sanitized = sanitizeDraftProduct(draft)
      const original = originalProductsRef.current[sanitized._localId]
      const originalComparable = original ? normalizeProduct(original) : undefined
      const comparable = normalizeProduct(stripMeta(sanitized))
      const isDirty =
        sanitized._meta.isDeleted ||
        sanitized._meta.isNew ||
        !originalComparable ||
        !areProductsEqual(comparable, originalComparable)

      const currentAssets = sanitized._meta.assets ?? {}
      const imgPath = sanitized.img?.trim()
      const thumbnailPath = sanitized.thumbnail?.trim()

      const nextAssets: DraftMeta["assets"] | undefined = (() => {
        const assets: DraftMeta["assets"] = {}
        if (imgPath) {
          const samePath = currentAssets.img?.path === imgPath
          assets.img = {
            path: imgPath,
            url: samePath ? currentAssets.img?.url : undefined,
            sha: samePath ? currentAssets.img?.sha : undefined,
            pendingUpload: currentAssets.img?.pendingUpload ?? undefined,
          }
        }
        if (thumbnailPath) {
          const samePath = currentAssets.thumbnail?.path === thumbnailPath
          assets.thumbnail = {
            path: thumbnailPath,
            url: samePath ? currentAssets.thumbnail?.url : undefined,
            sha: samePath ? currentAssets.thumbnail?.sha : undefined,
            pendingUpload: currentAssets.thumbnail?.pendingUpload ?? undefined,
          }
        }
        return Object.keys(assets).length > 0 ? assets : undefined
      })()

      return {
        ...sanitized,
        _meta: {
          ...sanitized._meta,
          assets: nextAssets,
          isDirty,
        },
      }
    },
    []
  )

  const { repoOwnerFromLink, repoNameFromLink, linkNameFromLink } = useOrganizationStore()

  const fetchProducts = useCallback(async () => {
    const owner = repoOwnerFromLink || ""
    const repo = repoNameFromLink || ""
    if (!owner || !repo) {
      setError("Repository owner/name missing. Configure via organization settings.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setFeedback(null)
    try {
      const url = `${API_BASE_URL}/api/products?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data: { products: Product[]; sha: string; assets?: AssetLookup } = await response.json()
      const normalizedProducts = (data.products || []).map((product) => normalizeProduct(product))
      const assetLookup = data.assets ?? {}
      assetLookupRef.current = assetLookup
      const drafts = normalizedProducts.map((product) =>
        createDraftFromProduct(product, undefined, undefined, assetLookup)
      )

      originalProductsRef.current = normalizedProducts.reduce<Record<string, Product>>(
        (acc, product) => {
          acc[product.id] = product
          return acc
        },
        {}
      )
      originalOrderRef.current = normalizedProducts

      setDraftProducts(drafts)
      setSha(data.sha)
    } catch (err) {
      setError((err as Error).message || "Failed to load products.")
      setDraftProducts([])
      setSha(null)
    } finally {
      setLoading(false)
    }
  }, [repoOwnerFromLink, repoNameFromLink])

  useEffect(() => {
    if (repoOwnerFromLink && repoNameFromLink) {
      const load = async () => {
        await fetchProducts()
        try {
          const url = `${QUIZ_CONFIG_URL}?owner=${encodeURIComponent(repoOwnerFromLink!)}&repo=${encodeURIComponent(repoNameFromLink!)}`
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Failed to fetch quizzes (${response.status})`)
          }
          const data = await response.json()
          setQuizOptions(Array.isArray(data?.quizzes) ? data.quizzes : [])
        } catch (err) {
          console.error("Failed to load quizzes", err)
          setQuizOptions([])
        }
      }
      load()
    }
  }, [repoOwnerFromLink, repoNameFromLink, fetchProducts])

  const hasPendingChanges = useMemo(
    () =>
      draftProducts.some(
        (product) =>
          product._meta.isDirty ||
          product._meta.isDeleted ||
          product._meta.isNew ||
          Boolean(product._meta.assets?.img?.pendingUpload) ||
          Boolean(product._meta.assets?.thumbnail?.pendingUpload)
      ),
    [draftProducts]
  )

  const openEditor = useCallback(
    (localId: string) => {
      const target = draftProducts.find((product) => product._localId === localId)
      if (!target) {
        return
      }
      setActiveEditor(buildEditorStateFromDraft(target))
    },
    [draftProducts]
  )

  const handleNewProduct = () => {
    const blank = createEmptyDraftProduct()
    // Set order to be at the end (highest order + 1, or 1 if no products)
    const maxOrder = draftProducts.length > 0
      ? Math.max(...draftProducts.map(p => p.order ?? 0), 0)
      : 0
    const newProduct = { ...blank, order: maxOrder + 1 }
    setDraftProducts((prev) => {
      const updated = [newProduct, ...prev]
      return updated
    })
    setActiveEditor(buildEditorStateFromDraft(newProduct))
  }

  const handleDiscardProduct = (localId: string) => {
    const original = originalProductsRef.current[localId]
    setDraftProducts((prev) => {
      const index = prev.findIndex((product) => product._localId === localId)
      if (index === -1) {
        return prev
      }

      if (!original) {
        const next = [...prev]
        next.splice(index, 1)
        return next
      }

      const restored = createDraftFromProduct(
        original,
        undefined,
        localId,
        assetLookupRef.current
      )
      const next = [...prev]
      next[index] = restored
      return next
    })
    setActiveEditor(null)
  }

  const handleToggleDelete = (localId: string, shouldDelete: boolean) => {
    setDraftProducts((prev) => {
      const index = prev.findIndex((product) => product._localId === localId)
      if (index === -1) {
        return prev
      }

      const target = prev[index]
      if (target._meta.isNew && shouldDelete) {
        const next = [...prev]
        next.splice(index, 1)
        return next
      }

      const updatedDraft = computeDraftWithMeta({
        ...target,
        _meta: { ...target._meta, isDeleted: shouldDelete },
      })

      const next = [...prev]
      next[index] = updatedDraft
      return next
    })

    setActiveEditor((prev) => {
      if (!prev || prev.draft._localId !== localId) {
        return prev
      }
      return {
        ...prev,
        draft: {
          ...prev.draft,
          _meta: { ...prev.draft._meta, isDeleted: shouldDelete },
        },
      }
    })
  }

  const handleUndoDelete = (localId: string) => {
    handleToggleDelete(localId, false)
  }

  const handleDiscardAll = () => {
    const originals = originalOrderRef.current
    const drafts = originals.map((product) =>
      createDraftFromProduct(product, undefined, undefined, assetLookupRef.current)
    )
    setDraftProducts(drafts)
    setActiveEditor(null)
  }

  const upsertDraft = useCallback(
    (updated: DraftProduct) => {
      const computed = computeDraftWithMeta(updated)
      setDraftProducts((prev) => {
        const index = prev.findIndex((product) => product._localId === computed._localId)
        if (index === -1) {
          return [computed, ...prev]
        }
        const next = [...prev]
        next[index] = computed
        return next
      })
    },
    [computeDraftWithMeta]
  )

  const applyEditorChanges = useCallback(() => {
    console.log("[ApplyEditorChanges] 🎯 Applying changes to product")
    if (!activeEditor) {
      console.warn("[ApplyEditorChanges] ⚠️ No active editor")
      return
    }

    const { draft, priceEntries, bundleEntries } = activeEditor
    console.log("[ApplyEditorChanges] Current draft:", { 
      id: draft.id, 
      name: draft.name,
      isNew: draft._meta.isNew,
      localId: draft._localId 
    })

    const trimmedId = draft.id?.trim() ?? ""
    const trimmedName = draft.name?.trim() ?? ""

    console.log("[ApplyEditorChanges] Trimmed values:", { trimmedId, trimmedName, originalId: draft.id })

    if (!trimmedId) {
      console.error("[ApplyEditorChanges] ❌ Product ID is empty or missing")
      setActiveEditor((prev) => prev && { ...prev, error: "Product id is required." })
      return
    }

    if (!trimmedName) {
      console.error("[ApplyEditorChanges] ❌ Product name is empty or missing")
      setActiveEditor((prev) => prev && { ...prev, error: "Product name is required." })
      return
    }

    try {
      const prices = priceEntries.reduce<Product["prices"]>((acc, entry) => {
        const trimmedValue = entry.value?.trim() ?? ""
        if (!trimmedValue) {
          return acc
        }
        const numericValue = Number(trimmedValue)
        if (Number.isNaN(numericValue)) {
          throw new Error(`${PRICE_LABELS[entry.key]} price must be a number.`)
        }
        acc[entry.key] = numericValue
        return acc
      }, {})

      if (Object.keys(prices).length === 0) {
        throw new Error("Provide at least one price tier.")
      }

      const productBundleIds = bundleEntries.reduce<Product["productBundleIds"]>((acc, entry) => {
        const trimmedValue = entry.value?.trim() ?? ""
        if (!trimmedValue) {
          return acc
        }
        acc[entry.key] = trimmedValue
        return acc
      }, {})

      const features = Array.isArray(draft.features)
        ? draft.features.map((feature) => feature?.trim() ?? "").filter(Boolean)
        : []

      const updatedDraft: DraftProduct = {
        ...draft,
        id: trimmedId,
        name: trimmedName,
        category: draft.category?.trim() ?? "",
        description: draft.description?.trim() ?? "",
        img: draft.img?.trim() ?? "",
        thumbnail: draft.thumbnail?.trim() ?? "",
        availability: draft.availability || undefined,
        type: draft.type || undefined,
        prices,
        productBundleIds,
        features,
        // Preserve _meta.assets to keep pending uploads and asset metadata
        _meta: {
          ...draft._meta,
          isDirty: true,
        },
      }

      upsertDraft(updatedDraft)
      setActiveEditor(null)
    } catch (err) {
      setActiveEditor((prev) => prev && { ...prev, error: (err as Error).message })
    }
  }, [activeEditor, upsertDraft])

  const handleSaveAll = async () => {
    if (!sha) {
      setFeedback({ type: "error", message: "Missing SHA for products file. Refresh and try again." })
      return
    }

    console.log("[SaveAll] Setting saving=true")
    setSaving(true)
    setFeedback(null)

    try {
      const recomputedDrafts = draftProducts.map((draft) => computeDraftWithMeta(draft))

      const uploadItems: Array<{
        path: string
        base64: string
        sha?: string | null
        slot: AssetSlot
        productId: string
      }> = []

      for (const draft of recomputedDrafts) {
        for (const slot of ASSET_SLOTS) {
          const meta = draft._meta.assets?.[slot]
          if (meta?.pendingUpload) {
            const pathValue = (slot === "img" ? draft.img : draft.thumbnail)?.trim()
            if (!pathValue) {
              throw new Error(
                `${slot === "img" ? "Primary image" : "Thumbnail image"} requires a path before uploading.`
              )
            }
            uploadItems.push({
              path: pathValue,
              base64: meta.pendingUpload.base64,
              sha: meta.sha ?? undefined,
              slot,
              productId: draft.id,
            })
          }
        }
      }

      const shouldCommitProducts = recomputedDrafts.some(
        (draft) => draft._meta.isDirty || draft._meta.isDeleted || draft._meta.isNew
      )

      if (!shouldCommitProducts && uploadItems.length === 0) {
        setFeedback({ type: "error", message: "No staged changes to save." })
        setSaving(false)
        return
      }

      const payloadProducts = recomputedDrafts
        .filter((product) => !product._meta.isDeleted)
        .map((product) => normalizeProduct(stripMeta(product)))

      const validationError = validateProducts(payloadProducts)
      if (validationError) {
        setFeedback({ type: "error", message: validationError })
        setSaving(false)
        return
      }

      const uploadResults = new Map<string, { url?: string; sha?: string | null }>()

      for (const upload of uploadItems) {
        const owner = repoOwnerFromLink || ""
        const repo = repoNameFromLink || ""
        const url = `${API_BASE_URL}/api/product-images?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
        let response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: upload.path,
            contentBase64: upload.base64,
            sha: upload.sha || undefined,
            commitMessage: `CMS: Update ${upload.slot === "img" ? "primary" : "thumbnail"} image for ${
              upload.productId
            } (${new Date().toISOString()})`,
          }),
        })

        // Handle 409 conflict - refresh asset metadata and retry once
        if (response.status === 409) {
          // Refresh products to get latest asset SHAs
          await fetchProducts()
          
          // Get the updated SHA from the refreshed asset lookup
          const refreshedSha = assetLookupRef.current[upload.path]?.sha
          
          if (refreshedSha) {
            // Retry with the refreshed SHA
            response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: upload.path,
                contentBase64: upload.base64,
                sha: refreshedSha || undefined,
                commitMessage: `CMS: Update ${upload.slot === "img" ? "primary" : "thumbnail"} image for ${
                  upload.productId
                } (${new Date().toISOString()})`,
              }),
            })
          } else {
            // If we still don't have a SHA, try without it (create new file)
            response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: upload.path,
                contentBase64: upload.base64,
                commitMessage: `CMS: Update ${upload.slot === "img" ? "primary" : "thumbnail"} image for ${
                  upload.productId
                } (${new Date().toISOString()})`,
              }),
            })
          }
        }

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          const message = body.error || `Image upload failed with status ${response.status}.`
          throw new Error(message)
        }

        const result = await response.json()
        uploadResults.set(upload.path, {
          url: result.fileUrl,
          sha: result.newSha ?? upload.sha ?? null,
        })
        
        // Immediately update the asset lookup with the new URL and SHA
        assetLookupRef.current[upload.path] = {
          url: result.fileUrl,
          sha: result.newSha ?? null,
        }
        
        // Update draft products to show the new image immediately
        setDraftProducts((prev) =>
          prev.map((product) => {
            const imgPath = product.img?.trim()
            const thumbnailPath = product.thumbnail?.trim()
            const isRelevantProduct = imgPath === upload.path || thumbnailPath === upload.path
            
            if (!isRelevantProduct) return product
            
            const updatedAssets = { ...product._meta.assets }
            if (imgPath === upload.path) {
              updatedAssets.img = {
                path: imgPath,
                url: result.fileUrl,
                sha: result.newSha ?? null,
                pendingUpload: undefined, // Clear pending upload
              }
            }
            if (thumbnailPath === upload.path) {
              updatedAssets.thumbnail = {
                path: thumbnailPath,
                url: result.fileUrl,
                sha: result.newSha ?? null,
                pendingUpload: undefined, // Clear pending upload
              }
            }
            
            return {
              ...product,
              _meta: {
                ...product._meta,
                assets: updatedAssets,
              },
            }
          })
        )
      }

      let nextSha = sha

      if (shouldCommitProducts) {
        const owner = repoOwnerFromLink || ""
        const repo = repoNameFromLink || ""
        const url = `${API_BASE_URL}/api/products?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: payloadProducts,
            sha,
            commitMessage: `CMS: Update products (${new Date().toISOString()})`,
          }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          const message = body.error || `Update failed with status ${response.status}.`
          throw new Error(message)
        }

        const result = await response.json()
        nextSha = result.newSha || sha
      }

      const normalizedProducts = payloadProducts.map((product) => normalizeProduct(product))
      originalProductsRef.current = normalizedProducts.reduce<Record<string, Product>>(
        (acc, product) => {
          acc[product.id] = product
          return acc
        },
        {}
      )
      originalOrderRef.current = normalizedProducts

      const previousAssetLookup = assetLookupRef.current
      const nextAssetLookup: AssetLookup = {}

      for (const product of normalizedProducts) {
        const imgPath = product.img?.trim()
        if (imgPath) {
          const uploadResult = uploadResults.get(imgPath)
          const existing = previousAssetLookup[imgPath]
          nextAssetLookup[imgPath] = {
            url: uploadResult?.url ?? existing?.url,
            sha: uploadResult?.sha ?? existing?.sha ?? null,
          }
        }
        const thumbnailPath = product.thumbnail?.trim()
        if (thumbnailPath) {
          const uploadResult = uploadResults.get(thumbnailPath)
          const existing = previousAssetLookup[thumbnailPath]
          nextAssetLookup[thumbnailPath] = {
            url: uploadResult?.url ?? existing?.url,
            sha: uploadResult?.sha ?? existing?.sha ?? null,
          }
        }
      }

      assetLookupRef.current = nextAssetLookup

      // Create draft products using the updated asset lookup (which includes upload results)
      setDraftProducts(
        normalizedProducts.map((product) =>
          createDraftFromProduct(product, undefined, undefined, assetLookupRef.current)
        )
      )
      setSha(nextSha)
      
      // After a delay, refresh to ensure we have the latest from GitHub
      // This ensures that if the user refreshes the page, they get the latest data
      // But only refresh if we uploaded images, and give GitHub time to process
      if (uploadItems.length > 0) {
        setTimeout(async () => {
          // Save the uploaded asset metadata before refresh
          const savedUploadResults = new Map(uploadResults)
          await fetchProducts()
          // Restore the uploaded asset metadata after refresh to ensure we have the correct URLs
          savedUploadResults.forEach((result, path) => {
            if (result.url && result.sha) {
              assetLookupRef.current[path] = {
                url: result.url,
                sha: result.sha,
              }
            }
          })
          // Update draft products with the restored asset metadata
          setDraftProducts((prev) =>
            prev.map((product) => {
              const imgPath = product.img?.trim()
              const thumbnailPath = product.thumbnail?.trim()
              const isRelevantProduct = savedUploadResults.has(imgPath) || savedUploadResults.has(thumbnailPath)
              
              if (!isRelevantProduct) return product
              
              const updatedAssets = { ...product._meta.assets }
              const imgResult = savedUploadResults.get(imgPath)
              const thumbnailResult = savedUploadResults.get(thumbnailPath)
              
              if (imgResult && imgPath && imgResult.url && imgResult.sha) {
                updatedAssets.img = {
                  path: imgPath,
                  url: imgResult.url,
                  sha: imgResult.sha,
                }
              }
              if (thumbnailResult && thumbnailPath && thumbnailResult.url && thumbnailResult.sha) {
                updatedAssets.thumbnail = {
                  path: thumbnailPath,
                  url: thumbnailResult.url,
                  sha: thumbnailResult.sha,
                }
              }
              
              return {
                ...product,
                _meta: {
                  ...product._meta,
                  assets: Object.keys(updatedAssets).length > 0 ? updatedAssets : undefined,
                },
              }
            })
          )
        }, 2000)
      }

      if (uploadItems.length > 0 && shouldCommitProducts) {
        setFeedback({ type: "success", message: "Products and images saved successfully." })
      } else if (uploadItems.length > 0) {
        setFeedback({ type: "success", message: "Images uploaded successfully." })
      } else {
        setFeedback({ type: "success", message: "Products saved successfully." })
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: (err as Error).message || "Failed to save products.",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetEditorError = () => {
    setActiveEditor((prev) => (prev ? { ...prev, error: undefined } : prev))
  }

  const handleImageFileChange = useCallback(async (slot: AssetSlot, file: File | null) => {
    if (!file) {
      return
    }
    try {
      const upload = await fileToPendingUpload(file)
      setActiveEditor((prev) => {
        if (!prev) {
          return prev
        }

        const existingAssets = prev.draft._meta.assets ?? {}
        const existingMeta = existingAssets[slot]
        const currentPathRaw =
          (slot === "img" ? prev.draft.img : prev.draft.thumbnail)?.trim() ||
          existingMeta?.path?.trim() ||
          ""

        const extension =
          (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png"

        const nextPath =
          currentPathRaw ||
          buildDefaultAssetPath(prev.draft.id || prev.draft._localId, slot, extension)

        const nextAssets: DraftMeta["assets"] = {
          ...existingAssets,
          [slot]: {
            path: nextPath,
            url: existingMeta?.path === nextPath ? existingMeta?.url : undefined,
            sha: existingMeta?.path === nextPath ? existingMeta?.sha : undefined,
            pendingUpload: upload,
          },
        }

        return {
          ...prev,
          error: undefined,
          draft: {
            ...prev.draft,
            ...(slot === "img" ? { img: nextPath } : { thumbnail: nextPath }),
            _meta: {
              ...prev.draft._meta,
              assets: nextAssets,
            },
          },
        }
      })
    } catch (error) {
      setActiveEditor((prev) =>
        prev
          ? {
              ...prev,
              error: (error as Error).message || "Failed to process uploaded image.",
            }
          : prev
      )
    }
  }, [])

  const clearPendingUpload = useCallback((slot: AssetSlot) => {
    setActiveEditor((prev) => {
      if (!prev) {
        return prev
      }
      const existingAssets = prev.draft._meta.assets ?? {}
      const existingMeta = existingAssets[slot]
      if (!existingMeta?.pendingUpload) {
        return prev
      }

      const nextAssets: DraftMeta["assets"] = { ...existingAssets }
      const updatedMeta: AssetMeta = {
        path: existingMeta.path,
        url: existingMeta.url,
        sha: existingMeta.sha,
      }

      if (!updatedMeta.path && !updatedMeta.url && !updatedMeta.sha) {
        delete nextAssets[slot]
      } else {
        nextAssets[slot] = updatedMeta
      }

      return {
        ...prev,
        error: undefined,
        draft: {
          ...prev.draft,
          _meta: {
            ...prev.draft._meta,
            assets: Object.keys(nextAssets).length > 0 ? nextAssets : undefined,
          },
        },
      }
    })
  }, [])

  const addFeatureToEditor = useCallback(() => {
    setActiveEditor((prev) => {
      if (!prev) {
        return prev
      }
      const value = prev.featureInput?.trim() ?? ""
      if (!value) {
        return prev
      }
      const existing = prev.draft.features ?? []
      if (existing.includes(value)) {
        return { ...prev, featureInput: "", error: undefined }
      }
      return {
        ...prev,
        error: undefined,
        featureInput: "",
        draft: {
          ...prev.draft,
          features: [...existing, value],
        },
      }
    })
  }, [])

  const removeFeatureFromEditor = useCallback((feature: string) => {
    setActiveEditor((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        error: undefined,
        draft: {
          ...prev.draft,
          features: prev.draft.features.filter((item) => item !== feature),
        },
      }
    })
  }, [])

  const headerActionsDisabled = loading || saving

  // Check for products with missing required fields
  const productsWithMissingFields = useMemo(() => {
    return draftProducts.filter(
      (product) =>
        !product._meta.isDeleted &&
        !product.category?.trim()
    )
  }, [draftProducts])

  const hasProductsWithMissingFields = productsWithMissingFields.length > 0

  const handleFetchProductBundles = async () => {
    // Use linkNameFromLink from store (parsed from URL) instead of manual input
    const linkNameToUse = linkNameFromLink || linkNameInput.trim()
    if (!linkNameToUse) {
      console.warn("[ProductBundles] No linkName available. Please configure it in Organization settings.")
      return
    }

    setLinkNameLoading(true)
    try {
      // Build fields array dynamically based on selection
      const fields = ["id", "name", "price"]
      if (selectedFields.imageUrl) fields.push("imageUrl")
      if (selectedFields.description) fields.push("description")

      const query = `
        query OrganizationPartnerIntegrationPublicInfo($linkName: String) {
          organizationPartnerIntegrationPublicInfo(linkName: $linkName) {
            productBundles {
              ${fields.join("\n              ")}
            }
          }
        }
      `

      // Build type based on selected fields
      type ProductBundle = {
        id: string
        name: string
        price: number
        imageUrl?: string
        description?: string
      }

      const data = await fetchGraphQL<{
        organizationPartnerIntegrationPublicInfo: {
          productBundles: Array<ProductBundle>
        }
      }>({
        query,
        variables: {
          linkName: linkNameToUse,
        },
      })

      const bundles = data?.organizationPartnerIntegrationPublicInfo?.productBundles || []
      
      // Sanitize HTML descriptions if present
      const sanitizedBundles: FetchedProductBundle[] = bundles.map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        price: bundle.price,
        imageUrl: (bundle as any).imageUrl,
        description: (bundle as any).description
          ? DOMPurify.sanitize((bundle as any).description, { ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'] })
          : undefined,
      }))

      // Store fetched products and open preview modal
      setFetchedProducts(sanitizedBundles)
      setSelectedFetchedProductIds(new Set(sanitizedBundles.map((p) => p.id)))
      setLinkNameModalOpen(false)
      setProductPreviewModalOpen(true)
      
      console.log("[ProductBundles] Response:", data)
    } catch (err) {
      console.error("[ProductBundles] Error:", err)
    } finally {
      setLinkNameLoading(false)
    }
  }

  const toggleField = (field: "imageUrl" | "description") => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const convertFetchedToDraftProduct = useCallback((fetched: FetchedProductBundle): DraftProduct => {
    const imageUrl = fetched.imageUrl || ""
    
    // Convert HTML description to plain text for editing
    // Create a temporary div to extract text content
    let plainDescription = ""
    if (fetched.description) {
      if (typeof document !== "undefined") {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = fetched.description
        plainDescription = tempDiv.textContent || tempDiv.innerText || ""
      } else {
        // Fallback for SSR: strip HTML tags using regex (less accurate but works)
        plainDescription = fetched.description
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
          .replace(/&amp;/g, "&") // Replace &amp; with &
          .replace(/&lt;/g, "<") // Replace &lt; with <
          .replace(/&gt;/g, ">") // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/&#39;/g, "'") // Replace &#39; with '
          .trim()
      }
    }
    
    // Use fetched.name in description if description is empty, otherwise use it as a prefix
    const finalDescription = plainDescription || fetched.name || ""
    
    return {
      id: fetched.id,
      name: fetched.name,
      description: finalDescription,
      category: "", // User must fill
      img: imageUrl,
      thumbnail: imageUrl,
      prices: {
        monthly: fetched.price,
      },
      productBundleIds: {},
      features: [],
      type: "injection", // Default
      availability: undefined,
      popular: false,
      quiz: null,
      _localId: generateLocalId(),
      _meta: {
        isNew: true,
        isDeleted: false,
        isDirty: true,
        assets: imageUrl
          ? {
              img: {
                path: imageUrl,
                url: imageUrl,
                sha: null,
                pendingUpload: null,
              },
              thumbnail: {
                path: imageUrl,
                url: imageUrl,
                sha: null,
                pendingUpload: null,
              },
            }
          : undefined,
      },
    }
  }, [])

  const handleConfirmFetchedProducts = useCallback(() => {
    const selectedProducts = fetchedProducts.filter((p) => selectedFetchedProductIds.has(p.id))
    const draftProductsToAdd = selectedProducts.map(convertFetchedToDraftProduct)
    
    // Add to beginning of draft products
    setDraftProducts((prev) => [...draftProductsToAdd, ...prev])
    
    // Clear state and close modal
    setFetchedProducts([])
    setSelectedFetchedProductIds(new Set())
    setProductPreviewModalOpen(false)
    
    // Show success feedback
      setFeedback({
        type: "success",
        message: `Added ${draftProductsToAdd.length} product(s). Please complete missing fields (category, etc.) before saving.`,
      })
  }, [fetchedProducts, selectedFetchedProductIds, convertFetchedToDraftProduct])

  const toggleFetchedProductSelection = (productId: string) => {
    setSelectedFetchedProductIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Sort products by order
  const sortedDraftProducts = useMemo(() => {
    return [...draftProducts].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })
  }, [draftProducts])

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sortedDraftProducts.findIndex((p) => p._localId === active.id)
    const newIndex = sortedDraftProducts.findIndex((p) => p._localId === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reordered = arrayMove(sortedDraftProducts, oldIndex, newIndex)

    // Update order values for all products
    setDraftProducts(
      reordered.map((product, index) => ({
        ...product,
        order: index + 1,
        _meta: {
          ...product._meta,
          isDirty: true,
        },
      }))
    )
  }

  // Sortable Product Card Component
  function SortableProductCard({ product }: { product: DraftProduct }) {
    const lowestPrice = Object.values(product.prices || {}).reduce<number | null>(
      (acc, value) => {
        if (typeof value !== "number") {
          return acc
        }
        if (acc === null || value < acc) {
          return value
        }
        return acc
      },
      null
    )

    const statusLabel = product._meta.isDeleted
      ? "Marked for deletion"
      : product._meta.isNew
      ? "New product"
      : product._meta.isDirty
      ? "Edited"
      : null

    const imagePending =
      Boolean(product._meta.assets?.img?.pendingUpload) ||
      Boolean(product._meta.assets?.thumbnail?.pendingUpload)

    const quizLabel =
      product.quiz && quizOptions.length > 0
        ? quizNameById[product.quiz] || product.quiz
        : product.quiz || null

    const previewMeta =
      product._meta.assets?.thumbnail ??
      product._meta.assets?.img

    const previewUrl =
      previewMeta?.pendingUpload?.dataUrl ||
      previewMeta?.url ||
      product.thumbnail ||
      product.img

    const isSelected = selectedProductIds.has(product._localId)

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: product._localId,
    })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style}>
        <Card
          onClick={(e) => {
            // Don't open editor if clicking on checkbox or drag handle
            if (
              (e.target as HTMLElement).closest('input[type="checkbox"]') ||
              (e.target as HTMLElement).closest('[data-drag-handle]')
            ) {
              return
            }
            openEditor(product._localId)
          }}
          className={cn(
            "cursor-pointer transition hover:border-accent-color/60 hover:shadow-md",
            product._meta.isDeleted && "opacity-60",
            product._meta.isDirty && !product._meta.isDeleted && "border-accent-color/50",
            isSelected && "ring-2 ring-accent-color"
          )}
        >
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation()
                    setSelectedProductIds((prev) => {
                      const newSet = new Set(prev)
                      if (e.target.checked) {
                        newSet.add(product._localId)
                      } else {
                        newSet.delete(product._localId)
                      }
                      return newSet
                    })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-accent-color focus:ring-accent-color"
                />
                <div
                  {...attributes}
                  {...listeners}
                  data-drag-handle
                  className="cursor-grab active:cursor-grabbing mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{product.name || "Untitled product"}</CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wide">
                    {product.category || "Uncategorized"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusLabel && (
                  <span className="inline-flex items-center rounded-full bg-accent-color/10 px-2 py-1 text-xs font-medium text-accent-color">
                    {statusLabel}
                  </span>
                )}
                {product._meta.isNew && product.category === "" && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Needs Completion
                  </span>
                )}
                {imagePending && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Image pending
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-36 overflow-hidden rounded-lg bg-muted">
              {previewUrl ? (
                <img
                  key={`${product._localId}-${previewMeta?.sha || 'no-sha'}-${previewMeta?.pendingUpload ? 'pending' : 'uploaded'}`}
                  src={previewUrl}
                  alt={product.name || "Product preview"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.error(`❌ Failed to load product image:`, previewUrl)
                    console.error('Product:', product.name, 'Preview meta:', previewMeta)
                  }}
                  onLoad={() => {
                    console.log(`✅ Successfully loaded product image:`, previewUrl)
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="line-clamp-3">{product.description || "No description provided."}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.type && (
                <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                  Type: {product.type}
                </span>
              )}
              {product.availability && (
                <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground capitalize">
                  Availability: {product.availability.replace(/_/g, " ")}
                </span>
              )}
              {product.popular && (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                  Popular
                </span>
              )}
            </div>
            {lowestPrice !== null && (
              <div className="text-sm font-semibold text-foreground">
                Starting at ${lowestPrice}
              </div>
            )}
            {product.features && product.features.length > 0 && (
              <ul className="space-y-1 text-xs">
                {product.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-color" />
                    <span>{feature}</span>
                  </li>
                ))}
                {product.features.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{product.features.length - 3} more features
                  </li>
                )}
              </ul>
            )}
            {quizLabel && (
              <div className="text-xs text-muted-foreground">
                Quiz:{" "}
                <span className="font-medium text-foreground">
                  {quizLabel}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button className="bg-transparent text-muted-foreground hover:bg-muted" onClick={() => openEditor(product._localId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit product
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Products</h3>
            <p className="text-sm text-muted-foreground">
              Manage the product catalog backed by the content repository. Stage edits here and push
              them in a single commit.
            </p>
          </div>
          <div className="flex flex-row items-center gap-2 flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              disabled={loading || !repoOwnerFromLink || !repoNameFromLink}
              className="gap-2 flex-1"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              className="bg-transparent text-muted-foreground hover:bg-muted flex-1"
              onClick={handleDiscardAll}
              disabled={!hasPendingChanges || headerActionsDisabled}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Discard All Changes
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={!hasPendingChanges || saving || hasProductsWithMissingFields}
              className="bg-accent-color text-background-color hover:bg-accent-color/90 flex-1"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
            <Button onClick={handleNewProduct} disabled={headerActionsDisabled} className="flex-1">
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinkNameModalOpen(true)}
              disabled={headerActionsDisabled}
              className="flex-1"
            >
              Fetch Product Bundles
            </Button>
          </div>
        </div>

        {hasProductsWithMissingFields && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">
                Cannot save: {productsWithMissingFields.length} product(s) have missing required fields.
              </p>
              <p className="text-xs mt-1">
                Please complete the <strong>name</strong> and <strong>category</strong> fields for all products before saving.
                {productsWithMissingFields.length <= 5 && (
                  <span className="ml-1">
                    Products: {productsWithMissingFields.map((p) => p.name || p.id).join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-sm",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Failed to load products
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={fetchProducts} className="gap-2">
                <Loader2 className="h-4 w-4" />
                Retry
              </Button>
            </CardFooter>
          </Card>
        ) : draftProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No products found. Add a new product to get started.
            </CardContent>
          </Card>
        ) : (
          <>
            {selectedProductIds.size > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                <span className="text-sm font-medium text-amber-700">
                  {selectedProductIds.size} product{selectedProductIds.size > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectedProductIds.forEach((localId) => {
                      handleToggleDelete(localId, true)
                    })
                    setSelectedProductIds(new Set())
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete product{selectedProductIds.size > 1 ? "s" : ""}
                </Button>
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={sortedDraftProducts.map((p) => p._localId)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedDraftProducts.map((product) => (
                    <SortableProductCard key={product._localId} product={product} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>

      <Dialog.Root open={Boolean(activeEditor)} onOpenChange={(open) => !open && setActiveEditor(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-scroll rounded-xl border border-border bg-background-color shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  {activeEditor?.draft.id || "New product"}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Update product details, then apply changes to stage them for saving.
                </Dialog.Description>
              </div>
              <Button
                className="bg-transparent text-muted-foreground hover:bg-muted"
                onClick={() => setActiveEditor(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {activeEditor && (
              <>
                <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-transparent text-muted-foreground hover:bg-muted"
                      onClick={() => handleDiscardProduct(activeEditor.draft._localId)}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Discard changes
                    </Button>
                    <Button
                      className={cn(
                        "bg-transparent hover:bg-muted",
                        activeEditor.draft._meta.isDeleted
                          ? "text-muted-foreground"
                          : "text-red-600 hover:text-red-700"
                      )}
                      onClick={() =>
                        activeEditor.draft._meta.isDeleted
                          ? handleUndoDelete(activeEditor.draft._localId)
                          : handleToggleDelete(activeEditor.draft._localId, true)
                      }
                    >
                      {activeEditor.draft._meta.isDeleted ? (
                        <>
                          <Undo2 className="mr-2 h-4 w-4" />
                          Undo delete
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete product
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-transparent text-muted-foreground hover:bg-muted"
                      onClick={() => setActiveEditor(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={applyEditorChanges}>
                      <Save className="mr-2 h-4 w-4" />
                      Apply changes
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="grid gap-6">
                    {activeEditor.error && (
                      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <XCircle className="h-4 w-4" />
                        <span>{activeEditor.error}</span>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-id">Product ID</Label>
                        <Input
                          id="product-id"
                          value={activeEditor.draft.id}
                          onChange={(event) => {
                            resetEditorError()
                            const value = event.target.value
                            setActiveEditor((prev) =>
                              prev ? { ...prev, draft: { ...prev.draft, id: value } } : prev
                            )
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Name</Label>
                        <Input
                          id="product-name"
                          value={activeEditor.draft.name}
                          onChange={(event) => {
                            resetEditorError()
                            const value = event.target.value
                            setActiveEditor((prev) =>
                              prev ? { ...prev, draft: { ...prev.draft, name: value } } : prev
                            )
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category">Category</Label>
                        <Select
                          value={activeEditor.draft.category}
                          onValueChange={(value) => {
                            resetEditorError()
                            setActiveEditor((prev) =>
                              prev ? { ...prev, draft: { ...prev.draft, category: value } } : prev
                            )
                          }}
                        >
                          <SelectTrigger className="w-full" id="product-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={activeEditor.draft.type || "unset"}
                          onValueChange={(value) => {
                            resetEditorError()
                            setActiveEditor((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    draft: {
                                      ...prev.draft,
                                      type:
                                        value === "unset"
                                          ? undefined
                                          : (value as Product["type"]),
                                    },
                                  }
                                : prev
                            )
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">Not specified</SelectItem>
                            {PRODUCT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select
                          value={activeEditor.draft.availability ?? "unset"}
                          onValueChange={(value) => {
                            resetEditorError()
                            setActiveEditor((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    draft: {
                                      ...prev.draft,
                                      availability:
                                        value === "unset"
                                          ? undefined
                                          : (value as NonNullable<Product["availability"]>),
                                    },
                                  }
                                : prev
                            )
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select availability status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">Not specified</SelectItem>
                            {AVAILABILITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quiz</Label>
                        <Select
                          value={activeEditor.draft.quiz ?? "none"}
                          onValueChange={(value) => {
                            resetEditorError()
                            setActiveEditor((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    draft: {
                                      ...prev.draft,
                                      quiz: value === "none" ? null : value,
                                    },
                                  }
                                : prev
                            )
                          }}
                          disabled={quizOptions.length === 0 && !activeEditor.draft.quiz}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select quiz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No quiz</SelectItem>
                            {quizOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                            {activeEditor.draft.quiz &&
                              !quizNameById[activeEditor.draft.quiz] && (
                                <SelectItem value={activeEditor.draft.quiz}>
                                  {activeEditor.draft.quiz} (not found in config)
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Assign an intake quiz to launch after checkout.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Popular</Label>
                        <div className="flex h-10 items-center gap-3 rounded-lg border px-3">
                          <Switch
                            checked={activeEditor.draft.popular ?? false}
                            onCheckedChange={(checked) => {
                              resetEditorError()
                              setActiveEditor((prev) =>
                                prev
                                  ? { ...prev, draft: { ...prev.draft, popular: checked } }
                                  : prev
                              )
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            Highlight as popular recommendation
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {ASSET_SLOTS.map((slot) => {
                        const assetMeta = activeEditor.draft._meta.assets?.[slot]
                        const previewUrl =
                          assetMeta?.pendingUpload?.dataUrl ||
                          assetMeta?.url ||
                          ""
                        const inputId =
                          slot === "img" ? "product-img-upload" : "product-thumbnail-upload"
                        const pathValue =
                          slot === "img"
                            ? activeEditor.draft.img
                            : activeEditor.draft.thumbnail
                        const label =
                          slot === "img" ? "Primary image" : "Thumbnail image"
                        const description =
                          slot === "img"
                            ? "Displayed on product cards and detail pages."
                            : "Used in listings or condensed views."

                        return (
                          <div key={slot} className="space-y-3 rounded-lg border p-4">
                            <div className="space-y-1">
                              <Label>{label}</Label>
                              <p className="text-xs text-muted-foreground">{description}</p>
                            </div>
                            <div className="relative overflow-hidden rounded-md border bg-muted">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt={`${label} preview`}
                                  className="h-48 w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-48 w-full items-center justify-center text-xs text-muted-foreground">
                                  No preview available
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Input
                                value={pathValue}
                                onChange={(event) => {
                                  resetEditorError()
                                  const value = event.target.value
                                  setActiveEditor((prev) => {
                                    if (!prev) {
                                      return prev
                                    }
                                    const existingAssets = prev.draft._meta.assets ?? {}
                                    const existingMeta = existingAssets[slot]
                                    const nextAssets: DraftMeta["assets"] = { ...existingAssets }
                                    if (value) {
                                      const samePath = existingMeta?.path === value
                                      nextAssets[slot] = {
                                        path: value,
                                        url: samePath ? existingMeta?.url : undefined,
                                        sha: samePath ? existingMeta?.sha : undefined,
                                        pendingUpload: existingMeta?.pendingUpload ?? undefined,
                                      }
                                    } else if (existingMeta?.pendingUpload) {
                                      nextAssets[slot] = {
                                        path: "",
                                        pendingUpload: existingMeta.pendingUpload,
                                      }
                                    } else {
                                      delete nextAssets[slot]
                                    }
                                    return {
                                      ...prev,
                                      draft: {
                                        ...prev.draft,
                                        ...(slot === "img"
                                          ? { img: value }
                                          : { thumbnail: value }),
                                        _meta: {
                                          ...prev.draft._meta,
                                          assets:
                                            Object.keys(nextAssets).length > 0
                                              ? nextAssets
                                              : undefined,
                                        },
                                      },
                                    }
                                  })
                                }}
                                placeholder="Path in content repo, e.g. /assets/images/products/example.png"
                              />
                              <div className="flex flex-wrap gap-2">
                                <input
                                  id={inputId}
                                  type="file"
                                  accept="image/*,.png,.jpg,.jpeg,.webp,.gif"
                                  className="hidden"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null
                                    handleImageFileChange(slot, file)
                                    event.target.value = ""
                                  }}
                                />
                                <Button
                                  type="button"
                                  asChild
                                  className="bg-transparent text-muted-foreground hover:bg-muted"
                                >
                                  <label htmlFor={inputId} className="cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Upload image
                                  </label>
                                </Button>
                                {assetMeta?.pendingUpload && (
                                  <Button
                                    type="button"
                                    className="bg-transparent text-muted-foreground hover:bg-muted"
                                    onClick={() => clearPendingUpload(slot)}
                                  >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Remove upload
                                  </Button>
                                )}
                                {assetMeta?.url && !assetMeta.pendingUpload && (
                                  <Button
                                    type="button"
                                    className="bg-transparent text-muted-foreground hover:bg-muted"
                                    asChild
                                  >
                                    <a
                                      href={assetMeta.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      View current image
                                    </a>
                                  </Button>
                                )}
                              </div>
                              {assetMeta?.pendingUpload && (
                                <p className="text-xs text-amber-600">
                                  New image staged. Save changes to upload.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-description">Description</Label>
                      <Textarea
                        id="product-description"
                        className="min-h-[120px]"
                        value={activeEditor.draft.description}
                        onChange={(event) => {
                          resetEditorError()
                          const value = event.target.value
                          setActiveEditor((prev) =>
                            prev ? { ...prev, draft: { ...prev.draft, description: value } } : prev
                          )
                        }}
                      />
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                      <h4 className="text-sm font-semibold">Price tiers</h4>
                      <div className="space-y-3">
                        {activeEditor.priceEntries.map((entry, index) => (
                          <div
                            key={`price-${entry.key}`}
                            className="grid gap-3 rounded-md border p-3 md:grid-cols-[200px_1fr]"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {PRICE_LABELS[entry.key]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Leave blank to omit this tier
                              </p>
                            </div>
                            <Input
                              type="number"
                              placeholder="Price"
                              value={entry.value}
                              onChange={(event) => {
                                resetEditorError()
                                const value = event.target.value
                                setActiveEditor((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        priceEntries: prev.priceEntries.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, value } : item
                                        ),
                                      }
                                    : prev
                                )
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                      <h4 className="text-sm font-semibold">Product bundle identifiers</h4>
                      <div className="space-y-3">
                        {activeEditor.bundleEntries.map((entry, index) => (
                          <div
                            key={`bundle-${entry.key}`}
                            className="grid gap-3 rounded-md border p-3 md:grid-cols-[200px_1fr]"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {BUNDLE_LABELS[entry.key]}
                              </p>
                              <p className="text-xs text-muted-foreground">Optional</p>
                            </div>
                            <Input
                              placeholder="Bundle identifier"
                              value={entry.value}
                              onChange={(event) => {
                                resetEditorError()
                                const value = event.target.value
                                setActiveEditor((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        bundleEntries: prev.bundleEntries.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, value } : item
                                        ),
                                      }
                                    : prev
                                )
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Features</Label>
                      <div className="flex flex-wrap gap-2 rounded-md border border-dashed border-muted p-3">
                        {activeEditor.draft.features.length > 0 ? (
                          activeEditor.draft.features.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
                            >
                              {feature}
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => removeFeatureFromEditor(feature)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No features yet. Add a few below.
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          placeholder="Add a feature"
                          value={activeEditor.featureInput}
                          onChange={(event) => {
                            resetEditorError()
                            const value = event.target.value
                            setActiveEditor((prev) =>
                              prev ? { ...prev, featureInput: value } : prev
                            )
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              addFeatureToEditor()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          className="bg-transparent text-muted-foreground hover:bg-muted"
                          onClick={addFeatureToEditor}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add feature
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter to add the current feature text as a tag.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={linkNameModalOpen} onOpenChange={setLinkNameModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background-color shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <Dialog.Title className="text-xl font-semibold">
                Fetch Product Bundles
              </Dialog.Title>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLinkNameModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="linkName">Link Name</Label>
                <Input
                  id="linkName"
                  value={linkNameFromLink || linkNameInput}
                  onChange={(e) => setLinkNameInput(e.target.value)}
                  placeholder={linkNameFromLink ? linkNameFromLink : "e.g., better-days-pt-wellness"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !linkNameLoading && (linkNameFromLink || linkNameInput.trim())) {
                      handleFetchProductBundles()
                    }
                  }}
                  disabled={linkNameLoading || !!linkNameFromLink}
                />
                {linkNameFromLink && (
                  <p className="text-xs text-muted-foreground">
                    Using link name from organization settings. Configure in Organization Config to change.
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label>Select Fields to Fetch</Label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                    <span className="text-sm font-medium">id</span>
                    <span className="text-xs text-muted-foreground">(always included)</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                    <span className="text-sm font-medium">name</span>
                    <span className="text-xs text-muted-foreground">(always included)</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                    <span className="text-sm font-medium">price</span>
                    <span className="text-xs text-muted-foreground">(always included)</span>
                  </div>
                  <Button
                    type="button"
                    variant={selectedFields.imageUrl ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleField("imageUrl")}
                    disabled={linkNameLoading}
                    className="px-3 py-2"
                  >
                    imageUrl
                    {selectedFields.imageUrl && " ✓"}
                  </Button>
                  <Button
                    type="button"
                    variant={selectedFields.description ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleField("description")}
                    disabled={linkNameLoading}
                    className="px-3 py-2"
                  >
                    description
                    {selectedFields.description && " ✓"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click buttons to toggle optional fields (imageUrl, description)
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLinkNameModalOpen(false)
                    setLinkNameInput("")
                    setSelectedFields({ imageUrl: false, description: false })
                  }}
                  disabled={linkNameLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFetchProductBundles}
                  disabled={(!linkNameFromLink && !linkNameInput.trim()) || linkNameLoading}
                >
                  {linkNameLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Product Preview Modal */}
      <Dialog.Root open={productPreviewModalOpen} onOpenChange={setProductPreviewModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background-color shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <Dialog.Title className="text-xl font-semibold">
                Preview Fetched Products ({selectedFetchedProductIds.size} selected)
              </Dialog.Title>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setProductPreviewModalOpen(false)
                  setFetchedProducts([])
                  setSelectedFetchedProductIds(new Set())
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Warning Banner */}
            <div className="border-b bg-amber-50 px-6 py-3 shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Missing Required Fields
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    These products are missing required fields: <strong>category</strong>.
                    Recommended fields: type (defaults to "injection"), availability, features, bundle IDs. Please add these details after confirming.
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ScrollArea className="flex-1 px-6 py-4 min-h-0">
              {fetchedProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No products to preview
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fetchedProducts.map((product) => {
                    const isSelected = selectedFetchedProductIds.has(product.id)
                    const hasMissingFields = true // All fetched products have missing fields
                    
                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          "relative transition-all",
                          isSelected
                            ? "border-accent-color ring-2 ring-accent-color/20"
                            : "border-border",
                          !isSelected && "opacity-60"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => toggleFetchedProductSelection(product.id)}
                            >
                              {isSelected ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {hasMissingFields && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Missing Fields
                            </span>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {product.imageUrl && (
                            <div className="relative h-32 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">${product.price}</span>
                              <span className="text-sm text-muted-foreground">/month</span>
                            </div>
                            {product.description && (
                              <div
                                className="text-xs text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4 shrink-0">
              <p className="text-sm text-muted-foreground">
                {selectedFetchedProductIds.size} of {fetchedProducts.length} products selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProductPreviewModalOpen(false)
                    setFetchedProducts([])
                    setSelectedFetchedProductIds(new Set())
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmFetchedProducts}
                  disabled={selectedFetchedProductIds.size === 0}
                >
                  Confirm & Add to Products ({selectedFetchedProductIds.size})
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

