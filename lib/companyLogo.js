// lib/companyLogo.js
//
// Single source of truth for company logo lookup.
//
// Strategy:
//   1. Convert company name → slug (e.g. "Tech Mahindra" → "tech-mahindra")
//   2. If we have an SVG file for that slug in /public/logos/, return its path
//   3. Otherwise, return null and let the caller render the colored-letter fallback
//
// To add a new logo:
//   1. Save the SVG file to /public/logos/{slug}.svg
//   2. Add the slug to AVAILABLE_LOGOS below
//
// Why a manifest array instead of trying to fetch and detecting 404?
//   - Faster (no network probe, decision is sync)
//   - No flash of broken-image icon
//   - Works in SSR
//   - Predictable behavior

// ─── Companies for which we have an SVG in /public/logos/ ───────────
// Keep alphabetized for sanity. Each entry must match a file in public/logos/
// EXACTLY: case-insensitive, hyphenated, .svg extension.
//
// Example: 'tcs'  →  /public/logos/tcs.svg
//          'tech-mahindra'  →  /public/logos/tech-mahindra.svg
// used https://worldvectorlogo.com/ for downloading svg
export const AVAILABLE_LOGOS = new Set([
  'accenture',
  'amazon',
  'capgemini',
  'cognizant',
  'concentrix',
  'deloitte',
  'ey',
  'genpact',
  'google',
  'hcl',
  'ibm',
  'infosys',
  'kpmg',
  'lt',
  'ltimindtree',
  'microsoft',
  'pwc',
  'tcs',
  'tech-mahindra',
  'wipro',
  'sony',
  'bosch',
'mahindra',
'tata-motors',
'reliance-industries',
'zoho',
'razorpay',
'swiggy',
'flipkart',
'zomato',
'phonepe',
'paytm',
'bajaj-finserv',
'icici',
'hdfc',
'teleperformance',
'just-global',
'hexaware-technologies',
]);

// Convert a company name into a filesystem-safe slug.
// "Tech Mahindra"   → "tech-mahindra"
// "L&T Technology"  → "lt-technology"
// "PwC India"       → "pwc-india"
// "EY"              → "ey"
export function companyNameToSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/&/g, '')             // strip ampersands
    .replace(/[^a-z0-9\s-]/g, '')  // drop punctuation
    .trim()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-');          // collapse double hyphens
}

// Extract initials for the colored-letter fallback.
// "Tata Consultancy Services" → "TC"
// "Wipro"                     → "WI"
// "L&T"                       → "L"  (after & is stripped)
export function companyInitials(name) {
  if (!name) return 'CO';
  const cleaned = name.replace(/&/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'CO';
  if (words.length === 1) {
    // Single word: take first 2 chars
    return words[0].slice(0, 2).toUpperCase();
  }
  // Multi-word: first letter of first 2 words
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Returns the public URL of the SVG logo, or null if we don't have one.
// The caller decides how to render the fallback.
export function getCompanyLogoUrl(name) {
  const slug = companyNameToSlug(name);
  if (!slug) return null;

  // Try the slug as-is first
  if (AVAILABLE_LOGOS.has(slug)) {
    return `/logos/${slug}.svg`;
  }

  // Try just the first word — handles "Wipro Limited" matching "wipro.svg"
  // This is opt-in via the prefix match, not aggressive substring matching.
  const firstWord = slug.split('-')[0];
  if (firstWord && firstWord !== slug && AVAILABLE_LOGOS.has(firstWord)) {
    return `/logos/${firstWord}.svg`;
  }

  return null;
}