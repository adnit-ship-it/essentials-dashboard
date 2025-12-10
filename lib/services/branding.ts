/**
 * Branding service for fetching and saving branding data
 */

import type {
  BrandingColors,
  BrandingData,
  BrandSettingsData,
  HeroLogoHeights,
  LogoHeights,
  LogoLocation,
  LogoSlot,
  LogoState,
  LogoUpload,
  LogoUploadResult,
  PageKey,
  PageName,
  PendingUpload,
} from "@/lib/types/branding"
import { normalizeHexForSave } from "@/lib/utils/colors"
import { extractNumericValue, formatWithPx } from "@/lib/utils/logo-heights"
import {
  assetSrcToRepoPath,
  normalizeRepoPathInput,
  repoPathToAssetSrc,
} from "@/lib/utils/repo-paths"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const DEFAULT_COLORS: BrandingColors = {
  backgroundColor: "#FDFAF6",
  bodyColor: "#000000",
  accentColor1: "#A75809",
  accentColor2: "#F8F2EC",
}

const DEFAULT_LOGO_PATHS: Record<LogoSlot, string> = {
  primary: "public/assets/images/brand/logo.svg",
  secondary: "public/assets/images/brand/logo-alt.svg",
}

/**
 * Page key mapping: route path ↔ page name
 */
const PAGE_KEY_TO_NAME: Record<PageKey, PageName> = {
  "/": "home",
  "/about": "about",
  "/products": "products",
  "/contact": "contact",
}

const PAGE_NAME_TO_KEY: Record<PageName, PageKey> = {
  home: "/",
  about: "/about",
  products: "/products",
  contact: "/contact",
}

export function pageKeyToName(pageKey: PageKey): PageName {
  return PAGE_KEY_TO_NAME[pageKey]
}

export function pageNameToKey(pageName: PageName): PageKey {
  return PAGE_NAME_TO_KEY[pageName]
}

/**
 * Gets the next available logo number for a given type
 * Lists files in the brand directory and finds the highest number
 */
export async function getNextLogoNumber(
  owner: string,
  repo: string,
  type: "primary" | "secondary" | "hero" | "loadingScreen" | "favicon"
): Promise<number> {
  try {
    const url = `${API_BASE_URL}/api/directory/list?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent("public/assets/images/brand")}`
    const response = await fetch(url)
    
    if (!response.ok) {
      // If directory listing fails, start from 1
      return 1
    }

    const data = await response.json()
    const files: string[] = data.files || []

    // Pattern: logo-{type}-{number}.{ext}
    // Map "loadingScreen" to "loading" for file matching
    const fileType = type === "loadingScreen" ? "loading" : type
    const pattern = new RegExp(`^logo-${fileType}-(\\d+)\\.`, "i")
    const numbers: number[] = []

    for (const file of files) {
      const match = file.match(pattern)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num)) {
          numbers.push(num)
        }
      }
    }

    if (numbers.length === 0) {
      return 1
    }

    return Math.max(...numbers) + 1
  } catch (error) {
    console.error("Error getting next logo number:", error)
    // On error, start from 1
    return 1
  }
}

/**
 * Generates a unique logo filename with number
 * Pattern: logo-{type}-{number}.{ext}
 */
export async function generateUniqueLogoFileName(
  owner: string,
  repo: string,
  type: "primary" | "secondary" | "hero" | "loadingScreen" | "favicon",
  extension: string = "svg"
): Promise<string> {
  const number = await getNextLogoNumber(owner, repo, type)
  // Map "loadingScreen" to "loading" for filename
  const fileType = type === "loadingScreen" ? "loading" : type
  return `logo-${fileType}-${number}.${extension}`
}

/**
 * Creates default empty logo heights structure (no "common" - only actual pages)
 */
function createDefaultLogoHeights(): Record<PageKey, LogoHeights> {
  const defaultHeights: LogoHeights = {
    navbar: { mobile: "", desktop: "" },
    navbarLogo: { mobile: "", tablet: "", desktop: "" },
    footer: { mobile: "", desktop: "" },
    footerLogo: { mobile: "", desktop: "" },
  }
  return {
    "/": { ...defaultHeights },
    "/about": { ...defaultHeights },
    "/products": { ...defaultHeights },
    "/contact": { ...defaultHeights },
  }
}

/**
 * Fetches branding data from the API
 */
