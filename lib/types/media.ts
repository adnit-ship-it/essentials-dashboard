/**
 * Type definitions for media.json structure
 */

export interface IconRegistryEntry {
  type: string;
  path: string;
  description: string;
}

export type IconRegistry = Record<string, IconRegistryEntry>;

export interface LogoRegistryEntry {
  type: string;
  path: string;
  description: string;
}

export type LogoRegistry = Record<string, LogoRegistryEntry>;

export interface ImageRegistryEntry {
  id: string;
  path: string;
  alt: string;
}

export type ImageRegistry = Record<string, ImageRegistryEntry>;

export interface MediaData {
  iconRegistry?: IconRegistry;
  logoRegistry?: LogoRegistry;
  imageRegistry?: ImageRegistry;
}
