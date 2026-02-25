/**
 * Type definitions for designTokens.json structure
 */

export interface PrimaryColors {
  background?: string;
  body?: string;
  accent1?: string;
  accent2?: string;
  cta?: string;
}

export interface SemanticColors {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
}

export interface Colors {
  primary?: PrimaryColors;
  semantic?: SemanticColors;
}

export interface Fonts {
  heading?: string;
  body?: string;
  serif?: string;
}

export interface Spacing {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
  "3xl"?: string;
}

export interface Breakpoints {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

export interface BorderRadius {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
  full?: string;
}

export interface Shadows {
  sm?: string;
  md?: string;
  lg?: string;
}

export interface DesignTokens {
  colors?: Colors;
  fonts?: Fonts;
  spacing?: Spacing;
  breakpoints?: Breakpoints;
  borderRadius?: BorderRadius;
  shadows?: Shadows;
}