export async function fetchBrandingData(
  owner: string,
  repo: string
): Promise<BrandingData> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  let websiteContent: any = null
  let contentSha: string | null = null
  
  try {
    const contentUrl = `${API_BASE_URL}/api/content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
    const contentResponse = await fetch(contentUrl)
    if (contentResponse.ok) {
      const contentData = await contentResponse.json()
      websiteContent = contentData.content || {}
      contentSha = contentData.sha || null
    }
  } catch (contentError) {
    console.error("Failed to load website content for branding panel:", contentError)
  }

  // Extract page title
  const pageTitle = websiteContent?.common?.pageTitle || ""
  
  const logoHeights = createDefaultLogoHeights()
  
  // Build page logos structure and load logo heights from new structure
  const pageLogos: Record<PageName, Record<LogoLocation, LogoState>> = {
    home: { navbar: { path: "" }, footer: { path: "" } },
    about: { navbar: { path: "" }, footer: { path: "" } },
    products: { navbar: { path: "" }, footer: { path: "" } },
    contact: { navbar: { path: "" }, footer: { path: "" } },
  }
  
  // Load global navbar/footer heights from common (with fallback to page-specific for migration)
  let globalNavbarHeights = { mobile: "", desktop: "" }
  let globalFooterHeights = { mobile: "", desktop: "" }
  
  if (websiteContent?.common?.navbarHeights) {
    globalNavbarHeights = {
      mobile: extractNumericValue(websiteContent.common.navbarHeights.mobile || ""),
      desktop: extractNumericValue(websiteContent.common.navbarHeights.desktop || ""),
    }
  } else if (websiteContent?.home?.navbar?.heights) {
    // Fallback to home page for migration
    globalNavbarHeights = {
      mobile: extractNumericValue(websiteContent.home.navbar.heights.mobile || ""),
      desktop: extractNumericValue(websiteContent.home.navbar.heights.desktop || ""),
    }
  }
  
  if (websiteContent?.common?.footerHeights) {
    globalFooterHeights = {
      mobile: extractNumericValue(websiteContent.common.footerHeights.mobile || ""),
      desktop: extractNumericValue(websiteContent.common.footerHeights.desktop || ""),
    }
  } else if (websiteContent?.home?.footer?.heights) {
    // Fallback to home page for migration
    globalFooterHeights = {
      mobile: extractNumericValue(websiteContent.home.footer.heights.mobile || ""),
      desktop: extractNumericValue(websiteContent.home.footer.heights.desktop || ""),
    }
  }

  if (websiteContent) {
    // Load layouts from new structure: home.layout, about.layout, etc.
    const pages: PageName[] = ["home", "about", "products", "contact"]
    
    for (const pageName of pages) {
      const pageKey = pageNameToKey(pageName)
      const pageLayout = websiteContent[pageName]?.layout || {}
      const pageNavbar = pageLayout?.navbar || {}
      const pageFooter = pageLayout?.footer || {}
      
      // Load logo heights (use global heights for navbar/footer, page-specific for logo sizes)
      logoHeights[pageKey] = {
        navbar: globalNavbarHeights, // Use global heights
        navbarLogo: {
          mobile: extractNumericValue(pageNavbar?.logo?.height?.mobile || ""),
          tablet: extractNumericValue(pageNavbar?.logo?.height?.tablet || ""),
          desktop: extractNumericValue(pageNavbar?.logo?.height?.desktop || ""),
        },
        footer: globalFooterHeights, // Use global heights
        footerLogo: {
          mobile: extractNumericValue(pageFooter?.logo?.height?.mobile || ""),
          desktop: extractNumericValue(pageFooter?.logo?.height?.desktop || ""),
        },
      }
      
      // Load logo paths from new structure
      const navbarLogoSrc = pageNavbar?.logo?.src || ""
      const footerLogoSrc = pageFooter?.logo?.src || ""
      
      pageLogos[pageName].navbar.path = normalizeRepoPathInput(
        assetSrcToRepoPath(navbarLogoSrc) || "",
        pageName === "home" ? DEFAULT_LOGO_PATHS.primary : ""
      )
      pageLogos[pageName].footer.path = normalizeRepoPathInput(
        assetSrcToRepoPath(footerLogoSrc) || "",
        pageName === "home" ? DEFAULT_LOGO_PATHS.secondary : ""
      )
    }
  }

  // Load hero logo and heights from home.hero.media.logo
  let heroLogoHeights: HeroLogoHeights | null = null
  let heroLogoSrc = ""
  if (websiteContent?.home?.hero?.media?.logo) {
    const heroLogo = websiteContent.home.hero.media.logo
    heroLogoSrc = heroLogo.src || ""
    
    if (heroLogo.heights) {
      heroLogoHeights = {
        mobile: extractNumericValue(heroLogo.heights.mobile || ""),
        tablet: extractNumericValue(heroLogo.heights.tablet || ""),
        desktop: extractNumericValue(heroLogo.heights.desktop || ""),
      }
    }
  }
  
  // Get hero logo path
  const heroLogoPath = normalizeRepoPathInput(
    assetSrcToRepoPath(heroLogoSrc) || "",
    "public/assets/images/brand/hero-logo.svg"
  )

  // Infer primary/secondary paths for backward compatibility (use home page logos)
  const inferredPrimaryPath = pageLogos.home.navbar.path || DEFAULT_LOGO_PATHS.primary
  const inferredSecondaryPath = pageLogos.home.footer.path || DEFAULT_LOGO_PATHS.secondary

  // Fetch branding data
  const brandingUrl = new URL(`${API_BASE_URL}/api/branding`)
  brandingUrl.searchParams.set("owner", owner)
  brandingUrl.searchParams.set("repo", repo)
  brandingUrl.searchParams.set("brandLogoPath", inferredPrimaryPath)
  brandingUrl.searchParams.set("brandAltLogoPath", inferredSecondaryPath)

  const response = await fetch(brandingUrl.toString())
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = await response.json()
  const colors: BrandingColors = {
    backgroundColor: data.colors?.backgroundColor || DEFAULT_COLORS.backgroundColor,
    bodyColor: data.colors?.bodyColor || DEFAULT_COLORS.bodyColor,
    accentColor1: data.colors?.accentColor1 || DEFAULT_COLORS.accentColor1,
    accentColor2: data.colors?.accentColor2 || DEFAULT_COLORS.accentColor2,
  }

  // Fetch logo URLs and SHAs from API for each page logo
  // For now, we'll use the branding API which expects primary/secondary paths
  // TODO: Update backend API to support page-specific logo fetching
  
  // Fetch hero logo metadata if path exists
  let heroLogoUrl: string | undefined
  let heroLogoSha: string | null = null
  if (heroLogoPath && heroLogoPath !== "public/assets/images/brand/hero-logo.svg") {
    // Try to get hero logo URL and SHA from branding API
    // For now, we'll construct the URL from the path
    // The actual URL fetching would need backend support
  }

  return {
    colors,
    logos: {
      primary: {
        path: data.logos?.primary?.path || inferredPrimaryPath,
        url: data.logos?.primary?.url,
        sha: data.logos?.primary?.sha ?? null,
      },
      secondary: {
        path: data.logos?.secondary?.path || inferredSecondaryPath,
        url: data.logos?.secondary?.url,
        sha: data.logos?.secondary?.sha ?? null,
      },
    },
    pageLogos, // New structure
    tailwindSha: data.sha,
    pageTitle,
    contentSha,
    logoHeights,
    heroLogoHeights,
    heroLogo: {
      path: heroLogoPath,
      url: heroLogoUrl,
      sha: heroLogoSha,
    },
  }
}

/**
 * Uploads a logo file - always creates a new file (never updates existing)
 */
export async function uploadLogo(
  owner: string,
  repo: string,
  upload: LogoUpload
): Promise<LogoUploadResult> {
  if (!upload.path) {
    throw new Error("Logo path is missing. Please refresh and try again.")
  }

  const url = `${API_BASE_URL}/api/product-images?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const requestBody: Record<string, any> = {
    path: upload.path,
    contentBase64: upload.base64,
    // No SHA needed - always creating new files
    commitMessage: `CMS: Add ${upload.slot} logo (${new Date().toISOString()})`,
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body.error || `Logo upload failed with status ${response.status}.`
    throw new Error(message)
  }

  const result = await response.json()
  return {
    url: result.fileUrl,
    sha: result.newSha ?? null,
    path: upload.path,
  }
}

