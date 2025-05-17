/**
 * PostCSS plugin to transform OKLCH colors to HEX/RGB fallbacks
 * This ensures compatibility with tools and browsers that don't support OKLCH
 */

// OKLCH to HEX color mapping
const oklchToHexMap = {
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
 * Regular expression to match OKLCH color values
 * Matches both space-separated and comma-separated formats:
 * - oklch(0.5 0.2 120)
 * - oklch(0.5, 0.2, 120)
 * - oklch(0.5 0.2 120 / 0.5)
 */
const OKLCH_REGEX = /oklch\(\s*([0-9.]+)(?:\s+|\s*,\s*)([0-9.]+)(?:\s+|\s*,\s*)([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/g;

/**
 * Fallback function for OKLCH colors not in the map
 * This is a simplified conversion that won't be accurate but provides a reasonable fallback
 */
function fallbackOklchToRgb(l, c, h, alpha = 1) {
  // Very simplified conversion - not accurate but provides a fallback
  // For accurate conversion, a proper color space conversion library would be needed
  const r = Math.round(255 * l * (1 + c * Math.cos(h * Math.PI / 180)));
  const g = Math.round(255 * l * (1 + c * Math.cos((h - 120) * Math.PI / 180)));
  const b = Math.round(255 * l * (1 + c * Math.cos((h + 120) * Math.PI / 180)));
  
  // Clamp values to valid RGB range
  const clamp = (val) => Math.max(0, Math.min(255, val));
  
  if (alpha < 1) {
    return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${alpha})`;
  }
  
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

/**
 * PostCSS plugin that transforms OKLCH colors to HEX/RGB
 */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-oklch-fallback',
    
    // Process CSS declarations (property: value pairs)
    Declaration(decl) {
      if (decl.value.includes('oklch')) {
        // First try to match from our predefined map
        let newValue = decl.value;
        
        // Replace exact matches from the map
        Object.entries(oklchToHexMap).forEach(([oklch, hex]) => {
          newValue = newValue.replace(new RegExp(oklch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), hex);
        });
        
        // If we still have oklch values, use the fallback conversion
        if (newValue.includes('oklch')) {
          newValue = newValue.replace(OKLCH_REGEX, (match, l, c, h, a) => {
            return fallbackOklchToRgb(parseFloat(l), parseFloat(c), parseFloat(h), a ? parseFloat(a) : 1);
          });
        }
        
        // Update the declaration value
        decl.value = newValue;
      }
    },
    
    // Process CSS variables
    Rule(rule) {
      if (rule.selector.includes(':root') || rule.selector.includes('.dark')) {
        rule.walkDecls((decl) => {
          if (decl.prop.startsWith('--') && decl.value.includes('oklch')) {
            // First try to match from our predefined map
            let newValue = decl.value;
            
            // Replace exact matches from the map
            Object.entries(oklchToHexMap).forEach(([oklch, hex]) => {
              newValue = newValue.replace(new RegExp(oklch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), hex);
            });
            
            // If we still have oklch values, use the fallback conversion
            if (newValue.includes('oklch')) {
              newValue = newValue.replace(OKLCH_REGEX, (match, l, c, h, a) => {
                return fallbackOklchToRgb(parseFloat(l), parseFloat(c), parseFloat(h), a ? parseFloat(a) : 1);
              });
            }
            
            // Update the declaration value
            decl.value = newValue;
          }
        });
      }
    }
  };
};

module.exports.postcss = true;
