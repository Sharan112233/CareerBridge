// lib/locations.js
//
// Central registry of cities for which we generate SEO landing pages.
// Each entry maps a URL slug → display label → list of search aliases.
// Aliases let us match jobs whose `location` column uses a different
// spelling (e.g. "Bengaluru" should match the "bangalore" landing page).
//
// To add a new city:
//   1. Add an entry below
//   2. Done. Sitemap, landing page, and validation pick it up automatically.

export const LOCATIONS = [
  { slug: 'bangalore', label: 'Bangalore', aliases: ['bangalore', 'bengaluru', 'blr'] },
  { slug: 'mumbai',    label: 'Mumbai',    aliases: ['mumbai', 'bombay'] },
  { slug: 'hyderabad', label: 'Hyderabad', aliases: ['hyderabad', 'hyd'] },
  { slug: 'pune',      label: 'Pune',      aliases: ['pune'] },
  { slug: 'chennai',   label: 'Chennai',   aliases: ['chennai', 'madras'] },
  { slug: 'delhi',     label: 'Delhi',     aliases: ['delhi', 'new delhi', 'ncr'] },
  { slug: 'gurgaon',   label: 'Gurgaon',   aliases: ['gurgaon', 'gurugram'] },
  { slug: 'noida',     label: 'Noida',     aliases: ['noida'] },
  { slug: 'kolkata',   label: 'Kolkata',   aliases: ['kolkata', 'calcutta'] },
  { slug: 'ahmedabad', label: 'Ahmedabad', aliases: ['ahmedabad'] },
  { slug: 'kochi',     label: 'Kochi',     aliases: ['kochi', 'cochin'] },
  { slug: 'coimbatore',label: 'Coimbatore',aliases: ['coimbatore'] },
  { slug: 'indore',    label: 'Indore',    aliases: ['indore'] },
  { slug: 'jaipur',    label: 'Jaipur',    aliases: ['jaipur'] },
  { slug: 'chandigarh',label: 'Chandigarh',aliases: ['chandigarh'] },
];

// Quick-lookup Set of all valid slugs (e.g. for getStaticPaths)
export const LOCATION_SLUGS = new Set(LOCATIONS.map((l) => l.slug));

// slug → full entry. Returns undefined if not found.
export function getLocation(slug) {
  return LOCATIONS.find((l) => l.slug === slug);
}

// Returns true if a job's `location` field matches the given location slug.
// Case-insensitive substring match against any alias.
//
// Example: filterByLocation({ location: 'Bengaluru, India' }, 'bangalore') → true
//          filterByLocation({ location: 'Bengaluru, India' }, 'mumbai')    → false
export function jobMatchesLocation(job, locationSlug) {
  const loc = getLocation(locationSlug);
  if (!loc) return false;
  const jobLoc = (job.location || '').toLowerCase();
  if (!jobLoc) return false;
  return loc.aliases.some((alias) => jobLoc.includes(alias));
}