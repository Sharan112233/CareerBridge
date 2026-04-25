// lib/constants.js

export const SITE_NAME = 'CareerBridge';
export const SITE_DOMAIN = 'careerbridge.com';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://careerbridge.com';
export const SITE_TAGLINE = 'Latest Job Openings from Top Companies';
export const SITE_DESCRIPTION =
  'Find the latest job openings from Wipro, Infosys, TCS, Accenture and 50+ companies. Updated daily. Apply directly on the official company website.';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@careerbridge.com';

// Map URL-friendly category slugs to DB values
export const CATEGORY_SLUG_MAP = {
  'it-jobs': { db: 'IT', label: 'IT Jobs' },
  'bpo-jobs': { db: 'BPO', label: 'BPO Jobs' },
  'bfsi-jobs': { db: 'BFSI', label: 'Banking & Finance Jobs' },
  'core-jobs': { db: 'CORE', label: 'Core Engineering Jobs' },
};

// Homepage filter chips
export const CATEGORIES_UI = ['All', 'IT Jobs', 'BPO Jobs', 'Fresher'];

// Reserved top-level paths — [slug].js must NOT match these.
// If you ever add a new top-level page, add its slug here.
export const RESERVED_SLUGS = new Set([
  'about', 'privacy', 'disclaimer', 'terms', 'contact',
  'blog', 'admin', 'api',
  'fresher-jobs',
  'category', 'company',
  '404', '500',
  'sitemap.xml', 'robots.txt', 'ads.txt', 'favicon.ico',
  '_next', '_app', '_document',
]);