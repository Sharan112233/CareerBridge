// components/CompanyLogo.js
//
// Renders a company's logo as an SVG image if we have one in /public/logos/,
// otherwise falls back to a colored box with the company's initials.
//
// Used in JobCard, RecentlyViewedJobs, and the job detail header — anywhere
// that previously rendered the colored-letter box manually.
//
// Performance:
//   - SVGs are <img> tags with loading="lazy" so off-screen logos don't load
//   - Explicit width/height prevents layout shift (CLS = 0)
//   - SVG files are 1-3 KB each, CDN-cached for 1 year
//   - If the SVG fails to load (network error, file missing), onError swaps
//     to the colored fallback automatically — never a broken-image icon

import React from 'react';
import { getCompanyLogoUrl, companyInitials } from '../lib/companyLogo';

// Soft-coded brand colors for the fallback letter box.
// Matches the existing palette from the original JobCard.
const COMPANY_COLORS = {
  Wipro: '#1a73e8', Infosys: '#007DC1', TCS: '#003087',
  Accenture: '#A100FF', HCL: '#0076C0', Cognizant: '#1DA462',
  Amazon: '#FF9900', Google: '#4285F4', Microsoft: '#00A4EF',
  Capgemini: '#0070AD',
};

export default function CompanyLogo({
  company,
  size = 48,
  borderRadius = 10,
  fontSize,        // overridden if you want different text scale
  fallbackColor,   // overridden if you want a specific color
  className,
  style,
}) {
  // useState so we can flip to the fallback if the SVG 404s at runtime
  const [imgFailed, setImgFailed] = React.useState(false);

  const safeName = company || 'Company';
  const logoUrl = getCompanyLogoUrl(safeName);
  const initials = companyInitials(safeName);
  const bg = fallbackColor || COMPANY_COLORS[safeName] || '#2563EB';

  // Default text size scales with box size (3:8 ratio matches the original)
  const computedFontSize = fontSize ?? Math.round(size * 0.34);

  const boxStyle = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  };

  // Render real SVG if we have it AND it hasn't failed at runtime
  if (logoUrl && !imgFailed) {
    return (
      <div
        className={className}
        style={{
          ...boxStyle,
          // White background gives most brand logos contrast.
          // SVGs in /public/logos/ should be designed to look good on white.
          background: '#fff',
          border: '1px solid var(--border)',
        }}
      >
        <img
          src={logoUrl}
          alt={`${safeName} logo`}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{
            // 80% so logo has a little white margin — looks nicer than edge-to-edge
            width: '80%',
            height: '80%',
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  // Fallback: colored box with initials (the original design)
  return (
    <div
      className={className}
      style={{ ...boxStyle, background: bg }}
      aria-label={`${safeName} logo`}
    >
      <span
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: computedFontSize,
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </span>
    </div>
  );
}