/**
 * Utility functions for color conversion and handling
 * Used to convert OKLCH colors to more widely supported formats
 */

// Map of common OKLCH colors to their HEX equivalents
export const oklchToHexMap: Record<string, string> = {
  // Light mode colors
  'oklch(1 0 0)': '#ffffff', // white
  'oklch(0.147 0.004 49.25)': '#262626', // dark gray
  'oklch(0.985 0.001 106.423)': '#fafafa', // off-white
  'oklch(0.216 0.006 56.043)': '#333333', // darker gray
  'oklch(0.97 0.001 106.424)': '#f5f5f5', // light gray
  'oklch(0.553 0.013 58.071)': '#737373', // medium gray
  'oklch(0.577 0.245 27.325)': '#e53e3e', // red
  'oklch(0.923 0.003 48.717)': '#e5e5e5', // lighter gray
  'oklch(0.709 0.01 56.259)': '#a3a3a3', // gray
  'oklch(0.646 0.222 41.116)': '#d97706', // amber
  'oklch(0.6 0.118 184.704)': '#0ea5e9', // sky blue
  'oklch(0.398 0.07 227.392)': '#3b82f6', // blue
  'oklch(0.828 0.189 84.429)': '#84cc16', // lime
  'oklch(0.769 0.188 70.08)': '#eab308', // yellow

  // Dark mode colors
  'oklch(0.704 0.191 22.216)': '#f56565', // lighter red
  'oklch(0.488 0.243 264.376)': '#4f46e5', // indigo
  'oklch(0.696 0.17 162.48)': '#0ea5e9', // sky blue
  'oklch(0.627 0.265 303.9)': '#9333ea', // purple
  'oklch(0.645 0.246 16.439)': '#e11d48', // rose
  'oklch(0.268 0.007 34.298)': '#404040', // dark gray
};

/**
 * Replaces OKLCH colors in a style string with their HEX equivalents
 * @param styleString - CSS style string that may contain OKLCH colors
 * @returns CSS style string with OKLCH colors replaced by HEX colors
 */
export function replaceOklchWithHex(styleString: string): string {
  if (!styleString || !styleString.includes('oklch')) {
    return styleString;
  }

  let result = styleString;
  
  // Replace exact matches from the map
  Object.entries(oklchToHexMap).forEach(([oklch, hex]) => {
    result = result.replace(new RegExp(oklch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), hex);
  });
  
  // Handle any remaining oklch() functions with a default color
  result = result.replace(/oklch\([^)]+\)/g, '#000000');
  
  return result;
}

/**
 * Processes an HTML element and its children to replace OKLCH colors with HEX equivalents
 * @param element - The HTML element to process
 */
export function processElementStyles(element: HTMLElement): void {
  if (!element) return;
  
  // Process the element's inline style
  const style = element.getAttribute('style');
  if (style && style.includes('oklch')) {
    element.setAttribute('style', replaceOklchWithHex(style));
  }
  
  // Process computed styles that might be using CSS variables with OKLCH values
  try {
    const computedStyle = window.getComputedStyle(element);
    
    // Apply computed styles directly to ensure consistent rendering
    if (computedStyle.color.includes('oklch')) {
      element.style.color = '#000000'; // Default to black
    }
    
    if (computedStyle.backgroundColor.includes('oklch')) {
      element.style.backgroundColor = 'transparent';
    }
    
    if (computedStyle.borderColor.includes('oklch')) {
      element.style.borderColor = '#cccccc'; // Default to light gray
    }
  } catch (error) {
    console.error('Error processing computed styles:', error);
  }
  
  // Process all child elements
  Array.from(element.children).forEach(child => {
    if (child instanceof HTMLElement) {
      processElementStyles(child);
    }
  });
}