/**
 * Saves branding colors
 */
export async function saveBrandingColors(
  owner: string,
  repo: string,
  colors: BrandingColors,
  tailwindSha: string
): Promise<{ newSha: string; colors: BrandingColors }> {
  const sanitizedColors: BrandingColors = {
    backgroundColor: normalizeHexForSave(colors.backgroundColor),
    bodyColor: normalizeHexForSave(colors.bodyColor),
    accentColor1: normalizeHexForSave(colors.accentColor1),
    accentColor2: normalizeHexForSave(colors.accentColor2),
  }

  const putUrl = `${API_BASE_URL}/api/branding?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const response = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      colors: sanitizedColors,
      sha: tailwindSha,
      commitMessage: `CMS: Update brand colors (${new Date().toISOString()})`,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body.error || `Branding update failed with status ${response.status}.`
    throw new Error(message)
  }

  const result = await response.json()
  return {
    newSha: result.newSha || tailwindSha,
    colors: result.colors || sanitizedColors,
  }
}

/**
 * Saves content updates (page title, logo heights, logo paths)
 */
export async function saveContent(
  owner: string,
  repo: string,
  contentSha: string,
  updates: {
    pageTitle?: string
    pageDescription?: string
    logoHeights?: Record<PageKey, LogoHeights>
    logoPaths?: Record<LogoSlot, string>
    heroLogoHeights?: HeroLogoHeights
    heroLogoPath?: string
    layoutHeights?: { navbar: { mobile: string; desktop: string }; footer: { mobile: string; desktop: string } }
  },
  isRetry: boolean = false
): Promise<{ sha: string }> {
  // Fetch current content to merge changes
  const contentUrl = `${API_BASE_URL}/api/content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const contentResponse = await fetch(contentUrl)
  if (!contentResponse.ok) {
    throw new Error(`Failed to fetch content: ${contentResponse.status}`)
  }
  
  const contentData = await contentResponse.json()
  const currentContent = contentData.content || {}
  // Use the fresh SHA from the fetch instead of the stale parameter
  // This prevents 409 conflicts when multiple operations modify websiteText.json
  const freshContentSha = contentData.sha || contentSha
  
  // Update pageTitle if provided
  if (updates.pageTitle !== undefined) {
    if (!currentContent.common) {
      currentContent.common = {}
    }
    currentContent.common.pageTitle = updates.pageTitle
  }
  
  // Update pageDescription if provided
  if (updates.pageDescription !== undefined) {
    if (!currentContent.common) {
      currentContent.common = {}
    }
    currentContent.common.pageDescription = updates.pageDescription
  }
  
  // Update global layout heights if provided
  if (updates.layoutHeights) {
    const layoutHeights = updates.layoutHeights
    if (!currentContent.common) {
      currentContent.common = {}
    }
    if (!currentContent.common.navbarHeights) {
      currentContent.common.navbarHeights = {}
    }
    if (!currentContent.common.footerHeights) {
      currentContent.common.footerHeights = {}
    }
    currentContent.common.navbarHeights.mobile = formatWithPx(layoutHeights.navbar.mobile)
    currentContent.common.navbarHeights.desktop = formatWithPx(layoutHeights.navbar.desktop)
    currentContent.common.footerHeights.mobile = formatWithPx(layoutHeights.footer.mobile)
    currentContent.common.footerHeights.desktop = formatWithPx(layoutHeights.footer.desktop)
  }
  
  // Update global navbar/footer heights if provided (save to common.navbarHeights and common.footerHeights)
  if (updates.logoHeights) {
    // Get heights from first page (all pages should have same global heights now)
    const firstPageHeights = updates.logoHeights["/"]
    if (firstPageHeights) {
      // Save global navbar heights
      if (!currentContent.common) {
        currentContent.common = {}
      }
      if (!currentContent.common.navbarHeights) {
        currentContent.common.navbarHeights = {}
      }
      currentContent.common.navbarHeights.mobile = formatWithPx(firstPageHeights.navbar.mobile)
      currentContent.common.navbarHeights.desktop = formatWithPx(firstPageHeights.navbar.desktop)
      
      // Save global footer heights
      if (!currentContent.common.footerHeights) {
        currentContent.common.footerHeights = {}
      }
      currentContent.common.footerHeights.mobile = formatWithPx(firstPageHeights.footer.mobile)
      currentContent.common.footerHeights.desktop = formatWithPx(firstPageHeights.footer.desktop)
    }
    
    // Update logo-specific heights per page (navbarLogo, footerLogo)
    for (const pageKey of ["/", "/about", "/products", "/contact"] as const) {
      const pageName = pageKeyToName(pageKey)
      const pageHeights = updates.logoHeights[pageKey]
      if (!pageHeights) continue
      
      // Ensure page object exists
      if (!currentContent[pageName]) {
        currentContent[pageName] = {}
      }
      if (!currentContent[pageName].layout) {
        currentContent[pageName].layout = {}
      }
      if (!currentContent[pageName].layout.navbar) {
        currentContent[pageName].layout.navbar = {}
      }
      if (!currentContent[pageName].layout.footer) {
        currentContent[pageName].layout.footer = {}
      }
      
      // Update navbar logo heights (logo-specific, not navbar height)
      if (!currentContent[pageName].layout.navbar.logo) {
        currentContent[pageName].layout.navbar.logo = {}
      }
      if (!currentContent[pageName].layout.navbar.logo.height) {
        currentContent[pageName].layout.navbar.logo.height = {}
      }
      currentContent[pageName].layout.navbar.logo.height.mobile = formatWithPx(pageHeights.navbarLogo.mobile)
      currentContent[pageName].layout.navbar.logo.height.tablet = formatWithPx(pageHeights.navbarLogo.tablet)
      currentContent[pageName].layout.navbar.logo.height.desktop = formatWithPx(pageHeights.navbarLogo.desktop)
      
      // Update footer logo heights (logo-specific, not footer height)
      if (!currentContent[pageName].layout.footer.logo) {
        currentContent[pageName].layout.footer.logo = {}
      }
      if (!currentContent[pageName].layout.footer.logo.height) {
        currentContent[pageName].layout.footer.logo.height = {}
      }
      currentContent[pageName].layout.footer.logo.height.mobile = formatWithPx(pageHeights.footerLogo.mobile)
      currentContent[pageName].layout.footer.logo.height.desktop = formatWithPx(pageHeights.footerLogo.desktop)
    }
  }
  
  // Update logo paths if provided - write to new structure (page.layout.navbar.logo.src, etc.)
  // Format: { page: PageName, location: LogoLocation, path: string }
  if (updates.logoPaths) {
    // Handle legacy format (LogoSlot) for backward compatibility
    if (updates.logoPaths.primary || updates.logoPaths.secondary) {
      // Legacy: primary -> home.navbar, secondary -> home.footer
      if (updates.logoPaths.primary) {
        const assetSrc = repoPathToAssetSrc(updates.logoPaths.primary)
        if (!currentContent.home) currentContent.home = {}
        if (!currentContent.home.layout) currentContent.home.layout = {}
        if (!currentContent.home.layout.navbar) currentContent.home.layout.navbar = {}
        if (!currentContent.home.layout.navbar.logo) currentContent.home.layout.navbar.logo = {}
        currentContent.home.layout.navbar.logo.src = assetSrc
      }
      if (updates.logoPaths.secondary) {
        const assetSrc = repoPathToAssetSrc(updates.logoPaths.secondary)
        if (!currentContent.home) currentContent.home = {}
        if (!currentContent.home.layout) currentContent.home.layout = {}
        if (!currentContent.home.layout.footer) currentContent.home.layout.footer = {}
        if (!currentContent.home.layout.footer.logo) currentContent.home.layout.footer.logo = {}
        currentContent.home.layout.footer.logo.src = assetSrc
      }
    }
    
    // Handle new format: { page: PageName, location: LogoLocation, path: string }
    // This will be passed from the UI when we update it
    if ((updates.logoPaths as any).page && (updates.logoPaths as any).location) {
      const pageName = (updates.logoPaths as any).page as PageName
      const location = (updates.logoPaths as any).location as LogoLocation
      const path = (updates.logoPaths as any).path as string
      
      if (path) {
        const assetSrc = repoPathToAssetSrc(path)
        if (!currentContent[pageName]) currentContent[pageName] = {}
        if (!currentContent[pageName].layout) currentContent[pageName].layout = {}
        if (!currentContent[pageName].layout[location]) currentContent[pageName].layout[location] = {}
        if (!currentContent[pageName].layout[location].logo) currentContent[pageName].layout[location].logo = {}
        currentContent[pageName].layout[location].logo.src = assetSrc
      }
    }
  }
  
  // Update hero logo heights if provided
  if (updates.heroLogoHeights) {
    if (!currentContent.home) {
      currentContent.home = {}
    }
    if (!currentContent.home.hero) {
      currentContent.home.hero = {}
    }
    if (!currentContent.home.hero.media) {
      currentContent.home.hero.media = {}
    }
    if (!currentContent.home.hero.media.logo) {
      currentContent.home.hero.media.logo = {}
    }
    if (!currentContent.home.hero.media.logo.heights) {
      currentContent.home.hero.media.logo.heights = {}
    }
    currentContent.home.hero.media.logo.heights.mobile = formatWithPx(updates.heroLogoHeights.mobile)
    currentContent.home.hero.media.logo.heights.tablet = formatWithPx(updates.heroLogoHeights.tablet)
    currentContent.home.hero.media.logo.heights.desktop = formatWithPx(updates.heroLogoHeights.desktop)
  }
  
  // Update hero logo path if provided
  if (updates.heroLogoPath) {
    if (!currentContent.home) {
      currentContent.home = {}
    }
    if (!currentContent.home.hero) {
      currentContent.home.hero = {}
    }
    if (!currentContent.home.hero.media) {
      currentContent.home.hero.media = {}
    }
    if (!currentContent.home.hero.media.logo) {
      currentContent.home.hero.media.logo = {}
    }
    const assetSrc = repoPathToAssetSrc(updates.heroLogoPath)
    currentContent.home.hero.media.logo.src = assetSrc
  }
  
  // Save updated content with retry logic for 409 conflicts
  const updateContentUrl = `${API_BASE_URL}/api/content/update?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  
  let updateContentResponse = await fetch(updateContentUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      newContent: currentContent,
      sha: freshContentSha,
    }),
  })
  
  // Retry once with fresh SHA if we get a 409 conflict (but only if not already a retry)
  if (updateContentResponse.status === 409 && !isRetry) {
    // Fetch fresh content and SHA again, then recursively call saveContent
    // This ensures all updates are properly re-applied to the latest content
    const retryContentResponse = await fetch(contentUrl)
    if (retryContentResponse.ok) {
      const retryContentData = await retryContentResponse.json()
      const retryFreshSha = retryContentData.sha
      
      if (retryFreshSha) {
        // Recursively call saveContent with fresh SHA - it will fetch again and apply updates
        // This is safe because we only retry once (the recursive call won't retry again)
        return saveContent(owner, repo, retryFreshSha, updates, true)
      }
    }
  }
  
  if (!updateContentResponse.ok) {
    const body = await updateContentResponse.json().catch(() => ({}))
    throw new Error(body.error || `Failed to update content: ${updateContentResponse.status}`)
  }
  
  const updateContentResult = await updateContentResponse.json()
  return {
    sha: updateContentResult.newSha || updateContentResult.sha || freshContentSha,
  }
}

/**
 * Fetches all brand settings data
 */
export async function fetchBrandSettings(
  owner: string,
  repo: string
): Promise<BrandSettingsData> {
  if (!owner || !repo) {
    throw new Error("Repository owner/name missing. Configure via organization settings.")
  }

  // Fetch content.json for page metadata and logo sizes
  const contentUrl = `${API_BASE_URL}/api/content?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  const contentResponse = await fetch(contentUrl)
  if (!contentResponse.ok) {
    throw new Error(`Failed to fetch content: ${contentResponse.status}`)
  }
  
  const contentData = await contentResponse.json()
  const websiteContent = contentData.content || {}
  
  // Fetch pages.json for logo registry and logo sizes
  let pages: any = {}
  try {
    const pagesUrl = `${API_BASE_URL}/api/pages?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
    const pagesResponse = await fetch(pagesUrl)
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      pages = pagesData.pages || {}
    }
  } catch (error) {
    console.error("Failed to fetch pages data:", error)
  }
  
  // Extract logo registry (paths are website paths, need to convert to repo paths)
  const logoRegistry = pages.logoRegistry || {}
  const primaryLogoPath = logoRegistry.primary?.path || ""
  const secondaryLogoPath = logoRegistry.secondary?.path || ""
  
  // Convert website paths to repo paths
  const primaryRepoPath = assetSrcToRepoPath(primaryLogoPath) || "public/assets/images/brand/logo.svg"
  const secondaryRepoPath = assetSrcToRepoPath(secondaryLogoPath) || "public/assets/images/brand/logo-alt.svg"
  
  // Extract loading screen logo
  const loadingScreen = pages.loadingScreen || {}
  const loadingScreenLogoSrc = loadingScreen.logo?.src || ""
  const loadingScreenRepoPath = assetSrcToRepoPath(loadingScreenLogoSrc) || "public/assets/images/brand/logo-secondary-1.svg"
  
  // Extract page metadata
  const common = websiteContent.common || {}
  const pageTitle = common.pageTitle || ""
  const pageDescription = common.pageDescription || ""
  
  // Extract global layout heights
  const navbarHeights = common.navbarHeights || { mobile: "", desktop: "" }
  const footerHeights = common.footerHeights || { mobile: "", desktop: "" }
  
  // Extract logo sizes from pages.logoSizes
  const logoSizes = pages.logoSizes || {}
  
  // Fetch branding colors
  const brandingUrl = new URL(`${API_BASE_URL}/api/branding`)
  brandingUrl.searchParams.set("owner", owner)
  brandingUrl.searchParams.set("repo", repo)
  brandingUrl.searchParams.set("brandLogoPath", primaryRepoPath)
  brandingUrl.searchParams.set("brandAltLogoPath", secondaryRepoPath)

  const brandingResponse = await fetch(brandingUrl.toString())
  if (!brandingResponse.ok) {
    throw new Error(`Request failed with status ${brandingResponse.status}`)
  }

  const brandingData = await brandingResponse.json()
  const colors: BrandingColors = {
    backgroundColor: brandingData.colors?.backgroundColor || DEFAULT_COLORS.backgroundColor,
    bodyColor: brandingData.colors?.bodyColor || DEFAULT_COLORS.bodyColor,
    accentColor1: brandingData.colors?.accentColor1 || DEFAULT_COLORS.accentColor1,
    accentColor2: brandingData.colors?.accentColor2 || DEFAULT_COLORS.accentColor2,
  }

  return {
    logos: {
      primary: {
        path: primaryRepoPath,
        url: brandingData.logos?.primary?.url,
        sha: brandingData.logos?.primary?.sha ?? null,
      },
      secondary: {
        path: secondaryRepoPath,
        url: brandingData.logos?.secondary?.url,
        sha: brandingData.logos?.secondary?.sha ?? null,
      },
      loadingScreen: {
        path: loadingScreenRepoPath,
        url: undefined,
        sha: null,
      },
      favicon: {
        path: "public/assets/images/brand/favicon.ico",
        url: undefined,
        sha: null,
      },
    },
    logoSizes: {
      navbar: {
        height: logoSizes.navbar?.height || { mobile: "", desktop: "" },
        width: logoSizes.navbar?.width || { mobile: "auto", desktop: "auto" },
      },
      footer: {
        height: logoSizes.footer?.height || { mobile: "", desktop: "" },
        width: logoSizes.footer?.width || { mobile: "auto", desktop: "auto" },
      },
      loadingScreen: {
        height: logoSizes.loadingScreen?.height || { mobile: "", desktop: "" },
        width: logoSizes.loadingScreen?.width || { mobile: "auto", desktop: "auto" },
      },
      hero: {
        height: logoSizes.hero?.height || { mobile: "", tablet: "", desktop: "" },
        width: logoSizes.hero?.width || { mobile: "auto", desktop: "auto" },
      },
      contact: {
        height: logoSizes.contact?.height || { mobile: "", desktop: "" },
        width: logoSizes.contact?.width || { mobile: "auto", desktop: "auto" },
      },
      products: {
        height: logoSizes.products?.height || { mobile: "", desktop: "" },
        width: logoSizes.products?.width || { mobile: "auto", desktop: "auto" },
      },
    },
    layoutHeights: {
      navbar: navbarHeights,
      footer: footerHeights,
    },
    pageTitle,
    pageDescription,
    colors,
  }
}

/**
 * Saves all brand settings to appropriate files
 */
export async function saveBrandSettings(
  owner: string,
  repo: string,
  settings: Partial<BrandSettingsData>,
  contentSha: string,
  pagesSha: string
): Promise<{ contentSha: string; pagesSha: string }> {
  // Save to content.json if page metadata or layout heights changed
  if (settings.pageTitle !== undefined || settings.pageDescription !== undefined || settings.layoutHeights) {
    await saveContent(owner, repo, contentSha, {
      pageTitle: settings.pageTitle,
      pageDescription: settings.pageDescription,
      layoutHeights: settings.layoutHeights,
    })
  }
  
  // Save to pages.json if logos or logo sizes changed
  // This would require a new API endpoint or updating the existing pages endpoint
  // For now, we'll handle logo uploads separately through the existing uploadLogo function
  
  return { contentSha, pagesSha }
}

