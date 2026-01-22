/**
 * Utility functions for staggered fade-in animations
 */

/**
 * Gets the CSS class and style for a staggered fade-in animation
 * @param index - The index of the item (0-based)
 * @param baseDelay - Base delay in milliseconds (default: 100ms)
 * @returns Object with className and style for the animation
 */
export function getStaggeredAnimationProps(
  index: number,
  baseDelay: number = 100
): { className: string; style: React.CSSProperties } {
  return {
    className: "animate-fade-in-staggered",
    style: {
      "--animation-delay": index,
    } as React.CSSProperties,
  }
}

/**
 * Gets just the className for staggered animation (for use with cn utility)
 * @param index - The index of the item (0-based)
 * @returns className string
 */
export function getStaggeredAnimationClass(index: number): string {
  return "animate-fade-in-staggered"
}

/**
 * Gets just the style object for staggered animation
 * @param index - The index of the item (0-based)
 * @returns style object with CSS custom property
 */
export function getStaggeredAnimationStyle(
  index: number
): React.CSSProperties {
  return {
    "--animation-delay": index,
  } as React.CSSProperties
}
