/**
 * Type definitions for common.json structure
 */

export interface LogoSizes {
  navbar?: LogoSizeConfig;
  footer?: LogoSizeConfig;
  loadingScreen?: LogoSizeConfig;
}

export interface LogoSizeConfig {
  height?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  width?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export interface LayoutLogo {
  src: string;
  alt: string;
}

export interface NavbarConfig {
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  logo: LayoutLogo;
  backgroundColor: string;
  textColor: string;
}

export interface FooterConfig {
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  logo: LayoutLogo;
  backgroundColor: string;
  textColor: string;
}

export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  link?: string;
  backgroundColor: string;
  textColor: string;
  heights: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export interface LoadingScreenConfig {
  logo: LayoutLogo;
  text: string;
}

export interface SectionSpacing {
  default?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export interface CommonStrings {
  pageTitle?: string;
  pageDescription?: string;
  buttons?: Record<string, string>;
  navigation?: Record<string, string>;
  accessibility?: Record<string, string>;
  media?: Record<string, any>;
}

export interface CommonData {
  logoSizes?: LogoSizes;
  navbar?: NavbarConfig;
  footer?: FooterConfig;
  announcement?: AnnouncementConfig;
  loadingScreen?: LoadingScreenConfig;
  sectionSpacing?: SectionSpacing;
  protectedPages?: string[];
  strings?: CommonStrings;
}
