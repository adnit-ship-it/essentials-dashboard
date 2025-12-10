/**
 * Types for branding data and operations
 */

export type BrandingColors = {
  backgroundColor: string
  bodyColor: string
  accentColor1: string
  accentColor2: string
}

export type LogoSlot = "primary" | "secondary" // Legacy - kept for backward compatibility

export type PageName = "home" | "about" | "products" | "contact"
export type LogoLocation = "navbar" | "footer"
export type PageKey = "/" | "/about" | "/products" | "/contact" // Removed "common"

export type LogoIdentifier = {
  page: PageName
  location: LogoLocation
}

export type PendingUpload = {
  base64: string
  dataUrl: string
  fileName: string
  mimeType: string
  fileSize: number
}

export type LogoState = {
  path: string
  url?: string
  sha?: string | null
  pendingUpload?: PendingUpload | null
}

// New structure: logos organized by page and location
export type PageLogoState = Record<PageName, Record<LogoLocation, LogoState>>

export type LogoHeights = {
  navbar: {
    mobile: string
    desktop: string
  }
  navbarLogo: {
    mobile: string
    tablet: string
    desktop: string
  }
  footer: {
    mobile: string
    desktop: string
  }
  footerLogo: {
    mobile: string
    desktop: string
  }
}

export type HeroLogoHeights = {
  mobile: string
  tablet: string
  desktop: string
}

export type LogoWidths = {
  mobile: string | "auto"
  tablet?: string | "auto"
  desktop: string | "auto"
}

export type LogoSize = {
  height: {
    mobile: string
    tablet?: string
    desktop: string
  }
  width: LogoWidths
}

export type GlobalLayoutHeights = {
  navbar: {
    mobile: string
    tablet?: string
    desktop: string
  }
  footer: {
    mobile: string
    tablet?: string
    desktop: string
  }
}

export type BrandSettingsData = {
  logos: {
    primary: LogoState
    secondary: LogoState
    loadingScreen: LogoState
    favicon: LogoState
  }
  logoSizes: {
    navbar: LogoSize
    footer: LogoSize
    loadingScreen: LogoSize
    hero: LogoSize
    contact: LogoSize
    products: LogoSize
  }
  layoutHeights: GlobalLayoutHeights
  pageTitle: string
  pageDescription: string
  colors: BrandingColors
}

export type BrandingData = {
  colors: BrandingColors
  logos: Record<LogoSlot, LogoState> // Legacy - kept for backward compatibility
  pageLogos: PageLogoState // New structure
  tailwindSha: string | null
  pageTitle: string
  contentSha: string | null
  logoHeights: Record<PageKey, LogoHeights>
  heroLogoHeights: HeroLogoHeights | null
  heroLogo: LogoState
}

export type LogoUpload = {
  slot: LogoSlot // Legacy
  page?: PageName // New
  location?: LogoLocation // New
  path: string
  base64: string
  // Removed: sha, previousPath, previousSha, isSamePath - always creating new files now
}

export type LogoUploadResult = {
  url?: string
  sha?: string | null
  path: string
}


