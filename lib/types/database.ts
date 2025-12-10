// Database type definitions

export interface Template {
  id: string
  created_at: string
  name: string
  default_site_text: any // JSONB
  default_brand_colors: any // JSONB
  default_form_ids: string[] // Array of text
  default_logo_url: string
  default_alt_logo_url: string
}

export interface Organization {
  id: string
  created_at: string
  name: string
  template_id: string // UUID
  api_key: string
  logo_url: string
  logo_alt_url: string
  brand_colors: any // JSONB
  website_text: any // JSONB
}

// Brand colors structure (used within brand_colors JSONB)
export interface BrandColors {
  background: string
  accent1: string
  accent2: string
  body: string
}

// Website text structure (used within website_text JSONB)
export interface WebsiteText {
  home: any
  about: any
  common: any
  contact: any
  products: any
}