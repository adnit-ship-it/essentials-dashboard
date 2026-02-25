/**
 * Default section content for new sections, keyed by registry id.
 * Returns minimal skeleton structures that match template expectations.
 */

import type { Section } from "@/lib/types/sections"

/**
 * Minimal component skeletons per section type.
 * Keys match SectionRegistryEntry.id from sections-registry.json.
 */
const SECTION_SKELETONS: Record<string, Record<string, any>> = {
  hero: {
    heading: { text: "New Section", type: "text", color: "bodyColor", show: true },
    subheading: { text: "Add your content here", type: "text", color: "bodyColor", show: true },
    logo: { src: "", alt: "", type: "svg-image", show: true },
    ctaButton: { type: "button", text: "Learn More", color: "white", backgroundColor: "accentColor1", show: true },
    media: { background: { src: "", alt: "" } },
  },
  "hero-minimal": {
    heading: { text: "New Section", type: "text", color: "bodyColor", show: true },
    subheading: { text: "Add your content here", type: "text", color: "bodyColor", show: true },
    media: { background: { src: "", alt: "" } },
  },
  features: {
    features: [
      { text: "Feature 1", iconType: "checkmark-star", iconColor: "#AA992C" },
      { text: "Feature 2", iconType: "checkmark-star", iconColor: "#AA992C" },
    ],
    marqueeSpeed: 50,
    background: { color: "accentColor1" },
  },
  marquee: {
    features: [
      { text: "Feature 1", iconType: "checkmark-star", iconColor: "#AA992C" },
      { text: "Feature 2", iconType: "checkmark-star", iconColor: "#AA992C" },
    ],
    marqueeSpeed: 50,
    background: { color: "accentColor1" },
  },
  "trusted-by": {
    heading: { text: "Trusted By", type: "text", color: "bodyColor", show: true },
    marqueeSpeed: 50,
    logos: [],
  },
  cta: {
    heading: { text: "Call to Action", type: "text", color: "bodyColor", show: true },
    subheading: { text: "Add your message here", type: "text", color: "bodyColor", show: true },
    button: { text: "Get Started", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true },
    media: { image: { src: "", alt: "", type: "image", show: true } },
  },
  discover: {
    heading: { text: "Discover", type: "text", color: "bodyColor", show: true },
    subheading: { text: "Explore our offerings", type: "text", color: "bodyColor", show: true },
    productCard: { type: "product", productId: null, button: { text: "Learn More", type: "button", color: "accentColor1", show: true } },
    media: { background: { src: "", alt: "" } },
  },
  journey: {
    heading: { text: "Our Journey", type: "text", color: "bodyColor", show: true },
    button: { text: "Start Today", type: "button", color: "accentColor1", backgroundColor: "accentColor1", show: true },
    media: { background: { src: "", alt: "" } },
  },
  faq: {
    heading: { text: "FAQ", type: "text", color: "bodyColor", show: true },
    faq: { items: [] },
  },
  stats: {
    heading: { text: "Statistics", type: "text", color: "bodyColor", show: true },
    stats: [],
  },
}

/**
 * Fallback section types when sections-registry.json is empty or missing
 */
export const FALLBACK_SECTION_TYPES = [
  { id: "hero", name: "Hero", component: "HeroSection", description: "Hero with heading, subheading, logo, media" },
  { id: "features", name: "Features", component: "FeaturesSection", description: "Features list with icons" },
  { id: "trusted-by", name: "Trusted By", component: "TrustedBySection", description: "Logo marquee" },
  { id: "cta", name: "CTA", component: "CTASection", description: "Call to action block" },
  { id: "marquee", name: "Marquee", component: "MarqueeSection", description: "Scrolling marquee" },
] as const

/**
 * Get default section content for a new section.
 * @param registryId - Section type id from sections-registry.json (e.g. "hero", "features")
 * @param sectionName - Display name for the section (e.g. "Blog Hero")
 */
export function getDefaultSectionContent(
  registryId: string,
  sectionName: string
): Section {
  const skeleton = SECTION_SKELETONS[registryId] ?? {
    heading: { text: sectionName, type: "text", color: "bodyColor", show: true },
    subheading: { text: "Add your content here", type: "text", color: "bodyColor", show: true },
  }

  return {
    name: sectionName,
    components: [skeleton],
  }
}
